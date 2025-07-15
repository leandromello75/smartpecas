// =============================================================================
// SmartPeças ERP - Service - Módulo Clientes (Versão Otimizada v4.5.4 - FINAL)
// =============================================================================
// Arquivo: backend/src/modules/clientes/clientes.service.ts
//
// Descrição: Service completo para gestão de clientes com suporte a multi-tenancy,
// idempotência transacional, cache inteligente, retry pattern, métricas,
// rate limiting por tenant, auditoria avançada e full-text search.
//
// Versão: 4.5.6
// Equipe SmartPeças
// Atualizado em: 13/07/2025
// =============================================================================

import { Injectable, Inject, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClienteMapper } from './mappers/cliente.mapper';
import { DocumentoValidatorService } from './validacoes/documento-validator.service';
import { UnicidadeValidatorService } from './validacoes/unicidade-validator.service';
import { AuditoriaService } from './auditoria/auditoria.service';
import { IdempotencyService } from './auditoria/idempotency.service';
import { CnpjApiService } from './integracoes/cnpj-api.service';
import { CepApiService } from './integracoes/cep-api.service';
import { IntegridadeService } from './validacoes/integridade.service';
import { TenantThrottlerService } from './throttling/tenant-throttler.service';
//import { BaseTenantService } from '../../common/base-tenant/base-tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { Prisma, Cliente as PrismaClienteType, TipoCliente as PrismaTipoCliente } from '../../generated/prisma-client';
import { JwtTenantUserPayload } from '../../shared/interfaces/jwt-payload.interface';
import { 
  CreateClienteDto, 
  UpdateClienteDto,
  ConsultarClienteDto,
  ClienteResponseDto,
  ConsultarCnpjDto,
  ConsultarCepDto,
  EstatisticasResumoDto } from './dto/cliente.dto';
import { CnpjResponseDto } from './dto/cnpj-response.dto';
import { Counter, Histogram, register } from 'prom-client';
import { retry, timer as rxjsTimer } from 'rxjs';
import { from } from 'rxjs';

@Injectable()
export class ClientesService extends BaseTenantService {
  private readonly logger = new Logger(ClientesService.name);
  private readonly ORDENACAO_PERMITIDA = ['nome', 'documento', 'createdAt', 'updatedAt'];
  private readonly CACHE_TTL = 300000; // 5 minutos em MS
  private readonly CACHE_TTL_LONGO = 3600000; // 1 hora em MS

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tenantContextService: TenantContextService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mapper: ClienteMapper,
    private readonly documentoValidator: DocumentoValidatorService,
    private readonly unicidadeValidator: UnicidadeValidatorService,
    private readonly auditoriaService: AuditoriaService,
    private readonly idempotencyService: IdempotencyService,
    private readonly cnpjApi: CnpjApiService,
    private readonly cepApi: CepApiService,
    private readonly integridadeService: IntegridadeService,
    private readonly tenantThrottler: TenantThrottlerService,
    private readonly docValidator: DocumentoValidatorService,
  ) {
    super(prisma, tenantContextService);

    this.logger = new Logger(ClientesService.name);

    this.operationCounter = new Counter({
      name: 'smartpecas_clientes_operations_total',
      help: 'Total de operações de clientes por tenant',
      labelNames: ['tenant', 'operation', 'status'],
    });

    this.operationDuration = new Histogram({
      name: 'smartpecas_clientes_operation_duration_seconds',
      help: 'Duração das operações de clientes',
      labelNames: ['tenant', 'operation'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.cacheHitCounter = new Counter({
      name: 'smartpecas_clientes_cache_hits_total',
      help: 'Total de cache hits por tenant',
      labelNames: ['tenant', 'operation'],
    });

    try {
        register.registerMetric(this.operationCounter);
        register.registerMetric(this.operationDuration);
        register.registerMetric(this.cacheHitCounter);
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes('A metric with the name') && e.message.includes('is already registered')) {
            this.logger.warn('Métricas Prometheus já registradas. Ignorando...');
        } else if (e instanceof Error) {
            this.logger.error(`Erro ao registrar métricas: ${e.message}`, e.stack);
            throw e;
        } else {
            this.logger.error('Erro desconhecido ao registrar métricas.');
            throw e;
        }
    }
  }

  /**
   * Criar novo cliente com idempotência, cache e auditoria
   */
  async criar(
    tenantId: string,
    dto: CreateClienteDto,
    usuario: JwtTenantUserPayload,
    idemKey?: string
  ): Promise<ClienteResponseDto> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'criar' });

    try {
      await this.tenantThrottler.checkLimit(tenantId, 'criar');

      const result = await this.idempotencyService.executeOrRecover(
        idemKey,
        tenantId,
        'clientes.criar',
        async (tx: Prisma.TransactionClient) => {
          const documentoLimpo = dto.documento?.replace(/[^\d]/g, '');
          if (!documentoLimpo) throw new BadRequestException('Documento (CPF/CNPJ) é obrigatório.');

          // Determinar documentoTipo
          const documentoTipo = (dto.tipoCliente === PrismaTipoCliente.PESSOA_FISICA) ? 'CPF' : 'CNPJ';
          // Gerar anoMes e trimestre
          const now = new Date();
          const anoMes = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
          const trimestre = `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`;

          await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
          await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo);
          if (dto.email) await this.unicidadeValidator.validarEmail(tenantId, dto.email);

          const cliente = await tx.cliente.create({
            data: {
              ...dto,
              documento: documentoLimpo,
              tenantId,
              documentoTipo,
              documentoValido: true,
              documentoValidadoEm: now,
              anoMes,
              trimestre,
              criadoPor: usuario?.sub,
              criadoPorNome: usuario?.name,
              criadoPorIp: usuario?.ip,
              versao: 1,
            },
            include: { enderecos: true, contatos: true },
          });

          const responseDto = ClienteMapper.toResponse(cliente);

          await this.auditoriaService.registrarOperacao(
            tenantId,
            usuario,
            {
              operacao: 'CRIAR',
              recurso: 'cliente',
              recursoId: cliente.id,
              dadosAnteriores: null,
              dadosAtuais: responseDto,
              ip: usuario?.ip ?? null,
              userAgent: usuario?.userAgent ?? null,
            },
          );

          this.logger.verbose(`[${tenantId}] Cliente criado: ${cliente.id}`);
          return responseDto;
        },
        'ClientesService.criar',
      );

      await this.invalidarCacheCliente(tenantId);
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar', status: 'success' });
      return result;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar', status: 'error' });
      this.logger.error(`[${tenantId}] Erro ao criar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof BadRequestException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Erro interno ao criar cliente.');
    } finally {
      endTimer(); // Usa a variável renomeada para parar o cronômetro
    }
  }

  /**
   * Buscar cliente por ID com cache inteligente
   */
  async buscarPorId(tenantId: string, id: string): Promise<ClienteResponseDto> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'buscar_por_id' });
    
    try {
      const cacheKey = `cliente:${tenantId}:${id}`;
      
      const cached = await this.cacheManager.get<ClienteResponseDto>(cacheKey);
      if (cached) {
        this.logger.debug(`[${tenantId}] Cliente encontrado no cache: ${id}`);
        this.cacheHitCounter.inc({ tenant: tenantId, operation: 'buscar_por_id' });
        return cached;
      }

      const prisma = await this.prisma.getTenantClient(tenantId);
      const cliente = await prisma.cliente.findUnique({
        where: { id, tenantId },
        include: {
          enderecos: {
            where: { isAtivo: true },
            orderBy: [{ isPrincipal: 'desc' }]
          },
          contatos: {
            where: { isAtivo: true },
            orderBy: [{ isPrincipal: 'desc' }]
          },
        },
      });

      if (!cliente) {
        this.logger.warn(`[${tenantId}] Tentativa de acesso a cliente inexistente: ${id}`);
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
      }

      const response = ClienteMapper.toResponse(cliente);
      
      await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_id', status: 'success' });
      return response;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_id', status: 'error' });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro interno ao buscar cliente por ID.');
    } finally {
      endTimer();
    }
  }

  /**
   * Buscar cliente por documento com cache
   */
  async buscarPorDocumento(tenantId: string, documento: string): Promise<ClienteResponseDto | null> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'buscar_por_documento' });
    
    try {
      const documentoLimpo = documento.replace(/[^\d]/g, '');
      const cacheKey = `cliente_doc:${tenantId}:${documentoLimpo}`;
      
      const cached = await this.cacheManager.get<ClienteResponseDto | null>(cacheKey);
      if (cached !== undefined) {
        this.cacheHitCounter.inc({ tenant: tenantId, operation: 'buscar_por_documento' });
        return cached;
      }

      const prisma = await this.prisma.getTenantClient(tenantId);
      const cliente = await prisma.cliente.findUnique({
        where: { documento: documentoLimpo, tenantId },
        include: { enderecos: true, contatos: true },
      });

      const response = cliente ? ClienteMapper.toResponse(cliente) : null;
      
      await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_documento', status: 'success' });
      return response;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_documento', status: 'error' });
      throw new InternalServerErrorException('Erro interno ao buscar cliente por documento.');
    } finally {
      endTimer();
    }
  }

  /**
   * Listar clientes com cache e otimizações
   */
  async listar(tenantId: string, filtros: ConsultarClienteDto) {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'listar' });
    
    try {
      if (filtros.sortBy && !this.ORDENACAO_PERMITIDA.includes(filtros.sortBy)) {
        throw new BadRequestException(`A ordenação por "${filtros.sortBy}" não é permitida.`);
      }

      const isListagemSimples = filtros.page === 1 && !filtros.busca && !filtros.tipoCliente;
      const cacheKey = isListagemSimples ? `clientes_lista:${tenantId}:${JSON.stringify(filtros)}` : null;
      
      if (cacheKey) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          this.cacheHitCounter.inc({ tenant: tenantId, operation: 'listar' });
          return cached;
        }
      }

      const prisma = await this.prisma.getTenantClient(tenantId);
      const where = this.montarFiltros(filtros);

      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          where: { ...where, tenantId },
          skip: (filtros.page! - 1) * filtros.limit!,
          take: filtros.limit!,
          orderBy: { [filtros.sortBy!]: filtros.sortOrder!.toLowerCase() as Prisma.SortOrder },
          include: {
            enderecos: {
              where: { isAtivo: true, isPrincipal: true },
              take: 1
            },
            contatos: {
              where: { isAtivo: true, isPrincipal: true },
              take: 1
            },
          },
        }),
        prisma.cliente.count({ where: { ...where, tenantId } }),
      ]);

      const result = {
        dados: clientes.map(ClienteMapper.toResponse),
        paginacao: {
          pagina: filtros.page!,
          itensPorPagina: filtros.limit!,
          total,
          totalPaginas: Math.ceil(total / filtros.limit!),
        },
      };

      if (cacheKey) {
        await this.cacheManager.set(cacheKey, result, 120000);
      }

      this.operationCounter.inc({ tenant: tenantId, operation: 'listar', status: 'success' });
      return result;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'listar', status: 'error' });
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro interno ao listar clientes.');
    } finally {
      timer();
    }
  }

  /**
   * Busca com full-text search otimizada
   */
  async buscarTextoCompleto(tenantId: string, termo: string, limite: number = 20) {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'busca_texto_completo' });
    
    try {
      const cacheKey = `busca_texto:${tenantId}:${termo}:${limite}`;
      
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId, operation: 'busca_texto_completo' });
        return cached;
      }

      const prisma = await this.prisma.getTenantClient(tenantId);
      
      const clientes = await prisma.$queryRaw<PrismaClienteType[]>`
        SELECT c.*,
               ts_rank(
                 to_tsvector('portuguese',
                   coalesce(c.nome, '') || ' ' ||
                   coalesce(c."nomeFantasia", '') || ' ' ||
                   coalesce(c.email, '') || ' ' ||
                   coalesce(c.documento, '')
                 ),
                 plainto_tsquery('portuguese', ${termo})
               ) as rank
        FROM clientes c
        WHERE c."tenantId" = ${tenantId}
          AND c."isAtivo" = true
          AND to_tsvector('portuguese',
                 coalesce(c.nome, '') || ' ' ||
                 coalesce(c."nomeFantasia", '') || ' ' ||
                 coalesce(c.email, '') || ' ' ||
                 coalesce(c.documento, '')
               ) @@ plainto_tsquery('portuguese', ${termo})
        ORDER BY rank DESC, c.nome
        LIMIT ${limite}
      `;
      
      const result = clientes.map(ClienteMapper.toResponse);
      
      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'busca_texto_completo', status: 'success' });
      return result;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'busca_texto_completo', status: 'error' });
      this.logger.error(`[${tenantId}] Erro na busca full-text: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Erro interno na busca por texto completo.');
    } finally {
      timer();
    }
  }

  /**
   * Atualizar cliente com auditoria e cache
   */
  async atualizar(
    tenantId: string,
    id: string,
    dto: UpdateClienteDto,
    usuario?: any
  ): Promise<ClienteResponseDto> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'atualizar' });
    
    try {
      const clienteAnterior = await this.buscarPorId(tenantId, id);
      
      const prisma = await this.prisma.getTenantClient(tenantId);
      const documentoLimpo = dto.documento ? dto.documento.replace(/[^\d]/g, '') : undefined;

      if (documentoLimpo) {
        await this.docValidator.validar(dto.tipoCliente as PrismaTipoCliente, documentoLimpo);
        await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, id);
      }
      if (dto.email) {
        await this.unicidadeValidator.validarEmail(tenantId, dto.email, id);
      }

      const cliente = await prisma.cliente.update({
        where: { id, tenantId },
        data: {
          ...dto,
          documento: documentoLimpo,
          atualizadoPor: usuario?.sub,
          atualizadoPorNome: usuario?.name,
          atualizadoPorIp: usuario?.ip,
          versao: { increment: 1 },
        },
        include: { enderecos: true, contatos: true },
      });

      const response = ClienteMapper.toResponse(cliente);

      await this.auditoriaService.registrarOperacao(
        tenantId,
        usuario,
        {
          operacao: 'ATUALIZAR',
          recurso: 'cliente',
          recursoId: id,
          dadosAnteriores: clienteAnterior,
          dadosAtuais: response,
          ip: usuario?.ip ?? null,
          userAgent: usuario?.userAgent ?? null,
        },
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Cliente atualizado: ${id}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'atualizar', status: 'success' });
      return response;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'atualizar', status: 'error' });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro interno ao atualizar cliente.');
    } finally {
      timer();
    }
  }

  /**
   * Desativar cliente com validação de integridade
   */
  async desativar(tenantId: string, id: string, usuario?: any): Promise<void> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'desativar' });
    
    try {
      await this.integridadeService.validarExclusaoCliente(tenantId, id);

      const prisma = await this.prisma.getTenantClient(tenantId);
      const result = await prisma.cliente.updateMany({
        where: { id, tenantId },
        data: {
          isAtivo: false,
          deletedAt: new Date(),
          deletedBy: usuario?.sub,
          deleteReason: 'Desativação manual',
        }
      });

      if (result.count === 0) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado para desativação.`);
      }

      await this.auditoriaService.registrarOperacao(
        tenantId,
        usuario,
        {
          operacao: 'DESATIVAR',
          recurso: 'cliente',
          recursoId: id,
          dadosAnteriores: null,
          dadosAtuais: { isAtivo: false },
          ip: usuario?.ip ?? null,
          userAgent: usuario?.userAgent ?? null,
        },
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Cliente desativado: ${id}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'desativar', status: 'success' });

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'desativar', status: 'error' });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro interno ao desativar cliente.');
    } finally {
      timer();
    }
  }

  /**
   * Reativar cliente
   */
  async reativar(tenantId: string, id: string, usuario?: any): Promise<void> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'reativar' });
    
    try {
      const prisma = await this.prisma.getTenantClient(tenantId);
      const result = await prisma.cliente.updateMany({
        where: { id, tenantId },
        data: {
          isAtivo: true,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
        }
      });

      if (result.count === 0) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado para reativação.`);
      }

      await this.auditoriaService.registrarOperacao(
        tenantId,
        usuario,
        {
          operacao: 'REATIVAR',
          recurso: 'cliente',
          recursoId: id,
          dadosAnteriores: null,
          dadosAtuais: { isAtivo: true },
          ip: usuario?.ip ?? null,
          userAgent: usuario?.userAgent ?? null,
        },
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Cliente reativado: ${id}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'reativar', status: 'success' });

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'reativar', status: 'error' });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro interno ao reativar cliente.');
    } finally {
      timer();
    }
  }

  /**
   * Alterar status de inadimplência
   */
  async alterarStatusInadimplencia(
    tenantId: string,
    id: string,
    inadimplente: boolean,
    usuario?: any
  ): Promise<void> {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'alterar_inadimplencia' });
    
    try {
      const prisma = await this.prisma.getTenantClient(tenantId);
      const result = await prisma.cliente.updateMany({
        where: { id, tenantId },
        data: { isInadimplente: inadimplente }
      });

      if (result.count === 0) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
      }

      await this.auditoriaService.registrarOperacao(
        tenantId,
        usuario,
        {
          operacao: inadimplente ? 'MARCAR_INADIMPLENTE' : 'DESMARCAR_INADIMPLENTE',
          recurso: 'cliente',
          recursoId: id,
          dadosAnteriores: null,
          dadosAtuais: { isInadimplente: inadimplente },
          ip: usuario?.ip ?? null,
          userAgent: usuario?.userAgent ?? null,
        },
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Status inadimplência do cliente ${id}: ${inadimplente}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'alterar_inadimplencia', status: 'success' });

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'alterar_inadimplencia', status: 'error' });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro interno ao alterar status de inadimplência.');
    } finally {
      timer();
    }
  }

  /**
   * Consultar CNPJ com retry pattern e rate limiting
   */
  async consultarCnpj(dto: ConsultarCnpjDto, tenantId?: string) {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId || 'global', operation: 'consultar_cnpj' });
    
    try {
      if (tenantId) {
        await this.tenantThrottler.checkLimit(tenantId, 'consultar-cnpj');
      }

      const cacheKey = `cnpj:${dto.cnpj}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj' });
        return cached;
      }

      const result = await from(this.cnpjApi.consultar(dto.cnpj))
        .pipe(
          retry({
            count: 3,
            delay: (_error: unknown, retryCount: number) => { // 'error' renomeado para '_error'
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(`[${tenantId}] Tentativa ${retryCount + 1} de consulta CNPJ ${dto.cnpj} em ${delay}ms`);
              return rxjsTimer(delay);
            },
          })
        )
        .toPromise();

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
      
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj', status: 'success' });
      return result;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj', status: 'error' });
      this.logger.error(`Erro ao consultar CNPJ ${dto.cnpj} após 3 tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
      
      if (error instanceof BadRequestException || (error as any)?.response?.status === 400) {
        throw new BadRequestException(`CNPJ inválido ou não encontrado: ${dto.cnpj}`);
      }
      throw new InternalServerErrorException('Serviço de CNPJ temporariamente indisponível.');
    } finally {
      endTimer();
    }
  }

  /**
   * Consultar CEP com retry pattern e cache
   */
  async consultarCep(dto: ConsultarCepDto, tenantId?: string) {
    const endTimer = this.operationDuration.startTimer({ tenant: tenantId || 'global', operation: 'consultar_cep' });
    
    try {
      if (tenantId) {
        await this.tenantThrottler.checkLimit(tenantId, 'consultar-cep');
      }

      const cacheKey = `cep:${dto.cep}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep' });
        return cached;
      }

      const result = await from(this.cepApi.consultar(dto.cep))
        .pipe(
          retry({
            count: 3,
            delay: (_error: unknown, retryCount: number) => {
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(`[${tenantId}] Tentativa ${retryCount + 1} de consulta CEP ${dto.cep} em ${delay}ms`);
              return rxjsTimer(delay);
            },
          })
        )
        .toPromise();

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
      
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep', status: 'success' });
      return result;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep', status: 'error' });
      this.logger.error(`Erro ao consultar CEP ${dto.cep} após 3 tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
      
      if (error instanceof BadRequestException || (error as any)?.response?.status === 400 || (error as any)?.response?.data?.erro) {
        throw new BadRequestException(`CEP inválido ou não encontrado: ${dto.cep}`);
      }
      throw new InternalServerErrorException('Serviço de CEP temporariamente indisponível.');
    } finally {
      endTimer();
    }
  }

  async criarClienteComCnpj(
    tenantId: string,
    cnpj: string,
    meta: Partial<CreateClienteDto>,
    usuario?: any,
    idemKey?: string
  ) {
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'criar_com_cnpj' });
    
    try {
      let dadosCnpj: CnpjResponseDto;
      try {
        dadosCnpj = await this.consultarCnpj({ cnpj }, tenantId);
      } catch (error: unknown) {
        this.logger.error(`Erro ao consultar CNPJ para criação de cliente ${cnpj}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        if (error instanceof BadRequestException || (error as any)?.response?.status === 400) {
          throw new BadRequestException(`Não foi possível obter dados para o CNPJ fornecido: ${cnpj}`);
        }
        throw new InternalServerErrorException('Erro ao criar cliente com CNPJ. Falha na consulta externa.');
      }

      const dto: CreateClienteDto = {
        tipoCliente: 'PESSOA_JURIDICA',
        nome: dadosCnpj.nome,
        nomeFantasia: dadosCnpj.fantasia,
        documento: dadosCnpj.cnpj,
        email: dadosCnpj.email,
        telefone: dadosCnpj.telefone,
        cep: dadosCnpj.cep,
        logradouro: dadosCnpj.logradouro,
        numero: dadosCnpj.numero,
        complemento: dadosCnpj.complemento,
        bairro: dadosCnpj.bairro,
        cidade: dadosCnpj.municipio,
        estado: dadosCnpj.uf,
        dadosCnpjApi: dadosCnpj,
        ultimaConsultaCnpj: new Date(),
        ...meta,
      };

      const result = await this.criar(tenantId, dto, usuario, idemKey);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar_com_cnpj', status: 'success' });
      return result;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar_com_cnpj', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Obter estatísticas resumo com cache
   */
  async obterEstatisticasResumo(tenantId: string): Promise<EstatisticasResumoDto> {
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'estatisticas' });
    
    try {
      const cacheKey = `estatisticas:${tenantId}`;
      
      const cached = await this.cacheManager.get<EstatisticasResumoDto>(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId, operation: 'estatisticas' });
        return cached;
      }

      const prisma = await this.prisma.getTenantClient(tenantId);
      
      const [
        totalClientes,
        clientesAtivos,
        clientesInadimplentes,
        clientesPF,
        clientesPJ,
        clientesUltimos30Dias,
      ] = await Promise.all([
        prisma.cliente.count({ where: { tenantId } }),
        prisma.cliente.count({ where: { tenantId, isAtivo: true } }),
        prisma.cliente.count({ where: { tenantId, isInadimplente: true } }),
        prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_FISICA' } }),
        prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_JURIDICA' } }),
        prisma.cliente.count({
          where: {
            tenantId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }),
      ]);

      const estatisticas: EstatisticasResumoDto = {
        totalClientes,
        clientesAtivos,
        clientesInativos: totalClientes - clientesAtivos,
        clientesInadimplentes,
        clientesPessoaFisica: clientesPF,
        clientesPessoaJuridica: clientesPJ,
        clientesUltimos30Dias,
        percentualInadimplencia: totalClientes > 0 ? (clientesInadimplentes / totalClientes) * 100 : 0,
      };

      await this.cacheManager.set(cacheKey, estatisticas, this.CACHE_TTL);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'estatisticas', status: 'success' });
      return estatisticas;

    } catch (error: unknown) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'estatisticas', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Métodos privados auxiliares
   */
  private montarFiltros(f: ConsultarClienteDto) {
    const where: any = {};
    if (f.isAtivo !== undefined) where.isAtivo = f.isAtivo;
    if (f.tipoCliente) where.tipoCliente = f.tipoCliente;
    if (f.isInadimplente !== undefined) where.isInadimplente = f.isInadimplente;
    if (f.nome) {
      where.OR = [
        { nome: { contains: f.nome, mode: 'insensitive' } },
        { nomeFantasia: { contains: f.nome, mode: 'insensitive' } },
      ];
    }
    if (f.documento) {
        const documentoLimpo = f.documento.replace(/[^\d]/g, '');
        if (where.OR) {
            where.OR.push({ documento: { contains: documentoLimpo } });
        } else {
            where.OR = [{ documento: { contains: documentoLimpo } }];
        }
    }
    return where;
  }

  private async invalidarCacheCliente(tenantId: string, clienteId?: string): Promise<void> {
    const patterns = [
      `clientes_lista:${tenantId}:*`,
      `estatisticas:${tenantId}`,
    ];

    if (clienteId) {
      patterns.push(`cliente:${tenantId}:${clienteId}`);
      patterns.push(`cliente_doc:${tenantId}:*`);
    }

    await Promise.all(patterns.map(async (pattern: string) => {
        try {
            if (this.cacheManager.store && typeof this.cacheManager.store.keys === 'function') {
                const keys = await this.cacheManager.store.keys(pattern);
                await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
            } else {
                await this.cacheManager.del(pattern);
            }
        } catch (error: unknown) {
            this.logger.warn(`Erro ao invalidar cache para o padrão ${pattern}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }));
  }
}