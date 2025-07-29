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
const prisma_service_1 = require("../../../prisma/prisma.service");
const documento_validator_service_1 = require("../validacoes/documento-validator.service");
const unicidade_validator_service_1 = require("../validacoes/unicidade-validator.service");
const cliente_mapper_1 = require("../mappers/cliente.mapper");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const integridade_service_1 = require("../validacoes/integridade.service");
const idempotency_service_1 = require("../auditoria/idempotency.service");
const client_1 = require("@prisma/client");
const tenant_context_service_1 = require("../../../common/tenant-context/tenant-context.service");
let ClientesService = ClientesService_1 = class ClientesService {
    constructor(prisma, docValidator, unicidadeValidator, auditoriaService, integridadeService, cacheManager, idempotencyService, tenantContext) {
        this.prisma = prisma;
        this.docValidator = docValidator;
        this.unicidadeValidator = unicidadeValidator;
        this.auditoriaService = auditoriaService;
        this.integridadeService = integridadeService;
        this.cacheManager = cacheManager;
        this.idempotencyService = idempotencyService;
        this.tenantContext = tenantContext;
        this.logger = new common_1.Logger(ClientesService_1.name);
        this.ORDENACAO_PERMITIDA = ['nome', 'documento', 'createdAt', 'updatedAt'];
        this.CACHE_TTL = 300000;
    }
    async criar(dto, idemKey) {
        const tenantId = this.tenantContext.getTenantId();
        const usuario = this.tenantContext.getUser();
        const result = await this.idempotencyService.executeOrRecover(idemKey, tenantId, 'clientes.criar', async (tx) => {
            const documentoLimpo = dto.documento?.replace(/[^\d]/g, '');
            if (!documentoLimpo)
                throw new common_1.BadRequestException('Documento é obrigatório.');
            await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
            await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, undefined, tx);
            if (dto.email)
                await this.unicidadeValidator.validarEmail(tenantId, dto.email, undefined, tx);
            const now = new Date();
            const cliente = await tx.cliente.create({
                data: {
                    ...dto,
                    documento: documentoLimpo,
                    tenantId,
                    documentoTipo: dto.tipoCliente === client_1.TipoCliente.PESSOA_FISICA ? 'CPF' : 'CNPJ',
                    anoMes: `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`,
                    trimestre: `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`,
                    criadoPor: usuario.sub,
                    criadoPorNome: usuario.name,
                    criadoPorIp: usuario.ip,
                    versao: 1,
                },
                include: { enderecos: true, contatos: true },
            });
            const responseDto = cliente_mapper_1.ClienteMapper.toResponse(cliente);
            await this.auditoriaService.registrarOperacao(tenantId, usuario, {
                operacao: client_1.OperacaoAuditoria.CRIAR,
                recurso: 'cliente', recursoId: cliente.id, dadosAtuais: responseDto,
            });
            this.logger.log(`[${tenantId}] Cliente criado: ${cliente.id} por ${usuario.name}`);
            return responseDto;
        });
        await this.invalidarCacheLista(tenantId);
        return result;
    }
    async buscarPorId(id) {
        const tenantId = this.tenantContext.getTenantId();
        const cacheKey = `cliente:${tenantId}:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const cliente = await this.prisma.cliente.findUnique({
            where: { id_tenantId: { id, tenantId } },
            include: { enderecos: true, contatos: true },
        });
        if (!cliente)
            throw new common_1.NotFoundException(`Cliente com ID "${id}" não encontrado.`);
        const response = cliente_mapper_1.ClienteMapper.toResponse(cliente);
        await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
        return response;
    }
    async listar(filtros) {
        const tenantId = this.tenantContext.getTenantId();
        if (filtros.sortBy && !this.ORDENACAO_PERMITIDA.includes(filtros.sortBy)) {
            throw new common_1.BadRequestException(`Ordenação por "${filtros.sortBy}" não é permitida.`);
        }
        const where = this.montarFiltros(filtros);
        where.tenantId = tenantId;
        const [clientes, total] = await this.prisma.$transaction([
            this.prisma.cliente.findMany({
                where,
                skip: (filtros.page - 1) * filtros.limit,
                take: filtros.limit,
                orderBy: { [filtros.sortBy]: filtros.sortOrder.toLowerCase() },
                include: { enderecos: { where: { isPrincipal: true }, take: 1 } },
            }),
            this.prisma.cliente.count({ where }),
        ]);
        return {
            dados: clientes.map(cliente_mapper_1.ClienteMapper.toResponse),
            paginacao: { total, pagina: filtros.page, itensPorPagina: filtros.limit, totalPaginas: Math.ceil(total / filtros.limit) },
        };
    }
    async atualizar(id, dto) {
        const tenantId = this.tenantContext.getTenantId();
        const usuario = this.tenantContext.getUser();
        const clienteAnterior = await this.buscarPorId(id);
        const documentoLimpo = dto.documento ? dto.documento.replace(/[^\d]/g, '') : undefined;
        const response = await this.prisma.$transaction(async (tx) => {
            if (documentoLimpo) {
                await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
                await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, id, tx);
            }
            if (dto.email)
                await this.unicidadeValidator.validarEmail(tenantId, dto.email, id, tx);
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
            const responseDto = cliente_mapper_1.ClienteMapper.toResponse(cliente);
            await this.auditoriaService.registrarOperacao(tenantId, usuario, {
                operacao: client_1.OperacaoAuditoria.ATUALIZAR, recurso: 'cliente', recursoId: id,
                dadosAnteriores: clienteAnterior, dadosAtuais: responseDto
            });
            return responseDto;
        });
        await this.invalidarCacheIndividual(tenantId, id);
        this.logger.log(`[${tenantId}] Cliente atualizado: ${id} por ${usuario.name}`);
        return response;
    }
    async desativar(id) {
        await this.alterarStatusAtividade(id, false, 'Desativação manual');
    }
    async reativar(id) {
        await this.alterarStatusAtividade(id, true, null);
    }
    async alterarStatusAtividade(id, isAtivo, reason) {
        const tenantId = this.tenantContext.getTenantId();
        const usuario = this.tenantContext.getUser();
        if (!isAtivo) {
            await this.integridadeService.validarExclusaoCliente(tenantId, id);
        }
        const result = await this.prisma.cliente.updateMany({
            where: { id, tenantId },
            data: { isAtivo, deletedAt: isAtivo ? null : new Date(), deletedBy: isAtivo ? null : usuario.sub, deleteReason: reason },
        });
        if (result.count === 0)
            throw new common_1.NotFoundException(`Cliente com ID "${id}" não encontrado.`);
        await this.auditoriaService.registrarOperacao(tenantId, usuario, {
            operacao: isAtivo ? client_1.OperacaoAuditoria.REATIVAR : client_1.OperacaoAuditoria.DESATIVAR,
            recurso: 'cliente', recursoId: id, dadosAtuais: { isAtivo }
        });
        this.logger.log(`[${tenantId}] Cliente ${id} ${isAtivo ? 'reativado' : 'desativado'} por ${usuario.name}`);
        await this.invalidarCacheIndividual(tenantId, id);
    }
    montarFiltros(filtros) {
        const where = {};
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
                where.OR.push(orCondition);
            }
            else {
                where.OR = [orCondition];
            }
        }
        return where;
    }
    async invalidarCacheIndividual(tenantId, clienteId) {
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
    async invalidarCacheLista(tenantId) {
        const patterns = [`clientes_lista:${tenantId}:*`, `estatisticas:${tenantId}`];
        await this.invalidarCachePatterns(patterns);
    }
    async invalidarCachePatterns(patterns) {
        this.logger.debug(`Invalidando caches com os padrões: ${patterns.join(', ')}`);
        for (const pattern of patterns) {
            try {
                const store = this.cacheManager.store;
                if (store && typeof store.keys === 'function') {
                    const keys = await store.keys(pattern);
                    if (keys.length > 0) {
                        await store.del(keys);
                    }
                }
            }
            catch (e) {
                this.logger.error(`Falha ao invalidar cache para o padrão ${pattern}`, e);
            }
        }
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = ClientesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        documento_validator_service_1.DocumentoValidatorService,
        unicidade_validator_service_1.UnicidadeValidatorService,
        auditoria_service_1.AuditoriaService,
        integridade_service_1.IntegridadeService, Object, idempotency_service_1.IdempotencyService,
        tenant_context_service_1.TenantContextService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map