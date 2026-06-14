import {
  Injectable, Logger, NotFoundException, BadRequestException, Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, ConsultarClienteDto, ClienteResponseDto, TipoCliente } from '../dto/cliente.dto';
import { DocumentoValidatorService } from '../validacoes/documento-validator.service';
import { UnicidadeValidatorService } from '../validacoes/unicidade-validator.service';
import { ClienteMapper } from '../mappers/cliente.mapper';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { IntegridadeService } from '../validacoes/integridade.service';
import { IdempotencyService } from '../auditoria/idempotency.service';
import { OperacaoAuditoria } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);
  private readonly ORDENACAO_PERMITIDA = ['nome', 'documento', 'createdAt', 'updatedAt'];
  private readonly CACHE_TTL = 300000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly docValidator: DocumentoValidatorService,
    private readonly unicidadeValidator: UnicidadeValidatorService,
    private readonly auditoriaService: AuditoriaService,
    private readonly integridadeService: IntegridadeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly idempotencyService: IdempotencyService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async criar(dto: CreateClienteDto, idemKey?: string): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const result = await this.idempotencyService.executeOrRecover(
      idemKey, tenantId, 'clientes.criar',
      async (tx) => {
        const documentoLimpo = dto.documento?.replace(/[^\d]/g, '');
        if (!documentoLimpo) throw new BadRequestException('Documento é obrigatório.');

        await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
        await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, undefined, tx);
        if (dto.email) await this.unicidadeValidator.validarEmail(tenantId, dto.email, undefined, tx);

        const cliente = await tx.cliente.create({
          data: {
            tipoCliente: dto.tipoCliente as any,
            nome: dto.nome,
            nomeFantasia: dto.nomeFantasia,
            documento: documentoLimpo,
            email: dto.email,
            isAtivo: dto.isAtivo ?? true,
            tenantId,
          },
          include: { enderecos: true, contatos: true },
        });

        const responseDto = ClienteMapper.toResponse(cliente);
        await this.auditoriaService.registrarOperacao(tenantId, usuario, {
          operacao: OperacaoAuditoria.CRIAR,
          recurso: 'cliente', recursoId: cliente.id, dadosAtuais: responseDto,
        });

        this.logger.log(`[${tenantId}] Cliente criado: ${cliente.id}`);
        return responseDto;
      },
    );
    await this.invalidarCacheLista(tenantId);
    return result;
  }

  async buscarPorId(id: string): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const cacheKey = `cliente:${tenantId}:${id}`;
    const cached = await (this.cacheManager as any).get(cacheKey) as ClienteResponseDto | undefined;
    if (cached) return cached;

    const cliente = await this.prisma.cliente.findFirst({
      where: { id, tenantId },
      include: { enderecos: true, contatos: true },
    });

    if (!cliente) throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);

    const response = ClienteMapper.toResponse(cliente);
    await (this.cacheManager as any).set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  async listar(filtros: ConsultarClienteDto) {
    const tenantId = this.tenantContext.getTenantId();

    if (filtros.sortBy && !this.ORDENACAO_PERMITIDA.includes(filtros.sortBy)) {
      throw new BadRequestException(`Ordenação por "${filtros.sortBy}" não é permitida.`);
    }

    const where = this.montarFiltros(filtros, tenantId);
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const sortBy = filtros.sortBy ?? 'nome';
    const sortOrder = (filtros.sortOrder ?? 'asc').toLowerCase() as 'asc' | 'desc';

    const [clientes, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { enderecos: { where: { isPrincipal: true }, take: 1 } },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      dados: clientes.map(c => ClienteMapper.toResponse(c)),
      paginacao: { total, pagina: page, itensPorPagina: limit, totalPaginas: Math.ceil(total / limit) },
    };
  }

  async atualizar(id: string, dto: UpdateClienteDto): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();
    const clienteAnterior = await this.buscarPorId(id);
    const documentoLimpo = dto.documento ? dto.documento.replace(/[^\d]/g, '') : undefined;

    const response = await this.prisma.$transaction(async (tx) => {
      if (documentoLimpo) {
        await this.docValidator.validar(dto.tipoCliente as TipoCliente, documentoLimpo);
        await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, id, tx);
      }
      if (dto.email) await this.unicidadeValidator.validarEmail(tenantId, dto.email, id, tx);

      const cliente = await tx.cliente.update({
        where: { id },
        data: {
          ...(dto.nome && { nome: dto.nome }),
          ...(dto.nomeFantasia !== undefined && { nomeFantasia: dto.nomeFantasia }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.isAtivo !== undefined && { isAtivo: dto.isAtivo }),
          ...(documentoLimpo && { documento: documentoLimpo }),
          ...(dto.tipoCliente && { tipoCliente: dto.tipoCliente as any }),
        },
        include: { enderecos: true, contatos: true },
      });

      const responseDto = ClienteMapper.toResponse(cliente);
      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.ATUALIZAR, recurso: 'cliente', recursoId: id,
        dadosAnteriores: clienteAnterior, dadosAtuais: responseDto,
      });
      return responseDto;
    });

    await this.invalidarCacheIndividual(tenantId, id);
    return response;
  }

  async desativar(id: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();
    await this.integridadeService.validarExclusaoCliente(tenantId, id);

    const result = await this.prisma.cliente.updateMany({
      where: { id, tenantId },
      data: { isAtivo: false },
    });

    if (result.count === 0) throw new NotFoundException(`Cliente "${id}" não encontrado.`);

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.DESATIVAR, recurso: 'cliente', recursoId: id,
      dadosAtuais: { isAtivo: false },
    });
    await this.invalidarCacheIndividual(tenantId, id);
  }

  async reativar(id: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const result = await this.prisma.cliente.updateMany({
      where: { id, tenantId },
      data: { isAtivo: true },
    });

    if (result.count === 0) throw new NotFoundException(`Cliente "${id}" não encontrado.`);

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.REATIVAR, recurso: 'cliente', recursoId: id,
      dadosAtuais: { isAtivo: true },
    });
    await this.invalidarCacheIndividual(tenantId, id);
  }

  private montarFiltros(filtros: ConsultarClienteDto, tenantId: string): any {
    const where: any = { tenantId };

    if (filtros.isAtivo !== undefined) where.isAtivo = filtros.isAtivo;
    if (filtros.tipoCliente) where.tipoCliente = filtros.tipoCliente;

    const orConditions: any[] = [];
    if (filtros.nome) {
      orConditions.push(
        { nome: { contains: filtros.nome, mode: 'insensitive' } },
        { nomeFantasia: { contains: filtros.nome, mode: 'insensitive' } },
      );
    }
    if (filtros.documento) {
      orConditions.push({ documento: { contains: filtros.documento.replace(/[^\d]/g, '') } });
    }
    if (orConditions.length > 0) where.OR = orConditions;

    return where;
  }

  private async invalidarCacheIndividual(tenantId: string, clienteId: string): Promise<void> {
    try {
      await (this.cacheManager as any).del(`cliente:${tenantId}:${clienteId}`);
    } catch (e) {
      this.logger.error(`Falha ao invalidar cache do cliente ${clienteId}`, e);
    }
    await this.invalidarCacheLista(tenantId);
  }

  private async invalidarCacheLista(tenantId: string): Promise<void> {
    try {
      await (this.cacheManager as any).del(`estatisticas:${tenantId}`);
    } catch (e) {
      this.logger.error(`Falha ao invalidar cache de lista do tenant ${tenantId}`, e);
    }
  }
}
