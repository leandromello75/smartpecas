"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ClientesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prom_client_1 = require("prom-client");
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
const cnpj_api_service_1 = require("./integracoes/cnpj-api.service");
const cep_api_service_1 = require("./integracoes/cep-api.service");
const documento_validator_service_1 = require("./validacoes/documento-validator.service");
const unicidade_validator_service_1 = require("./validacoes/unicidade-validator.service");
const cliente_mapper_1 = require("./mappers/cliente.mapper");
const auditoria_service_1 = require("./auditoria/auditoria.service");
const integridade_service_1 = require("./validacoes/integridade.service");
const tenant_throttler_service_1 = require("./throttling/tenant-throttler.service");
const idempotency_service_1 = require("./auditoria/idempotency.service");
let ClientesService = ClientesService_1 = class ClientesService {
    constructor(prisma, cnpjApi, cepApi, docValidator, unicidadeValidator, auditoriaService, integridadeService, tenantThrottler, cacheManager, idempotencyService) {
        this.prisma = prisma;
        this.cnpjApi = cnpjApi;
        this.cepApi = cepApi;
        this.docValidator = docValidator;
        this.unicidadeValidator = unicidadeValidator;
        this.auditoriaService = auditoriaService;
        this.integridadeService = integridadeService;
        this.tenantThrottler = tenantThrottler;
        this.cacheManager = cacheManager;
        this.idempotencyService = idempotencyService;
        this.ORDENACAO_PERMITIDA = ['nome', 'documento', 'createdAt', 'updatedAt'];
        this.CACHE_TTL = 300000;
        this.CACHE_TTL_LONGO = 3600000;
        this.logger = new common_1.Logger(ClientesService_1.name);
        this.operationCounter = new prom_client_1.Counter({
            name: 'smartpecas_clientes_operations_total',
            help: 'Total de operações de clientes por tenant',
            labelNames: ['tenant', 'operation', 'status'],
        });
        this.operationDuration = new prom_client_1.Histogram({
            name: 'smartpecas_clientes_operation_duration_seconds',
            help: 'Duração das operações de clientes',
            labelNames: ['tenant', 'operation'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
        });
        this.cacheHitCounter = new prom_client_1.Counter({
            name: 'smartpecas_clientes_cache_hits_total',
            help: 'Total de cache hits por tenant',
            labelNames: ['tenant', 'operation'],
        });
        try {
            prom_client_1.register.registerMetric(this.operationCounter);
            prom_client_1.register.registerMetric(this.operationDuration);
            prom_client_1.register.registerMetric(this.cacheHitCounter);
        }
        catch (e) {
            if (e instanceof Error && e.message.includes('A metric with the name') && e.message.includes('is already registered')) {
                this.logger.warn('Métricas Prometheus já registradas. Ignorando...');
            }
            else if (e instanceof Error) {
                this.logger.error(`Erro ao registrar métricas: ${e.message}`, e.stack);
                throw e;
            }
            else {
                this.logger.error('Erro desconhecido ao registrar métricas.');
                throw e;
            }
        }
    }
    async criar(tenantId, dto, usuario, idemKey) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'criar' });
        try {
            await this.tenantThrottler.checkLimit(tenantId, 'criar');
            const result = await this.idempotencyService.executeOrRecover(idemKey, tenantId, 'clientes.criar', async (tx) => {
                const documentoLimpo = dto.documento?.replace(/[^\d]/g, '');
                if (!documentoLimpo)
                    throw new common_1.BadRequestException('Documento (CPF/CNPJ) é obrigatório.');
                await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
                await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo);
                if (dto.email)
                    await this.unicidadeValidator.validarEmail(tenantId, dto.email);
                const cliente = await tx.cliente.create({
                    data: {
                        ...dto,
                        documento: documentoLimpo,
                        tenantId,
                        criadoPor: usuario?.id,
                        criadoPorNome: usuario?.name,
                        criadoPorIp: usuario?.ip,
                        versao: 1,
                    },
                    include: { enderecos: true, contatos: true },
                });
                const responseDto = cliente_mapper_1.ClienteMapper.toResponse(cliente);
                await this.auditoriaService.registrarOperacao(tenantId, 'CRIAR', cliente.id, null, responseDto, usuario);
                this.logger.verbose(`[${tenantId}] Cliente criado: ${cliente.id}`);
                return responseDto;
            }, 'ClientesService.criar');
            await this.invalidarCacheCliente(tenantId);
            this.operationCounter.inc({ tenant: tenantId, operation: 'criar', status: 'success' });
            return result;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'criar', status: 'error' });
            this.logger.error(`[${tenantId}] Erro ao criar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.ConflictException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao criar cliente.');
        }
        finally {
            timer();
        }
    }
    async buscarPorId(tenantId, id) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'buscar_por_id' });
        try {
            const cacheKey = `cliente:${tenantId}:${id}`;
            const cached = await this.cacheManager.get(cacheKey);
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
                throw new common_1.NotFoundException(`Cliente com ID "${id}" não encontrado.`);
            }
            const response = cliente_mapper_1.ClienteMapper.toResponse(cliente);
            await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
            this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_id', status: 'success' });
            return response;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_id', status: 'error' });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao buscar cliente por ID.');
        }
        finally {
            timer();
        }
    }
    async buscarPorDocumento(tenantId, documento) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'buscar_por_documento' });
        try {
            const documentoLimpo = documento.replace(/[^\d]/g, '');
            const cacheKey = `cliente_doc:${tenantId}:${documentoLimpo}`;
            const cached = await this.cacheManager.get(cacheKey);
            if (cached !== undefined) {
                this.cacheHitCounter.inc({ tenant: tenantId, operation: 'buscar_por_documento' });
                return cached;
            }
            const prisma = await this.prisma.getTenantClient(tenantId);
            const cliente = await prisma.cliente.findUnique({
                where: { documento: documentoLimpo, tenantId },
                include: { enderecos: true, contatos: true },
            });
            const response = cliente ? cliente_mapper_1.ClienteMapper.toResponse(cliente) : null;
            await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
            this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_documento', status: 'success' });
            return response;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'buscar_por_documento', status: 'error' });
            throw new common_1.InternalServerErrorException('Erro interno ao buscar cliente por documento.');
        }
        finally {
            timer();
        }
    }
    async listar(tenantId, filtros) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'listar' });
        try {
            if (filtros.sortBy && !this.ORDENACAO_PERMITIDA.includes(filtros.sortBy)) {
                throw new common_1.BadRequestException(`A ordenação por "${filtros.sortBy}" não é permitida.`);
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
                    skip: (filtros.page - 1) * filtros.limit,
                    take: filtros.limit,
                    orderBy: { [filtros.sortBy]: filtros.sortOrder.toLowerCase() },
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
                dados: clientes.map(cliente_mapper_1.ClienteMapper.toResponse),
                paginacao: {
                    pagina: filtros.page,
                    itensPorPagina: filtros.limit,
                    total,
                    totalPaginas: Math.ceil(total / filtros.limit),
                },
            };
            if (cacheKey) {
                await this.cacheManager.set(cacheKey, result, 120000);
            }
            this.operationCounter.inc({ tenant: tenantId, operation: 'listar', status: 'success' });
            return result;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'listar', status: 'error' });
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao listar clientes.');
        }
        finally {
            timer();
        }
    }
    async buscarTextoCompleto(tenantId, termo, limite = 20) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'busca_texto_completo' });
        try {
            const cacheKey = `busca_texto:${tenantId}:${termo}:${limite}`;
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.cacheHitCounter.inc({ tenant: tenantId, operation: 'busca_texto_completo' });
                return cached;
            }
            const prisma = await this.prisma.getTenantClient(tenantId);
            const clientes = await prisma.$queryRaw `
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
            const result = clientes.map(cliente_mapper_1.ClienteMapper.toResponse);
            await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
            this.operationCounter.inc({ tenant: tenantId, operation: 'busca_texto_completo', status: 'success' });
            return result;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'busca_texto_completo', status: 'error' });
            this.logger.error(`[${tenantId}] Erro na busca full-text: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            throw new common_1.InternalServerErrorException('Erro interno na busca por texto completo.');
        }
        finally {
            timer();
        }
    }
    async atualizar(tenantId, id, dto, usuario) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'atualizar' });
        try {
            const clienteAnterior = await this.buscarPorId(tenantId, id);
            const prisma = await this.prisma.getTenantClient(tenantId);
            const documentoLimpo = dto.documento ? dto.documento.replace(/[^\d]/g, '') : undefined;
            if (documentoLimpo) {
                await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
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
                    atualizadoPor: usuario?.id,
                    atualizadoPorNome: usuario?.name,
                    atualizadoPorIp: usuario?.ip,
                    versao: { increment: 1 },
                },
                include: { enderecos: true, contatos: true },
            });
            const response = cliente_mapper_1.ClienteMapper.toResponse(cliente);
            await this.auditoriaService.registrarOperacao(tenantId, 'ATUALIZAR', id, clienteAnterior, response, usuario);
            await this.invalidarCacheCliente(tenantId, id);
            this.logger.verbose(`[${tenantId}] Cliente atualizado: ${id}`);
            this.operationCounter.inc({ tenant: tenantId, operation: 'atualizar', status: 'success' });
            return response;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'atualizar', status: 'error' });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao atualizar cliente.');
        }
        finally {
            timer();
        }
    }
    async desativar(tenantId, id, usuario) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'desativar' });
        try {
            await this.integridadeService.validarExclusaoCliente(tenantId, id);
            const prisma = await this.prisma.getTenantClient(tenantId);
            const result = await prisma.cliente.updateMany({
                where: { id, tenantId },
                data: {
                    isAtivo: false,
                    deletedAt: new Date(),
                    deletedBy: usuario?.id,
                    deleteReason: 'Desativação manual',
                }
            });
            if (result.count === 0) {
                throw new common_1.NotFoundException(`Cliente com ID "${id}" não encontrado para desativação.`);
            }
            await this.auditoriaService.registrarOperacao(tenantId, 'DESATIVAR', id, null, { isAtivo: false }, usuario);
            await this.invalidarCacheCliente(tenantId, id);
            this.logger.verbose(`[${tenantId}] Cliente desativado: ${id}`);
            this.operationCounter.inc({ tenant: tenantId, operation: 'desativar', status: 'success' });
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'desativar', status: 'error' });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao desativar cliente.');
        }
        finally {
            timer();
        }
    }
    async reativar(tenantId, id, usuario) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'reativar' });
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
                throw new common_1.NotFoundException(`Cliente com ID "${id}" não encontrado para reativação.`);
            }
            await this.auditoriaService.registrarOperacao(tenantId, 'REATIVAR', id, null, { isAtivo: true }, usuario);
            await this.invalidarCacheCliente(tenantId, id);
            this.logger.verbose(`[${tenantId}] Cliente reativado: ${id}`);
            this.operationCounter.inc({ tenant: tenantId, operation: 'reativar', status: 'success' });
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'reativar', status: 'error' });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao reativar cliente.');
        }
        finally {
            timer();
        }
    }
    async alterarStatusInadimplencia(tenantId, id, inadimplente, usuario) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'alterar_inadimplencia' });
        try {
            const prisma = await this.prisma.getTenantClient(tenantId);
            const result = await prisma.cliente.updateMany({
                where: { id, tenantId },
                data: { isInadimplente: inadimplente }
            });
            if (result.count === 0) {
                throw new common_1.NotFoundException(`Cliente com ID "${id}" não encontrado.`);
            }
            await this.auditoriaService.registrarOperacao(tenantId, inadimplente ? 'MARCAR_INADIMPLENTE' : 'DESMARCAR_INADIMPLENTE', id, null, { isInadimplente: inadimplente }, usuario);
            await this.invalidarCacheCliente(tenantId, id);
            this.logger.verbose(`[${tenantId}] Status inadimplência do cliente ${id}: ${inadimplente}`);
            this.operationCounter.inc({ tenant: tenantId, operation: 'alterar_inadimplencia', status: 'success' });
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'alterar_inadimplencia', status: 'error' });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Erro interno ao alterar status de inadimplência.');
        }
        finally {
            timer();
        }
    }
    async consultarCnpj(dto, tenantId) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId || 'global', operation: 'consultar_cnpj' });
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
            const result = await (0, rxjs_2.from)(this.cnpjApi.consultar(dto.cnpj))
                .pipe((0, rxjs_1.retry)({
                count: 3,
                delay: (error, retryCount) => {
                    const delay = Math.pow(2, retryCount) * 1000;
                    this.logger.warn(`[${tenantId}] Tentativa ${retryCount + 1} de consulta CNPJ ${dto.cnpj} em ${delay}ms`);
                    return timer(delay);
                },
            }))
                .toPromise();
            await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
            this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj', status: 'success' });
            return result;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj', status: 'error' });
            this.logger.error(`Erro ao consultar CNPJ ${dto.cnpj} após 3 tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            if (error instanceof common_1.BadRequestException || error?.response?.status === 400) {
                throw new common_1.BadRequestException(`CNPJ inválido ou não encontrado: ${dto.cnpj}`);
            }
            throw new common_1.InternalServerErrorException('Serviço de CNPJ temporariamente indisponível.');
        }
        finally {
            timer();
        }
    }
    async consultarCep(dto, tenantId) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId || 'global', operation: 'consultar_cep' });
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
            const result = await (0, rxjs_2.from)(this.cepApi.consultar(dto.cep))
                .pipe((0, rxjs_1.retry)({
                count: 3,
                delay: (error, retryCount) => {
                    const delay = Math.pow(2, retryCount) * 1000;
                    this.logger.warn(`[${tenantId}] Tentativa ${retryCount + 1} de consulta CEP ${dto.cep} em ${delay}ms`);
                    return timer(delay);
                },
            }))
                .toPromise();
            await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
            this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep', status: 'success' });
            return result;
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep', status: 'error' });
            this.logger.error(`Erro ao consultar CEP ${dto.cep} após 3 tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            if (error instanceof common_1.BadRequestException || error?.response?.status === 400 || error?.response?.data?.erro) {
                throw new common_1.BadRequestException(`CEP inválido ou não encontrado: ${dto.cep}`);
            }
            throw new common_1.InternalServerErrorException('Serviço de CEP temporariamente indisponível.');
        }
        finally {
            timer();
        }
    }
    async criarClienteComCnpj(tenantId, cnpj, meta, usuario, idemKey) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'criar_com_cnpj' });
        try {
            let dadosCnpj;
            try {
                dadosCnpj = await this.consultarCnpj({ cnpj }, tenantId);
            }
            catch (error) {
                this.logger.error(`Erro ao consultar CNPJ para criação de cliente ${cnpj}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                if (error instanceof common_1.BadRequestException || error?.response?.status === 400) {
                    throw new common_1.BadRequestException(`Não foi possível obter dados para o CNPJ fornecido: ${cnpj}`);
                }
                throw new common_1.InternalServerErrorException('Erro ao criar cliente com CNPJ. Falha na consulta externa.');
            }
            const dto = {
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
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'criar_com_cnpj', status: 'error' });
            throw error;
        }
        finally {
            timer();
        }
    }
    async obterEstatisticasResumo(tenantId) {
        const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'estatisticas' });
        try {
            const cacheKey = `estatisticas:${tenantId}`;
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.cacheHitCounter.inc({ tenant: tenantId, operation: 'estatisticas' });
                return cached;
            }
            const prisma = await this.prisma.getTenantClient(tenantId);
            const [totalClientes, clientesAtivos, clientesInadimplentes, clientesPF, clientesPJ, clientesUltimos30Dias,] = await Promise.all([
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
            const estatisticas = {
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
        }
        catch (error) {
            this.operationCounter.inc({ tenant: tenantId, operation: 'estatisticas', status: 'error' });
            throw error;
        }
        finally {
            timer();
        }
    }
    montarFiltros(f) {
        const where = {};
        if (f.isAtivo !== undefined)
            where.isAtivo = f.isAtivo;
        if (f.tipoCliente)
            where.tipoCliente = f.tipoCliente;
        if (f.isInadimplente !== undefined)
            where.isInadimplente = f.isInadimplente;
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
            }
            else {
                where.OR = [{ documento: { contains: documentoLimpo } }];
            }
        }
        return where;
    }
    async invalidarCacheCliente(tenantId, clienteId) {
        const patterns = [
            `clientes_lista:${tenantId}:*`,
            `estatisticas:${tenantId}`,
        ];
        if (clienteId) {
            patterns.push(`cliente:${tenantId}:${clienteId}`);
            patterns.push(`cliente_doc:${tenantId}:*`);
        }
        await Promise.all(patterns.map(async (pattern) => {
            try {
                if (this.cacheManager.store && typeof this.cacheManager.store.keys === 'function') {
                    const keys = await this.cacheManager.store.keys(pattern);
                    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
                }
                else {
                    await this.cacheManager.del(pattern);
                }
            }
            catch (error) {
                this.logger.warn(`Erro ao invalidar cache para o padrão ${pattern}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
        }));
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = ClientesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cnpj_api_service_1.CnpjApiService,
        cep_api_service_1.CepApiService,
        documento_validator_service_1.DocumentoValidatorService,
        unicidade_validator_service_1.UnicidadeValidatorService,
        auditoria_service_1.AuditoriaService,
        integridade_service_1.IntegridadeService,
        tenant_throttler_service_1.TenantThrottlerService, Object, idempotency_service_1.IdempotencyService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map