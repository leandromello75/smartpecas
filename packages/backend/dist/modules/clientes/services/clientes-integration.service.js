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
var ClientesIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const rxjs_1 = require("rxjs");
const cnpj_api_service_1 = require("../integracoes/cnpj-api.service");
const cep_api_service_1 = require("../integracoes/cep-api.service");
const tenant_throttler_service_1 = require("../throttling/tenant-throttler.service");
const clientes_service_1 = require("./clientes.service");
const tenant_context_service_1 = require("../../../common/tenant-context/tenant-context.service");
let ClientesIntegrationService = ClientesIntegrationService_1 = class ClientesIntegrationService {
    constructor(cnpjApi, cepApi, tenantThrottler, cacheManager, clientesService, tenantContext) {
        this.cnpjApi = cnpjApi;
        this.cepApi = cepApi;
        this.tenantThrottler = tenantThrottler;
        this.cacheManager = cacheManager;
        this.clientesService = clientesService;
        this.tenantContext = tenantContext;
        this.logger = new common_1.Logger(ClientesIntegrationService_1.name);
        this.CACHE_TTL_LONGO = 3600000;
    }
    async consultarCnpj(dto) {
        const tenantId = this.tenantContext.getTenantId();
        if (tenantId) {
            await this.tenantThrottler.checkLimit(tenantId, 'consultar-cnpj');
        }
        const cacheKey = `cnpj:${dto.cnpj}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`[${tenantId || 'global'}] CNPJ encontrado no cache: ${dto.cnpj}`);
            return cached;
        }
        try {
            const result = await (0, rxjs_1.from)(this.cnpjApi.consultar(dto.cnpj))
                .pipe((0, rxjs_1.retry)({
                count: 3,
                delay: (_, retryCount) => {
                    const delay = Math.pow(2, retryCount) * 1000;
                    this.logger.warn(`[${tenantId || 'global'}] Tentativa ${retryCount + 1} de consulta CNPJ ${dto.cnpj} em ${delay}ms`);
                    return (0, rxjs_1.timer)(delay);
                },
            }))
                .toPromise();
            if (!result || !result.cnpj) {
                throw new common_1.NotFoundException(`Dados para o CNPJ ${dto.cnpj} não foram encontrados na API externa.`);
            }
            await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
            return result;
        }
        catch (error) {
            this.logger.error(`Erro final ao consultar CNPJ ${dto.cnpj}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Serviço de consulta de CNPJ indisponível no momento.');
        }
    }
    async consultarCep(dto) {
        const tenantId = this.tenantContext.getTenantId();
        if (tenantId) {
            await this.tenantThrottler.checkLimit(tenantId, 'consultar-cep');
        }
        const cacheKey = `cep:${dto.cep}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`[${tenantId || 'global'}] CEP encontrado no cache: ${dto.cep}`);
            return cached;
        }
        try {
            const result = await (0, rxjs_1.from)(this.cepApi.consultar(dto.cep))
                .pipe((0, rxjs_1.retry)({ count: 3, delay: 1000 }))
                .toPromise();
            if (!result || !result.cep) {
                throw new common_1.NotFoundException(`Dados para o CEP ${dto.cep} não foram encontrados.`);
            }
            await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
            return result;
        }
        catch (error) {
            this.logger.error(`Erro final ao consultar CEP ${dto.cep}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Serviço de consulta de CEP indisponível no momento.');
        }
    }
    async criarClienteComCnpj(cnpj, meta, idemKey) {
        let dadosCnpj;
        try {
            dadosCnpj = await this.consultarCnpj({ cnpj });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Não foi possível obter dados para o CNPJ ${cnpj}. Motivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
            ...meta,
        };
        return this.clientesService.criar(dto, idemKey);
    }
};
exports.ClientesIntegrationService = ClientesIntegrationService;
exports.ClientesIntegrationService = ClientesIntegrationService = ClientesIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [cnpj_api_service_1.CnpjApiService,
        cep_api_service_1.CepApiService,
        tenant_throttler_service_1.TenantThrottlerService, Object, clientes_service_1.ClientesService,
        tenant_context_service_1.TenantContextService])
], ClientesIntegrationService);
//# sourceMappingURL=clientes-integration.service.js.map