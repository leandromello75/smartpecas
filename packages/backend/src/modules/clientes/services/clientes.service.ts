// =============================================================================
// SmartPecas ERP - Service - Modulo Clientes
// =============================================================================
// Caminho: packages/backend/src/modules/clientes/services/clientes.service.ts
//
// Descricao: Regras de negocio do modulo Clientes, incluindo cadastro,
// consulta, validacao de documento, enderecos, contatos, auditoria,
// idempotencia e cache.
// =============================================================================

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { OperacaoAuditoria } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ClienteResponseDto,
  ConsultarClienteDto,
  CreateClienteDto,
  CreateContatoDto,
  CreateEnderecoDto,
  DocumentoValidadoResponseDto,
  TipoCliente,
  UpdateClienteDto,
  UpdateContatoDto,
  UpdateEnderecoDto,
  ValidarDocumentoDto,
} from '../dto/cliente.dto';
import { DocumentoValidatorService } from '../validacoes/documento-validator.service';
import { UnicidadeValidatorService } from '../validacoes/unicidade-validator.service';
import { ClienteMapper } from '../mappers/cliente.mapper';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { IntegridadeService } from '../validacoes/integridade.service';
import { IdempotencyService } from '../auditoria/idempotency.service';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

type PrismaClientLike = PrismaService | any;

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
      idemKey,
      tenantId,
      'clientes.criar',
      async (tx) => {
        const documentoLimpo = this.limparDocumentoObrigatorio(dto.documento);

        await this.docValidator.validar(dto.tipoCliente as any, documentoLimpo);
        await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, undefined, tx);
        if (dto.email) {
          await this.unicidadeValidator.validarEmail(tenantId, dto.email, undefined, tx);
        }

        const cliente = await tx.cliente.create({
          data: {
            tipoCliente: dto.tipoCliente as any,
            nome: dto.nome,
            nomeFantasia: dto.nomeFantasia,
            documento: documentoLimpo,
            email: dto.email,
            isAtivo: dto.isAtivo ?? true,
            tenantId,
            enderecos: dto.enderecos?.length
              ? { create: this.prepararEnderecosParaCriacao(dto.enderecos) }
              : undefined,
            contatos: dto.contatos?.length
              ? { create: dto.contatos.map((contato) => this.montarDadosContato(contato)) }
              : undefined,
          },
          include: { enderecos: true, contatos: true },
        });

        const responseDto = ClienteMapper.toResponse(cliente);

        await this.auditoriaService.registrarOperacao(tenantId, usuario, {
          operacao: OperacaoAuditoria.CRIAR,
          recurso: 'cliente',
          recursoId: cliente.id,
          dadosAtuais: responseDto as any,
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

    if (cached) {
      return cached;
    }

    const response = await this.buscarClienteCompleto(this.prisma, tenantId, id);
    await (this.cacheManager as any).set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  async validarDocumento(dto: ValidarDocumentoDto): Promise<DocumentoValidadoResponseDto> {
    const documentoLimpo = this.limparDocumentoObrigatorio(dto.documento);

    await this.docValidator.validar(dto.tipoCliente as any, documentoLimpo);

    return {
      valido: true,
      tipoCliente: dto.tipoCliente,
      documento: documentoLimpo,
    };
  }

  async listar(filtros: ConsultarClienteDto) {
    const tenantId = this.tenantContext.getTenantId();

    if (filtros.sortBy && !this.ORDENACAO_PERMITIDA.includes(filtros.sortBy)) {
      throw new BadRequestException(`Ordenacao por "${filtros.sortBy}" nao e permitida.`);
    }

    const where = this.montarFiltros(filtros, tenantId);
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const sortBy = filtros.sortBy ?? 'nome';
    const sortOrder = (filtros.sortOrder ?? 'asc') as 'asc' | 'desc';

    const [clientes, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          enderecos: { where: { isPrincipal: true }, take: 1 },
          contatos: true,
        },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      dados: clientes.map((cliente) => ClienteMapper.toResponse(cliente)),
      paginacao: {
        total,
        pagina: page,
        itensPorPagina: limit,
        totalPaginas: Math.ceil(total / limit),
      },
    };
  }

  async atualizar(id: string, dto: UpdateClienteDto): Promise<ClienteResponseDto> {
    this.validarPayloadComAlgumCampo(dto);

    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();
    const clienteAnterior = await this.buscarPorId(id);
    const documentoLimpo = dto.documento ? this.limparDocumentoObrigatorio(dto.documento) : undefined;

    const response = await this.prisma.$transaction(async (tx) => {
      if (documentoLimpo || dto.tipoCliente) {
        const tipoDocumento = dto.tipoCliente ?? (clienteAnterior.tipoCliente as TipoCliente);
        const documentoParaValidar = documentoLimpo ?? clienteAnterior.documento;
        await this.docValidator.validar(tipoDocumento as any, documentoParaValidar);
      }

      if (documentoLimpo) {
        await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, id, tx);
      }

      if (dto.email) {
        await this.unicidadeValidator.validarEmail(tenantId, dto.email, id, tx);
      }

      const cliente = await tx.cliente.update({
        where: { id_tenantId: { id, tenantId } },
        data: {
          ...(dto.nome !== undefined && { nome: dto.nome }),
          ...(dto.nomeFantasia !== undefined && { nomeFantasia: dto.nomeFantasia }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.isAtivo !== undefined && { isAtivo: dto.isAtivo }),
          ...(documentoLimpo !== undefined && { documento: documentoLimpo }),
          ...(dto.tipoCliente !== undefined && { tipoCliente: dto.tipoCliente as any }),
        },
        include: { enderecos: true, contatos: true },
      });

      const responseDto = ClienteMapper.toResponse(cliente);

      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.ATUALIZAR,
        recurso: 'cliente',
        recursoId: id,
        dadosAnteriores: clienteAnterior as any,
        dadosAtuais: responseDto as any,
      });

      return responseDto;
    });

    await this.invalidarCacheIndividual(tenantId, id);
    return response;
  }

  async desativar(id: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const result = await this.prisma.cliente.updateMany({
      where: { id, tenantId },
      data: { isAtivo: false },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Cliente "${id}" nao encontrado.`);
    }

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.DESATIVAR,
      recurso: 'cliente',
      recursoId: id,
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

    if (result.count === 0) {
      throw new NotFoundException(`Cliente "${id}" nao encontrado.`);
    }

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.REATIVAR,
      recurso: 'cliente',
      recursoId: id,
      dadosAtuais: { isAtivo: true },
    });

    await this.invalidarCacheIndividual(tenantId, id);
  }

  async remover(id: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    await this.integridadeService.validarExclusaoCliente(tenantId, id);

    const clienteAnterior = await this.prisma.cliente.findFirst({
      where: { id, tenantId },
      include: { enderecos: true, contatos: true },
    });

    if (!clienteAnterior) {
      throw new NotFoundException(`Cliente "${id}" nao encontrado.`);
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.cliente.deleteMany({ where: { id, tenantId } });
      if (result.count === 0) {
        throw new NotFoundException(`Cliente "${id}" nao encontrado.`);
      }
    });

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.EXCLUIR,
      recurso: 'cliente',
      recursoId: id,
      dadosAnteriores: ClienteMapper.toResponse(clienteAnterior) as any,
    });

    await this.invalidarCacheIndividual(tenantId, id);
  }

  async adicionarEndereco(clienteId: string, dto: CreateEnderecoDto): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const response = await this.prisma.$transaction(async (tx) => {
      await this.garantirClienteExiste(tx, tenantId, clienteId);

      const totalEnderecos = await tx.enderecoCliente.count({ where: { clienteId } });
      const isPrincipal = dto.isPrincipal === true || totalEnderecos === 0;

      if (isPrincipal) {
        await this.desmarcarEnderecosPrincipais(tx, clienteId);
      }

      const endereco = await tx.enderecoCliente.create({
        data: {
          clienteId,
          ...this.montarDadosEndereco(dto),
          isPrincipal,
        },
      });

      const cliente = await this.buscarClienteCompleto(tx, tenantId, clienteId);

      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.CRIAR,
        recurso: 'cliente_endereco',
        recursoId: endereco.id,
        dadosAtuais: endereco as any,
      });

      return cliente;
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
    return response;
  }

  async atualizarEndereco(
    clienteId: string,
    enderecoId: string,
    dto: UpdateEnderecoDto,
  ): Promise<ClienteResponseDto> {
    this.validarPayloadComAlgumCampo(dto);

    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const response = await this.prisma.$transaction(async (tx) => {
      const enderecoAnterior = await this.buscarEnderecoDoCliente(tx, tenantId, clienteId, enderecoId);

      if (dto.isPrincipal === true) {
        await this.desmarcarEnderecosPrincipais(tx, clienteId);
      }

      const endereco = await tx.enderecoCliente.update({
        where: { id: enderecoId },
        data: this.montarDadosEnderecoAtualizacao(dto),
      });

      const cliente = await this.buscarClienteCompleto(tx, tenantId, clienteId);

      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.ATUALIZAR,
        recurso: 'cliente_endereco',
        recursoId: enderecoId,
        dadosAnteriores: enderecoAnterior as any,
        dadosAtuais: endereco as any,
      });

      return cliente;
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
    return response;
  }

  async definirEnderecoPrincipal(clienteId: string, enderecoId: string): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const response = await this.prisma.$transaction(async (tx) => {
      const enderecoAnterior = await this.buscarEnderecoDoCliente(tx, tenantId, clienteId, enderecoId);

      await this.desmarcarEnderecosPrincipais(tx, clienteId);

      const endereco = await tx.enderecoCliente.update({
        where: { id: enderecoId },
        data: { isPrincipal: true },
      });

      const cliente = await this.buscarClienteCompleto(tx, tenantId, clienteId);

      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.ATUALIZAR,
        recurso: 'cliente_endereco',
        recursoId: enderecoId,
        dadosAnteriores: enderecoAnterior as any,
        dadosAtuais: endereco as any,
      });

      return cliente;
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
    return response;
  }

  async removerEndereco(clienteId: string, enderecoId: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const enderecoAnterior = await this.prisma.$transaction(async (tx) => {
      const endereco = await this.buscarEnderecoDoCliente(tx, tenantId, clienteId, enderecoId);

      await tx.enderecoCliente.delete({ where: { id: enderecoId } });

      if (endereco.isPrincipal) {
        const proximoEndereco = await tx.enderecoCliente.findFirst({
          where: { clienteId },
          orderBy: { createdAt: 'asc' },
        });

        if (proximoEndereco) {
          await tx.enderecoCliente.update({
            where: { id: proximoEndereco.id },
            data: { isPrincipal: true },
          });
        }
      }

      return endereco;
    });

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.EXCLUIR,
      recurso: 'cliente_endereco',
      recursoId: enderecoId,
      dadosAnteriores: enderecoAnterior as any,
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
  }

  async adicionarContato(clienteId: string, dto: CreateContatoDto): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const response = await this.prisma.$transaction(async (tx) => {
      await this.garantirClienteExiste(tx, tenantId, clienteId);

      const contato = await tx.contatoCliente.create({
        data: {
          clienteId,
          ...this.montarDadosContato(dto),
        },
      });

      const cliente = await this.buscarClienteCompleto(tx, tenantId, clienteId);

      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.CRIAR,
        recurso: 'cliente_contato',
        recursoId: contato.id,
        dadosAtuais: contato as any,
      });

      return cliente;
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
    return response;
  }

  async atualizarContato(
    clienteId: string,
    contatoId: string,
    dto: UpdateContatoDto,
  ): Promise<ClienteResponseDto> {
    this.validarPayloadComAlgumCampo(dto);

    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const response = await this.prisma.$transaction(async (tx) => {
      const contatoAnterior = await this.buscarContatoDoCliente(tx, tenantId, clienteId, contatoId);

      const contato = await tx.contatoCliente.update({
        where: { id: contatoId },
        data: this.montarDadosContatoAtualizacao(dto),
      });

      const cliente = await this.buscarClienteCompleto(tx, tenantId, clienteId);

      await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: OperacaoAuditoria.ATUALIZAR,
        recurso: 'cliente_contato',
        recursoId: contatoId,
        dadosAnteriores: contatoAnterior as any,
        dadosAtuais: contato as any,
      });

      return cliente;
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
    return response;
  }

  async removerContato(clienteId: string, contatoId: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();

    const contatoAnterior = await this.prisma.$transaction(async (tx) => {
      const contato = await this.buscarContatoDoCliente(tx, tenantId, clienteId, contatoId);
      await tx.contatoCliente.delete({ where: { id: contatoId } });
      return contato;
    });

    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
      operacao: OperacaoAuditoria.EXCLUIR,
      recurso: 'cliente_contato',
      recursoId: contatoId,
      dadosAnteriores: contatoAnterior as any,
    });

    await this.invalidarCacheIndividual(tenantId, clienteId);
  }

  private montarFiltros(filtros: ConsultarClienteDto, tenantId: string): any {
    const where: any = { tenantId };

    if (filtros.isAtivo !== undefined) {
      where.isAtivo = filtros.isAtivo;
    }

    if (filtros.tipoCliente) {
      where.tipoCliente = filtros.tipoCliente;
    }

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

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    return where;
  }

  private async buscarClienteCompleto(
    prismaClient: PrismaClientLike,
    tenantId: string,
    id: string,
  ): Promise<ClienteResponseDto> {
    const cliente = await prismaClient.cliente.findFirst({
      where: { id, tenantId },
      include: {
        enderecos: { orderBy: [{ isPrincipal: 'desc' }, { createdAt: 'asc' }] },
        contatos: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID "${id}" nao encontrado.`);
    }

    return ClienteMapper.toResponse(cliente);
  }

  private async garantirClienteExiste(
    prismaClient: PrismaClientLike,
    tenantId: string,
    id: string,
  ): Promise<void> {
    const cliente = await prismaClient.cliente.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID "${id}" nao encontrado.`);
    }
  }

  private async buscarEnderecoDoCliente(
    prismaClient: PrismaClientLike,
    tenantId: string,
    clienteId: string,
    enderecoId: string,
  ) {
    const endereco = await prismaClient.enderecoCliente.findFirst({
      where: {
        id: enderecoId,
        clienteId,
        cliente: { is: { tenantId } },
      },
    });

    if (!endereco) {
      throw new NotFoundException(`Endereco "${enderecoId}" nao encontrado para o cliente.`);
    }

    return endereco;
  }

  private async buscarContatoDoCliente(
    prismaClient: PrismaClientLike,
    tenantId: string,
    clienteId: string,
    contatoId: string,
  ) {
    const contato = await prismaClient.contatoCliente.findFirst({
      where: {
        id: contatoId,
        clienteId,
        cliente: { is: { tenantId } },
      },
    });

    if (!contato) {
      throw new NotFoundException(`Contato "${contatoId}" nao encontrado para o cliente.`);
    }

    return contato;
  }

  private async desmarcarEnderecosPrincipais(
    prismaClient: PrismaClientLike,
    clienteId: string,
  ): Promise<void> {
    await prismaClient.enderecoCliente.updateMany({
      where: { clienteId, isPrincipal: true },
      data: { isPrincipal: false },
    });
  }

  private prepararEnderecosParaCriacao(enderecos: CreateEnderecoDto[]) {
    const principais = enderecos.filter((endereco) => endereco.isPrincipal === true);

    if (principais.length > 1) {
      throw new BadRequestException('Informe apenas um endereco principal.');
    }

    const indicePrincipal = principais.length === 1
      ? enderecos.findIndex((endereco) => endereco.isPrincipal === true)
      : 0;

    return enderecos.map((endereco, index) => ({
      ...this.montarDadosEndereco(endereco),
      isPrincipal: index === indicePrincipal,
    }));
  }

  private montarDadosEndereco(dto: CreateEnderecoDto) {
    return {
      tipo: dto.tipo as any,
      cep: this.limparCep(dto.cep),
      logradouro: dto.logradouro.trim(),
      numero: dto.numero.trim(),
      complemento: dto.complemento?.trim(),
      bairro: dto.bairro.trim(),
      cidade: dto.cidade.trim(),
      estado: dto.estado.trim().toUpperCase(),
    };
  }

  private montarDadosEnderecoAtualizacao(dto: UpdateEnderecoDto) {
    return {
      ...(dto.tipo !== undefined && { tipo: dto.tipo as any }),
      ...(dto.cep !== undefined && { cep: this.limparCep(dto.cep) }),
      ...(dto.logradouro !== undefined && { logradouro: dto.logradouro.trim() }),
      ...(dto.numero !== undefined && { numero: dto.numero.trim() }),
      ...(dto.complemento !== undefined && { complemento: dto.complemento.trim() }),
      ...(dto.bairro !== undefined && { bairro: dto.bairro.trim() }),
      ...(dto.cidade !== undefined && { cidade: dto.cidade.trim() }),
      ...(dto.estado !== undefined && { estado: dto.estado.trim().toUpperCase() }),
      ...(dto.isPrincipal !== undefined && { isPrincipal: dto.isPrincipal }),
    };
  }

  private montarDadosContato(dto: CreateContatoDto) {
    return {
      nome: dto.nome.trim(),
      email: dto.email?.trim().toLowerCase(),
    };
  }

  private montarDadosContatoAtualizacao(dto: UpdateContatoDto) {
    return {
      ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
      ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
    };
  }

  private limparDocumentoObrigatorio(documento: string): string {
    const documentoLimpo = documento.replace(/[^\d]/g, '');

    if (!documentoLimpo) {
      throw new BadRequestException('Documento e obrigatorio.');
    }

    return documentoLimpo;
  }

  private limparCep(cep: string): string {
    const cepLimpo = cep.replace(/[^\d]/g, '');

    if (cepLimpo.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 digitos.');
    }

    return cepLimpo;
  }

  private validarPayloadComAlgumCampo(dto: object): void {
    const possuiCampoInformado = Object.values(dto).some((value) => value !== undefined);

    if (!possuiCampoInformado) {
      throw new BadRequestException('Informe ao menos um campo para atualizacao.');
    }
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