import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OperacaoAuditoria } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';
import {
  BuscarProdutosDto,
  ConsultarAplicacaoVeicularDto,
  ConsultarProdutosDto,
  CreateProductDto,
  CreateProductIdentifierDto,
  CreateVehicleApplicationDto,
  InitialProductStockDto,
  ProductCostDto,
  ProductIdentifierType,
  ProductPriceDto,
  ProductQualityStatus,
  ProductResponseDto,
  ProductStatus,
  ProductTaxProfileDto,
  ProductType,
  StockAdjustmentDto,
  StockMovementType,
  UpdateProductDto,
  VehicleApplicationResponseDto,
} from '../dto/produto.dto';
import { ProdutoMapper } from '../mappers/produto.mapper';

type PrismaClientLike = PrismaService | any;

@Injectable()
export class ProdutosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async criar(dto: CreateProductDto): Promise<ProductResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();
    const sku = this.normalizarCodigoOpcional(dto.sku);

    const response = await this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.validarSkuDisponivel(tx, tenantId, sku);

      const catalogRefs = await this.resolverReferenciasCatalogo(tx, tenantId, dto);
      const identifiers = this.montarIdentificadores(dto);
      await this.validarIdentificadoresDisponiveis(tx, tenantId, identifiers);

      const salePrice = dto.pricing?.salePrice ?? dto.price;
      const product = await tx.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          shortDescription: dto.shortDescription,
          fiscalDescription: dto.fiscalDescription,
          complementaryDescription: dto.complementaryDescription,
          sku,
          price: dto.price,
          unitOfMeasure: dto.unitOfMeasure ?? 'UN',
          status: dto.status ?? ProductStatus.ATIVO,
          type: dto.type ?? ProductType.MERCADORIA_REVENDA,
          internalNotes: dto.internalNotes,
          lastChangedBy: usuario.sub,
          tenantId,
          ...catalogRefs,
          identifiers: identifiers.length ? { create: identifiers.map((identifier) => ({ tenantId, ...identifier })) } : undefined,
          taxProfile: dto.taxProfile ? { create: this.mapTaxProfile(tenantId, dto.taxProfile) } : undefined,
          pricing: {
            create: this.mapPrice(tenantId, {
              salePrice,
              promotionalPrice: dto.pricing?.promotionalPrice,
              minSalePrice: dto.pricing?.minSalePrice,
              desiredMargin: dto.pricing?.desiredMargin,
              maxDiscountPercent: dto.pricing?.maxDiscountPercent,
              commissionPercent: dto.pricing?.commissionPercent,
            }),
          },
          cost: dto.cost ? { create: this.mapCost(tenantId, dto.cost) } : undefined,
        },
        include: this.includeProduct(),
      });

      if (dto.initialStock) {
        await this.criarEstoqueInicial(tx, tenantId, product.id, dto.initialStock, usuario.sub);
      }

      await this.recalcularQualidade(tx, tenantId, product.id);
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.CRIAR, product.id, null, product);

      return ProdutoMapper.toResponse(await this.buscarProdutoCompleto(tx, tenantId, product.id));
    });

    return response;
  }

  async listar(filtros: ConsultarProdutosDto) {
    const tenantId = this.tenantContext.getTenantId();
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const sortBy = filtros.sortBy ?? 'name';
    const sortOrder = filtros.sortOrder ?? 'asc';
    const where = this.montarFiltros(tenantId, filtros);

    const [products, total] = await this.db().$transaction([
      this.db().product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.includeProduct(),
      }),
      this.db().product.count({ where }),
    ]);

    return {
      dados: products.map((product: any) => ProdutoMapper.toResponse(product)),
      paginacao: {
        total,
        pagina: page,
        itensPorPagina: limit,
        totalPaginas: Math.ceil(total / limit),
      },
    };
  }

  async buscar(filtros: BuscarProdutosDto) {
    const tenantId = this.tenantContext.getTenantId();
    const query = filtros.q.trim();
    if (!query) throw new BadRequestException('Termo de busca e obrigatorio.');

    const result = await this.listar({
      q: query,
      page: filtros.page,
      limit: filtros.limit,
      includeInactive: false,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    await this.registrarBusca(tenantId, query, 'search', result.paginacao.total);
    return result;
  }

  async buscarPorId(id: string): Promise<ProductResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    return ProdutoMapper.toResponse(await this.buscarProdutoCompleto(this.db(), tenantId, id));
  }

  async buscarPorCodigoBarras(barcode: string): Promise<ProductResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const normalizedCode = this.normalizarCodigoObrigatorio(barcode, 'codigo de barras');
    const identifier = await this.db().productIdentifier.findFirst({
      where: {
        tenantId,
        normalizedCode,
        isActive: true,
        type: { in: this.barcodeTypes() },
      },
      include: { product: { include: this.includeProduct() } },
    });

    await this.registrarBusca(tenantId, barcode, 'barcode', identifier ? 1 : 0, identifier?.productId);
    if (!identifier) throw new NotFoundException(`Produto com codigo de barras "${barcode}" nao encontrado.`);
    return ProdutoMapper.toResponse(identifier.product);
  }

  async buscarPorOem(code: string): Promise<ProductResponseDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const normalizedCode = this.normalizarCodigoObrigatorio(code, 'codigo OEM');
    const identifiers = await this.db().productIdentifier.findMany({
      where: {
        tenantId,
        normalizedCode,
        isActive: true,
        type: ProductIdentifierType.CODIGO_OEM,
      },
      include: { product: { include: this.includeProduct() } },
    });

    await this.registrarBusca(tenantId, code, 'oem', identifiers.length);
    return identifiers.map((identifier: any) => ProdutoMapper.toResponse(identifier.product));
  }

  async atualizar(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const response = await this.db().$transaction(async (tx: PrismaClientLike) => {
      const anterior = await this.buscarProdutoCompleto(tx, tenantId, id);
      const sku = dto.sku !== undefined ? this.normalizarCodigoOpcional(dto.sku) : undefined;

      if (sku !== undefined) await this.validarSkuDisponivel(tx, tenantId, sku, id);

      const catalogRefs = await this.resolverReferenciasCatalogo(tx, tenantId, dto);
      const data: Record<string, unknown> = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
        ...(dto.fiscalDescription !== undefined && { fiscalDescription: dto.fiscalDescription }),
        ...(dto.complementaryDescription !== undefined && { complementaryDescription: dto.complementaryDescription }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.unitOfMeasure !== undefined && { unitOfMeasure: dto.unitOfMeasure }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.internalNotes !== undefined && { internalNotes: dto.internalNotes }),
        ...(sku !== undefined && { sku }),
        lastChangedBy: usuario.sub,
        ...catalogRefs,
      };

      await tx.product.update({
        where: { product_id_tenantId: { id, tenantId } },
        data,
      });

      if (dto.identifiers !== undefined || dto.barcode !== undefined) {
        await this.sincronizarIdentificadores(tx, tenantId, id, dto.identifiers, dto.barcode);
      }

      if (dto.taxProfile) await this.upsertTaxProfileTx(tx, tenantId, id, dto.taxProfile);
      if (dto.pricing || dto.price !== undefined) {
        await this.upsertPriceTx(tx, tenantId, id, {
          salePrice: dto.pricing?.salePrice ?? dto.price ?? anterior.price,
          promotionalPrice: dto.pricing?.promotionalPrice,
          minSalePrice: dto.pricing?.minSalePrice,
          desiredMargin: dto.pricing?.desiredMargin,
          maxDiscountPercent: dto.pricing?.maxDiscountPercent,
          commissionPercent: dto.pricing?.commissionPercent,
        });
      }
      if (dto.cost) await this.upsertCostTx(tx, tenantId, id, dto.cost);

      await this.recalcularQualidade(tx, tenantId, id);
      const atualizado = await this.buscarProdutoCompleto(tx, tenantId, id);
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, anterior, atualizado);
      return ProdutoMapper.toResponse(atualizado);
    });

    return response;
  }

  async remover(id: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    await this.db().$transaction(async (tx: PrismaClientLike) => {
      const product = await this.buscarProdutoCompleto(tx, tenantId, id);
      await tx.product.update({
        where: { product_id_tenantId: { id, tenantId } },
        data: {
          status: ProductStatus.INATIVO,
          lastChangedBy: usuario.sub,
        },
      });
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.DESATIVAR, id, product, { status: ProductStatus.INATIVO });
    });
  }

  async obterTaxProfile(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    await this.garantirProdutoExiste(this.db(), tenantId, id);
    const profile = await this.db().productTaxProfile.findUnique({ where: { productId: id } });
    if (!profile) throw new NotFoundException(`Perfil fiscal do produto "${id}" ainda nao cadastrado.`);
    return this.omitirCamposInternos(profile);
  }

  async atualizarTaxProfile(id: string, dto: ProductTaxProfileDto) {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const profile = await this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.garantirProdutoExiste(tx, tenantId, id);
      const result = await this.upsertTaxProfileTx(tx, tenantId, id, dto);
      await this.recalcularQualidade(tx, tenantId, id);
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, null, { taxProfile: result });
      return result;
    });

    return this.omitirCamposInternos(profile);
  }

  async obterPrecos(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    await this.garantirProdutoExiste(this.db(), tenantId, id);
    const pricing = await this.db().productPrice.findUnique({ where: { productId: id } });
    if (!pricing) throw new NotFoundException(`Preco do produto "${id}" ainda nao cadastrado.`);
    return this.omitirCamposInternos(pricing);
  }

  async atualizarPrecos(id: string, dto: ProductPriceDto) {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const pricing = await this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.garantirProdutoExiste(tx, tenantId, id);
      const result = await this.upsertPriceTx(tx, tenantId, id, dto);
      await tx.product.update({ where: { product_id_tenantId: { id, tenantId } }, data: { price: dto.salePrice } });
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, null, { pricing: result });
      return result;
    });

    return this.omitirCamposInternos(pricing);
  }

  async obterCustos(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    await this.garantirProdutoExiste(this.db(), tenantId, id);
    const cost = await this.db().productCost.findUnique({ where: { productId: id } });
    if (!cost) throw new NotFoundException(`Custo do produto "${id}" ainda nao cadastrado.`);
    return this.omitirCamposInternos(cost);
  }

  async atualizarCustos(id: string, dto: ProductCostDto) {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const cost = await this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.garantirProdutoExiste(tx, tenantId, id);
      const result = await this.upsertCostTx(tx, tenantId, id, dto);
      await this.recalcularQualidade(tx, tenantId, id);
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, null, { cost: result });
      return result;
    });

    return this.omitirCamposInternos(cost);
  }

  async listarEstoque(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    await this.garantirProdutoExiste(this.db(), tenantId, id);

    return this.db().productStock.findMany({
      where: { tenantId, productId: id },
      include: { warehouse: true, location: true },
      orderBy: [{ warehouse: { code: 'asc' } }, { location: { code: 'asc' } }],
    });
  }

  async ajustarEstoque(id: string, dto: StockAdjustmentDto) {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    return this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.garantirProdutoExiste(tx, tenantId, id);
      const warehouse = await this.resolverWarehouse(tx, tenantId, dto);
      const location = await this.resolverLocation(tx, tenantId, warehouse.id, dto);
      const whereStock = {
        tenantId,
        productId: id,
        warehouseId: warehouse.id,
        locationId: location?.id ?? null,
      };

      const stock = await tx.productStock.findFirst({ where: whereStock });
      const currentStock = this.toNumber(stock?.currentStock);
      const reservedStock = this.toNumber(stock?.reservedStock);
      const delta = dto.type === StockMovementType.INVENTARIO
        ? dto.quantity - currentStock
        : this.calcularDeltaEstoque(dto.type, dto.quantity);
      const nextStock = currentStock + delta;

      if (nextStock < 0) {
        throw new BadRequestException('Ajuste resultaria em estoque negativo. Revise quantidade ou tipo de movimento.');
      }

      const updatedStock = stock
        ? await tx.productStock.update({
          where: { id: stock.id },
          data: {
            currentStock: nextStock,
            availableStock: Math.max(nextStock - reservedStock, 0),
            lastMovementAt: new Date(),
          },
          include: { warehouse: true, location: true },
        })
        : await tx.productStock.create({
          data: {
            ...whereStock,
            currentStock: nextStock,
            availableStock: nextStock,
            lastMovementAt: new Date(),
          },
          include: { warehouse: true, location: true },
        });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          warehouseId: warehouse.id,
          toLocationId: location?.id,
          type: dto.type,
          quantity: delta,
          balanceAfter: nextStock,
          reference: dto.reference,
          reason: dto.reason,
          createdBy: usuario.sub,
        },
      });

      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, null, { stock: updatedStock });
      return updatedStock;
    });
  }

  async listarMovimentos(id: string) {
    const tenantId = this.tenantContext.getTenantId();
    await this.garantirProdutoExiste(this.db(), tenantId, id);

    return this.db().stockMovement.findMany({
      where: { tenantId, productId: id },
      include: { warehouse: true, fromLocation: true, toLocation: true },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  async adicionarAplicacao(id: string, dto: CreateVehicleApplicationDto): Promise<VehicleApplicationResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    if (!dto.vehicleMakeId && !dto.makeName) {
      throw new BadRequestException('Informe a montadora da aplicacao veicular.');
    }
    if (!dto.vehicleModelId && !dto.modelName) {
      throw new BadRequestException('Informe o modelo da aplicacao veicular.');
    }
    if (dto.yearStart && dto.yearEnd && dto.yearStart > dto.yearEnd) {
      throw new BadRequestException('Ano inicial da aplicacao nao pode ser maior que o ano final.');
    }

    const application = await this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.garantirProdutoExiste(tx, tenantId, id);
      await this.validarVeiculoCanonico(tx, tenantId, dto);

      const created = await tx.productVehicleApplication.create({
        data: {
          tenantId,
          productId: id,
          vehicleMakeId: dto.vehicleMakeId,
          vehicleModelId: dto.vehicleModelId,
          vehicleVersionId: dto.vehicleVersionId,
          makeName: dto.makeName,
          modelName: dto.modelName,
          versionName: dto.versionName,
          yearStart: dto.yearStart,
          yearEnd: dto.yearEnd,
          engine: dto.engine,
          position: dto.position,
          side: dto.side,
          axle: dto.axle,
          technicalNote: dto.technicalNote,
          restriction: dto.restriction,
          relatedOemCode: dto.relatedOemCode,
          source: dto.source,
        },
        include: this.includeApplication(),
      });

      await this.recalcularQualidade(tx, tenantId, id);
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, null, { application: created });
      return created;
    });

    return ProdutoMapper.toApplicationResponse(application);
  }

  async listarAplicacoes(id: string): Promise<VehicleApplicationResponseDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    await this.garantirProdutoExiste(this.db(), tenantId, id);

    const applications = await this.db().productVehicleApplication.findMany({
      where: { tenantId, productId: id },
      include: this.includeApplication(),
      orderBy: [{ makeName: 'asc' }, { modelName: 'asc' }, { yearStart: 'asc' }],
    });

    return applications.map((application: any) => ProdutoMapper.toApplicationResponse(application));
  }

  async removerAplicacao(id: string, applicationId: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    await this.db().$transaction(async (tx: PrismaClientLike) => {
      await this.garantirProdutoExiste(tx, tenantId, id);
      const result = await tx.productVehicleApplication.deleteMany({
        where: { id: applicationId, productId: id, tenantId },
      });

      if (result.count === 0) throw new NotFoundException(`Aplicacao veicular "${applicationId}" nao encontrada.`);

      await this.recalcularQualidade(tx, tenantId, id);
      await this.registrarAuditoria(tx, tenantId, usuario.sub, OperacaoAuditoria.ATUALIZAR, id, null, { removedApplicationId: applicationId });
    });
  }

  async buscarAplicacaoVeicular(filtros: ConsultarAplicacaoVeicularDto): Promise<ProductResponseDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const where: Record<string, unknown> = { tenantId };
    const and: Record<string, unknown>[] = [];

    if (filtros.make) {
      and.push({
        OR: [
          { makeName: { contains: filtros.make, mode: 'insensitive' } },
          { vehicleMake: { name: { contains: filtros.make, mode: 'insensitive' } } },
        ],
      });
    }

    if (filtros.model) {
      and.push({
        OR: [
          { modelName: { contains: filtros.model, mode: 'insensitive' } },
          { vehicleModel: { name: { contains: filtros.model, mode: 'insensitive' } } },
        ],
      });
    }

    if (filtros.engine) {
      and.push({
        OR: [
          { engine: { contains: filtros.engine, mode: 'insensitive' } },
          { vehicleVersion: { engine: { contains: filtros.engine, mode: 'insensitive' } } },
        ],
      });
    }

    if (filtros.year) {
      and.push(
        { OR: [{ yearStart: null }, { yearStart: { lte: filtros.year } }] },
        { OR: [{ yearEnd: null }, { yearEnd: { gte: filtros.year } }] },
      );
    }

    if (and.length) where.AND = and;

    const applications = await this.db().productVehicleApplication.findMany({
      where,
      include: { product: { include: this.includeProduct() } },
      take: 100,
    });

    const products = new Map<string, ProductResponseDto>();
    for (const application of applications) {
      products.set(application.product.id, ProdutoMapper.toResponse(application.product));
    }

    return Array.from(products.values());
  }

  private db(): any {
    return this.prisma as any;
  }

  private includeProduct() {
    return {
      brand: true,
      manufacturer: true,
      group: true,
      family: true,
      category: true,
      identifiers: {
        where: { isActive: true },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      taxProfile: true,
      pricing: true,
      cost: true,
      stocks: true,
    };
  }

  private includeApplication() {
    return {
      vehicleMake: true,
      vehicleModel: true,
      vehicleVersion: true,
    };
  }

  private montarFiltros(tenantId: string, filtros: ConsultarProdutosDto): Record<string, unknown> {
    const where: Record<string, unknown> = { tenantId };

    if (filtros.status) where.status = filtros.status;
    else if (!filtros.includeInactive) where.status = { not: ProductStatus.INATIVO };

    if (filtros.type) where.type = filtros.type;
    if (filtros.brandId) where.brandId = filtros.brandId;
    if (filtros.categoryId) where.categoryId = filtros.categoryId;
    if (filtros.sku) where.sku = this.normalizarCodigoObrigatorio(filtros.sku, 'SKU');
    if (filtros.barcode) {
      where.identifiers = {
        some: {
          normalizedCode: this.normalizarCodigoObrigatorio(filtros.barcode, 'codigo de barras'),
          type: { in: this.barcodeTypes() },
          isActive: true,
        },
      };
    }

    if (filtros.q) {
      const query = filtros.q.trim();
      if (!query) return where;

      const normalizedTextQuery = this.normalizarTexto(query);
      const normalizedCodeQuery = this.normalizarCodigoOpcional(query);
      const or: Record<string, unknown>[] = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { fiscalDescription: { contains: query, mode: 'insensitive' } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
        { manufacturer: { name: { contains: query, mode: 'insensitive' } } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
      ];

      if (normalizedCodeQuery) {
        or.push(
          { sku: { contains: normalizedCodeQuery, mode: 'insensitive' } },
          { identifiers: { some: { normalizedCode: { contains: normalizedCodeQuery, mode: 'insensitive' }, isActive: true } } },
        );
      } else {
        or.push({ identifiers: { some: { normalizedCode: { contains: normalizedTextQuery, mode: 'insensitive' }, isActive: true } } });
      }

      where.OR = or;
    }

    return where;
  }

  private async buscarProdutoCompleto(tx: PrismaClientLike, tenantId: string, id: string) {
    const product = await tx.product.findFirst({
      where: { id, tenantId },
      include: this.includeProduct(),
    });

    if (!product) throw new NotFoundException(`Produto "${id}" nao encontrado.`);
    return product;
  }

  private async garantirProdutoExiste(tx: PrismaClientLike, tenantId: string, id: string): Promise<void> {
    const exists = await tx.product.count({ where: { id, tenantId } });
    if (!exists) throw new NotFoundException(`Produto "${id}" nao encontrado.`);
  }

  private async resolverReferenciasCatalogo(tx: PrismaClientLike, tenantId: string, dto: Partial<CreateProductDto>) {
    const groupRef = await this.resolverReferencia(tx, tenantId, 'productGroup', 'groupId', dto.groupId, dto.groupName);

    return {
      ...(await this.resolverReferencia(tx, tenantId, 'productBrand', 'brandId', dto.brandId, dto.brandName)),
      ...(await this.resolverReferencia(tx, tenantId, 'productManufacturer', 'manufacturerId', dto.manufacturerId, dto.manufacturerName)),
      ...groupRef,
      ...(await this.resolverReferencia(tx, tenantId, 'productFamily', 'familyId', dto.familyId, dto.familyName, dto.groupId ?? groupRef.groupId)),
      ...(await this.resolverReferencia(tx, tenantId, 'productCategory', 'categoryId', dto.categoryId, dto.categoryName)),
    };
  }

  private async resolverReferencia(
    tx: PrismaClientLike,
    tenantId: string,
    modelName: string,
    dataKey: string,
    id?: string,
    name?: string,
    groupId?: string,
  ): Promise<Record<string, string>> {
    if (id) {
      const record = await tx[modelName].findFirst({ where: { id, tenantId } });
      if (!record) throw new BadRequestException(`Referencia "${id}" nao encontrada para ${dataKey}.`);
      return { [dataKey]: id };
    }

    const normalizedName = name?.trim();
    if (!normalizedName) return {};

    const record = await tx[modelName].upsert({
      where: { tenantId_name: { tenantId, name: normalizedName } },
      create: {
        tenantId,
        name: normalizedName,
        ...(modelName === 'productFamily' && groupId ? { groupId } : {}),
      },
      update: {
        isActive: true,
        ...(modelName === 'productFamily' && groupId ? { groupId } : {}),
      },
    });

    return { [dataKey]: record.id };
  }

  private montarIdentificadores(dto: Pick<CreateProductDto, 'barcode' | 'identifiers'>): Array<Record<string, unknown>> {
    const identifiers: CreateProductIdentifierDto[] = [...(dto.identifiers ?? [])];
    if (dto.barcode) {
      identifiers.unshift({
        type: ProductIdentifierType.BARCODE,
        code: dto.barcode,
        isPrimary: true,
      });
    }

    const dedup = new Map<string, Record<string, unknown>>();
    for (const identifier of identifiers) {
      const normalizedCode = this.normalizarCodigoObrigatorio(identifier.code, 'identificador do produto');
      const key = `${identifier.type}:${normalizedCode}`;
      if (dedup.has(key)) continue;
      dedup.set(key, {
        type: identifier.type,
        code: identifier.code.trim(),
        normalizedCode,
        description: identifier.description,
        source: identifier.source,
        isPrimary: identifier.isPrimary ?? false,
      });
    }

    return Array.from(dedup.values());
  }

  private async sincronizarIdentificadores(
    tx: PrismaClientLike,
    tenantId: string,
    productId: string,
    identifiers?: CreateProductIdentifierDto[],
    barcode?: string,
  ): Promise<void> {
    if (identifiers !== undefined) {
      const payload = this.montarIdentificadores({ identifiers });
      await this.validarIdentificadoresDisponiveis(tx, tenantId, payload, productId);
      await tx.productIdentifier.deleteMany({ where: { tenantId, productId } });
      if (payload.length) {
        await tx.productIdentifier.createMany({
          data: payload.map((identifier) => ({ tenantId, productId, ...identifier })),
        });
      }
    }

    if (barcode !== undefined) {
      const payload = this.montarIdentificadores({ barcode });
      await this.validarIdentificadoresDisponiveis(tx, tenantId, payload, productId);
      await tx.productIdentifier.deleteMany({ where: { tenantId, productId, type: ProductIdentifierType.BARCODE } });
      if (payload.length) {
        await tx.productIdentifier.createMany({
          data: payload.map((identifier) => ({ tenantId, productId, ...identifier })),
        });
      }
    }
  }

  private async validarSkuDisponivel(
    tx: PrismaClientLike,
    tenantId: string,
    sku?: string,
    ignoreProductId?: string,
  ): Promise<void> {
    if (!sku) return;

    const existing = await tx.product.findFirst({
      where: {
        tenantId,
        sku,
        ...(ignoreProductId ? { id: { not: ignoreProductId } } : {}),
      },
      select: { id: true },
    });

    if (existing) throw new ConflictException(`SKU "${sku}" ja esta em uso neste tenant.`);
  }

  private async validarIdentificadoresDisponiveis(
    tx: PrismaClientLike,
    tenantId: string,
    identifiers: Array<Record<string, unknown>>,
    ignoreProductId?: string,
  ): Promise<void> {
    for (const identifier of identifiers) {
      const type = identifier.type as ProductIdentifierType;
      if (!this.globallyUniqueIdentifierTypes().includes(type)) continue;

      const existing = await tx.productIdentifier.findFirst({
        where: {
          tenantId,
          type,
          normalizedCode: identifier.normalizedCode,
          ...(ignoreProductId ? { productId: { not: ignoreProductId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(`Codigo "${identifier.code}" ja esta vinculado a outro produto.`);
      }
    }
  }

  private mapTaxProfile(tenantId: string, dto: ProductTaxProfileDto): Record<string, unknown> {
    return {
      tenantId,
      ncm: this.normalizarCodigoOpcional(dto.ncm),
      ncmDescription: dto.ncmDescription,
      cest: this.normalizarCodigoOpcional(dto.cest),
      origin: dto.origin,
      commercialUnit: dto.commercialUnit,
      taxableUnit: dto.taxableUnit,
      commercialGtin: this.normalizarCodigoOpcional(dto.commercialGtin),
      taxableGtin: this.normalizarCodigoOpcional(dto.taxableGtin),
      exTipi: dto.exTipi,
      fiscalItemType: dto.fiscalItemType,
      hasSubstitutionTax: dto.hasSubstitutionTax ?? false,
      isMonophasic: dto.isMonophasic ?? false,
      isImported: dto.isImported ?? false,
      isUsed: dto.isUsed ?? false,
      officialFiscalDescription: dto.officialFiscalDescription,
      defaultFiscalProfile: dto.defaultFiscalProfile,
      classificationSource: dto.classificationSource,
      classificationReviewedAt: dto.classificationReviewedAt ? new Date(dto.classificationReviewedAt) : undefined,
      classificationValidFrom: dto.classificationValidFrom ? new Date(dto.classificationValidFrom) : undefined,
      classificationValidTo: dto.classificationValidTo ? new Date(dto.classificationValidTo) : undefined,
      requiresFiscalReview: dto.requiresFiscalReview ?? !dto.ncm,
      blocksInvoiceWhenIncomplete: dto.blocksInvoiceWhenIncomplete ?? true,
    };
  }

  private mapPrice(tenantId: string, dto: ProductPriceDto): Record<string, unknown> {
    return {
      tenantId,
      salePrice: dto.salePrice,
      promotionalPrice: dto.promotionalPrice,
      minSalePrice: dto.minSalePrice,
      desiredMargin: dto.desiredMargin,
      maxDiscountPercent: dto.maxDiscountPercent,
      commissionPercent: dto.commissionPercent,
      lastPriceChangedAt: new Date(),
    };
  }

  private mapCost(tenantId: string, dto: ProductCostDto): Record<string, unknown> {
    return {
      tenantId,
      lastPurchaseCost: dto.lastPurchaseCost,
      averageCost: dto.averageCost,
      fiscalAverageCost: dto.fiscalAverageCost,
      managerialCost: dto.managerialCost,
      replacementCost: dto.replacementCost,
      freightCost: dto.freightCost,
      nonRecoverableTaxCost: dto.nonRecoverableTaxCost,
      extraCost: dto.extraCost,
      lastCostAt: dto.lastCostAt ? new Date(dto.lastCostAt) : undefined,
    };
  }

  private async upsertTaxProfileTx(tx: PrismaClientLike, tenantId: string, productId: string, dto: ProductTaxProfileDto) {
    return tx.productTaxProfile.upsert({
      where: { productId },
      create: { productId, ...this.mapTaxProfile(tenantId, dto) },
      update: this.mapTaxProfile(tenantId, dto),
    });
  }

  private async upsertPriceTx(tx: PrismaClientLike, tenantId: string, productId: string, dto: ProductPriceDto) {
    return tx.productPrice.upsert({
      where: { productId },
      create: { productId, ...this.mapPrice(tenantId, dto) },
      update: this.mapPrice(tenantId, dto),
    });
  }

  private async upsertCostTx(tx: PrismaClientLike, tenantId: string, productId: string, dto: ProductCostDto) {
    return tx.productCost.upsert({
      where: { productId },
      create: { productId, ...this.mapCost(tenantId, dto) },
      update: this.mapCost(tenantId, dto),
    });
  }

  private async criarEstoqueInicial(
    tx: PrismaClientLike,
    tenantId: string,
    productId: string,
    dto: InitialProductStockDto,
    userId: string,
  ): Promise<void> {
    const warehouse = await this.resolverWarehouse(tx, tenantId, dto);
    const location = await this.resolverLocation(tx, tenantId, warehouse.id, dto);
    const currentStock = dto.currentStock ?? 0;

    await tx.productStock.create({
      data: {
        tenantId,
        productId,
        warehouseId: warehouse.id,
        locationId: location?.id,
        currentStock,
        availableStock: currentStock,
        minimumStock: dto.minimumStock,
        maximumStock: dto.maximumStock,
        lastMovementAt: currentStock > 0 ? new Date() : undefined,
      },
    });

    if (currentStock > 0) {
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          warehouseId: warehouse.id,
          toLocationId: location?.id,
          type: StockMovementType.ENTRADA_MANUAL,
          quantity: currentStock,
          balanceAfter: currentStock,
          reason: 'Estoque inicial',
          createdBy: userId,
        },
      });
    }
  }

  private async resolverWarehouse(tx: PrismaClientLike, tenantId: string, dto: InitialProductStockDto | StockAdjustmentDto) {
    if (dto.warehouseId) {
      const warehouse = await tx.stockWarehouse.findFirst({ where: { id: dto.warehouseId, tenantId } });
      if (!warehouse) throw new BadRequestException(`Deposito "${dto.warehouseId}" nao encontrado.`);
      return warehouse;
    }

    const code = this.normalizarCodigoOpcional(dto.warehouseCode) ?? 'GERAL';
    return tx.stockWarehouse.upsert({
      where: { tenantId_code: { tenantId, code } },
      create: { tenantId, code, name: dto.warehouseName?.trim() || 'Geral' },
      update: { isActive: true, ...(dto.warehouseName ? { name: dto.warehouseName.trim() } : {}) },
    });
  }

  private async resolverLocation(
    tx: PrismaClientLike,
    tenantId: string,
    warehouseId: string,
    dto: InitialProductStockDto | StockAdjustmentDto,
  ) {
    if (dto.locationId) {
      const location = await tx.stockLocation.findFirst({ where: { id: dto.locationId, tenantId, warehouseId } });
      if (!location) throw new BadRequestException(`Localizacao "${dto.locationId}" nao encontrada no deposito informado.`);
      return location;
    }

    const code = this.normalizarCodigoOpcional(dto.locationCode);
    if (!code) return null;

    return tx.stockLocation.upsert({
      where: { tenantId_warehouseId_code: { tenantId, warehouseId, code } },
      create: {
        tenantId,
        warehouseId,
        code,
        name: dto.locationName?.trim() || code,
      },
      update: {
        isActive: true,
        ...(dto.locationName ? { name: dto.locationName.trim() } : {}),
      },
    });
  }

  private calcularDeltaEstoque(type: StockMovementType, quantity: number): number {
    const negativeTypes = [
      StockMovementType.SAIDA_VENDA,
      StockMovementType.SAIDA_OS,
      StockMovementType.AJUSTE_NEGATIVO,
      StockMovementType.DEVOLUCAO_FORNECEDOR,
      StockMovementType.PERDA,
      StockMovementType.AVARIA,
      StockMovementType.CONSUMO_INTERNO,
      StockMovementType.GARANTIA,
    ];

    return negativeTypes.includes(type) ? -quantity : quantity;
  }

  private async validarVeiculoCanonico(
    tx: PrismaClientLike,
    tenantId: string,
    dto: CreateVehicleApplicationDto,
  ): Promise<void> {
    if (dto.vehicleMakeId) {
      const exists = await tx.vehicleMake.count({ where: { id: dto.vehicleMakeId, tenantId } });
      if (!exists) throw new BadRequestException(`Montadora "${dto.vehicleMakeId}" nao encontrada.`);
    }
    if (dto.vehicleModelId) {
      const exists = await tx.vehicleModel.count({ where: { id: dto.vehicleModelId, tenantId } });
      if (!exists) throw new BadRequestException(`Modelo "${dto.vehicleModelId}" nao encontrado.`);
    }
    if (dto.vehicleVersionId) {
      const exists = await tx.vehicleVersion.count({ where: { id: dto.vehicleVersionId, tenantId } });
      if (!exists) throw new BadRequestException(`Versao "${dto.vehicleVersionId}" nao encontrada.`);
    }
  }

  private async recalcularQualidade(tx: PrismaClientLike, tenantId: string, productId: string): Promise<void> {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        taxProfile: true,
        cost: true,
        vehicleApplications: { take: 1 },
        attachments: { where: { isDeleted: false }, take: 1 },
      },
    });

    if (!product) return;

    let qualityStatus = ProductQualityStatus.INCOMPLETO;
    if (!product.taxProfile?.ncm) qualityStatus = ProductQualityStatus.PENDENTE_FISCAL;
    else if (!product.cost?.managerialCost && !product.cost?.averageCost && !product.cost?.lastPurchaseCost) qualityStatus = ProductQualityStatus.PENDENTE_CUSTO;
    else if (!product.vehicleApplications?.length) qualityStatus = ProductQualityStatus.PENDENTE_APLICACAO;
    else if (!product.attachments?.length) qualityStatus = ProductQualityStatus.PENDENTE_FOTO;
    else qualityStatus = ProductQualityStatus.COMPLETO;

    await tx.product.update({
      where: { product_id_tenantId: { id: productId, tenantId } },
      data: { qualityStatus },
    });
  }

  private async registrarBusca(
    tenantId: string,
    query: string,
    searchType: string,
    resultCount: number,
    productId?: string,
  ): Promise<void> {
    let userId: string | undefined;
    try {
      userId = this.tenantContext.getUser().sub;
    } catch {
      userId = undefined;
    }

    await this.db().productSearchLog.create({
      data: {
        tenantId,
        productId,
        query,
        normalizedQuery: this.normalizarTexto(query),
        searchType,
        resultCount,
        userId,
      },
    });
  }

  private async registrarAuditoria(
    tx: PrismaClientLike,
    tenantId: string,
    userId: string,
    operacao: OperacaoAuditoria,
    productId: string,
    dadosAnteriores: unknown,
    dadosAtuais: unknown,
  ): Promise<void> {
    await tx.auditoriaLog.create({
      data: {
        tenantId,
        recurso: 'produto',
        recursoId: productId,
        operacao,
        realizadoPor: userId,
        dados: {
          dadosAnteriores: dadosAnteriores ?? {},
          dadosAtuais: dadosAtuais ?? {},
        },
      },
    });
  }

  private omitirCamposInternos(value: any): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (['tenantId', 'productId'].includes(key)) continue;
      result[key] = raw;
    }
    return result;
  }

  private normalizarCodigoObrigatorio(value: string, fieldName: string): string {
    const normalized = this.normalizarCodigoOpcional(value);
    if (!normalized) throw new BadRequestException(`${fieldName} e obrigatorio.`);
    return normalized;
  }

  private normalizarCodigoOpcional(value?: string): string | undefined {
    const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return normalized || undefined;
  }

  private normalizarTexto(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  private barcodeTypes(): ProductIdentifierType[] {
    return [
      ProductIdentifierType.BARCODE,
      ProductIdentifierType.GTIN_UNITARIO,
      ProductIdentifierType.GTIN_CAIXA,
    ];
  }

  private globallyUniqueIdentifierTypes(): ProductIdentifierType[] {
    return [
      ProductIdentifierType.SKU,
      ...this.barcodeTypes(),
    ];
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    if (typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    return Number(value);
  }
}
