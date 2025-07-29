// =============================================================================
// SmartPeças ERP - Service - Módulo Clientes (Principal)
// =============================================================================
// Arquivo: backend/src/modules/clientes/services/clientes.service.ts
//
// Descrição: Serviço principal para o CRUD de Clientes. Refatorado para usar
// TenantContext, seguir o Princípio da Responsabilidade Única e garantir a
// integridade transacional.
//
// Versão: 5.1.0
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, ConsultarClienteDto, ClienteResponseDto } from '../dto/cliente.dto';
import { DocumentoValidatorService } from '../validacoes/documento-validator.service';
import { UnicidadeValidatorService } from '../validacoes/unicidade-validator.service';
import { ClienteMapper } from '../mappers/cliente.mapper';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { IntegridadeService } from '../validacoes/integridade.service';
import { IdempotencyService } from '../auditoria/idempotency.service';
import { Prisma, OperacaoAuditoria, TipoCliente } from '@prisma/client'; // Importação correta
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);
  private readonly ORDENACAO_PERMITIDA = ['nome', 'documento', 'createdAt', 'updatedAt'];
  private readonly CACHE_TTL = 300000; // 5 minutos

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

        const now = new Date();
        const cliente = await tx.cliente.create({
          data: {
            ...dto,
            documento: documentoLimpo,
            tenantId,
            documentoTipo: dto.tipoCliente === TipoCliente.PESSOA_FISICA ? 'CPF' : 'CNPJ',
            anoMes: `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`,
            trimestre: `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`,
            criadoPor: usuario.sub,
            criadoPorNome: usuario.name,
            criadoPorIp: usuario.ip,
            versao: 1,
          },
          include: { enderecos: true, contatos: true },
        });

        const responseDto = ClienteMapper.toResponse(cliente);
        await this.auditoriaService.registrarOperacao(tenantId, usuario, {
          operacao: OperacaoAuditoria.CRIAR,
          recurso: 'cliente', recursoId: cliente.id, dadosAtuais: responseDto,
        });

        this.logger.log(`[${tenantId}] Cliente criado: ${cliente.id} por ${usuario.name}`);
        return responseDto;
      },
    );
    await this.invalidarCacheLista(tenantId);
    return result;
  }

  async buscarPorId(id: string): Promise<ClienteResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    
    const cacheKey = `cliente:${tenantId}:${id}`;
    const cached = await this.cacheManager.get<ClienteResponseDto>(cacheKey);
    if (cached) return cached;

    const cliente = await this.prisma.cliente.findUnique({
      where: { id_tenantId: { id, tenantId } },
      include: { enderecos: true, contatos: true },
    });

    if (!cliente) throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    
    const response = ClienteMapper.toResponse(cliente);
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  async listar(filtros: ConsultarClienteDto) {
    const tenantId = this.tenantContext.getTenantId();

    if (filtros.sortBy && !this.ORDENACAO_PERMITIDA.includes(filtros.sortBy)) {
      throw new BadRequestException(`Ordenação por "${filtros.sortBy}" não é permitida.`);
    }

    const where = this.montarFiltros(filtros);
    where.tenantId = tenantId; // Adiciona o tenantId ao filtro

    const [clientes, total] = await this.prisma.$transaction([
        this.prisma.cliente.findMany({
          where,
          skip: (filtros.page - 1) * filtros.limit,
          take: filtros.limit,
          orderBy: { [filtros.sortBy]: filtros.sortOrder.toLowerCase() as Prisma.SortOrder },
          include: { enderecos: { where: { isPrincipal: true }, take: 1 } },
        }),
        this.prisma.cliente.count({ where }),
    ]);

    return {
      dados: clientes.map(ClienteMapper.toResponse),
      paginacao: { total, pagina: filtros.page, itensPorPagina: filtros.limit, totalPaginas: Math.ceil(total / filtros.limit) },
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
            where: { id_tenantId: { id, tenantId } },
            data: {
              ...dto,
              documento: documentoLimpo,
              atualizadoPor: usuario.sub,
              atualizadoPorNome: usuario.name,
              atualizadoPorIp: usuario.ip,
              versao: { increment: 1 },
            },
            include: { enderecos: true, contatos: true },
        });

        const responseDto = ClienteMapper.toResponse(cliente);
        await this.auditoriaService.registrarOperacao(tenantId, usuario, {
            operacao: OperacaoAuditoria.ATUALIZAR, recurso: 'cliente', recursoId: id, 
            dadosAnteriores: clienteAnterior, dadosAtuais: responseDto
        });
        
        return responseDto;
    });

    await this.invalidarCacheIndividual(tenantId, id);
    this.logger.log(`[${tenantId}] Cliente atualizado: ${id} por ${usuario.name}`);
    return response;
  }
  
  async desativar(id: string): Promise<void> {
    await this.alterarStatusAtividade(id, false, 'Desativação manual');
  }

  async reativar(id: string): Promise<void> {
    await this.alterarStatusAtividade(id, true, null);
  }

  private async alterarStatusAtividade(id: string, isAtivo: boolean, reason: string | null): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const usuario = this.tenantContext.getUser();
    
    if (!isAtivo) {
        await this.integridadeService.validarExclusaoCliente(tenantId, id);
    }

    const result = await this.prisma.cliente.updateMany({
        where: { id, tenantId },
        data: { isAtivo, deletedAt: isAtivo ? null : new Date(), deletedBy: isAtivo ? null : usuario.sub, deleteReason: reason },
    });

    if (result.count === 0) throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    
    await this.auditoriaService.registrarOperacao(tenantId, usuario, {
        operacao: isAtivo ? OperacaoAuditoria.REATIVAR : OperacaoAuditoria.DESATIVAR,
        recurso: 'cliente', recursoId: id, dadosAtuais: { isAtivo }
    });

    this.logger.log(`[${tenantId}] Cliente ${id} ${isAtivo ? 'reativado' : 'desativado'} por ${usuario.name}`);
    await this.invalidarCacheIndividual(tenantId, id);
  }

  private montarFiltros(filtros: ConsultarClienteDto): Prisma.ClienteWhereInput {
    const where: Prisma.ClienteWhereInput = {};
    
    if (filtros.isAtivo !== undefined) {
      where.isAtivo = filtros.isAtivo;
    }
    if (filtros.tipoCliente) {
      where.tipoCliente = filtros.tipoCliente;
    }
    if (filtros.isInadimplente !== undefined) {
      where.isInadimplente = filtros.isInadimplente;
    }
    if (filtros.nome) {
      where.OR = [
        { nome: { contains: filtros.nome, mode: 'insensitive' } },
        { nomeFantasia: { contains: filtros.nome, mode: 'insensitive' } },
      ];
    }
    if (filtros.documento) {
      const documentoLimpo = filtros.documento.replace(/[^\d]/g, '');
      const orCondition = { documento: { contains: documentoLimpo } };

      if (where.OR) {
        // Se já existe um OR (por causa do nome), adicionamos a condição de documento nele
        (where.OR as Prisma.ClienteWhereInput[]).push(orCondition);
      } else {
        where.OR = [orCondition];
      }
    }
    return where;
  }
  
  private async invalidarCacheIndividual(tenantId: string, clienteId: string): Promise<void> {
    const cliente = await this.prisma.cliente.findUnique({ 
        where: { id_tenantId: { id: clienteId, tenantId } }, 
        select: { documento: true } 
    });
    
    const patterns = [`cliente:${tenantId}:${clienteId}`];
    if (cliente?.documento) {
        patterns.push(`cliente_doc:${tenantId}:${cliente.documento}`);
    }
    
    await this.invalidarCachePatterns(patterns);
    await this.invalidarCacheLista(tenantId);
  }
  
  private async invalidarCacheLista(tenantId: string): Promise<void> {
    const patterns = [`clientes_lista:${tenantId}:*`, `estatisticas:${tenantId}`];
    await this.invalidarCachePatterns(patterns);
  }

  private async invalidarCachePatterns(patterns: string[]): Promise<void> {
    this.logger.debug(`Invalidando caches com os padrões: ${patterns.join(', ')}`);
    for (const pattern of patterns) {
        try {
            const store = (this.cacheManager.store as any);
            // A API de cache-manager pode variar. A forma mais segura é deletar por chave.
            // A busca por padrão (keys) é ineficiente e muitas vezes não recomendada em produção.
            // Para este exemplo, vamos manter a lógica, mas cientes da limitação.
            if (store && typeof store.keys === 'function') {
                const keys: string[] = await store.keys(pattern);
                if (keys.length > 0) {
                    await store.del(keys);
                }
            }
        } catch (e) {
            this.logger.error(`Falha ao invalidar cache para o padrão ${pattern}`, e);
        }
    }
  }
}