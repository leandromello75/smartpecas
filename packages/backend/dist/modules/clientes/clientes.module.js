"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_module_1 = require("../../prisma/prisma.module");
const clientes_controller_1 = require("./clientes.controller");
const clientes_service_1 = require("./services/clientes.service");
const cnpj_api_service_1 = require("./integracoes/cnpj-api.service");
const cep_api_service_1 = require("./integracoes/cep-api.service");
const documento_validator_service_1 = require("./validacoes/documento-validator.service");
const unicidade_validator_service_1 = require("./validacoes/unicidade-validator.service");
const cliente_mapper_1 = require("./mappers/cliente.mapper");
const auditoria_service_1 = require("./auditoria/auditoria.service");
const idempotency_service_1 = require("./auditoria/idempotency.service");
const integridade_service_1 = require("./validacoes/integridade.service");
const tenant_throttler_service_1 = require("./throttling/tenant-throttler.service");
let ClientesModule = class ClientesModule {
};
exports.ClientesModule = ClientesModule;
exports.ClientesModule = ClientesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            axios_1.HttpModule,
            cache_manager_1.CacheModule,
        ],
        controllers: [
            clientes_controller_1.ClientesController,
        ],
        providers: [
            clientes_service_1.ClientesService,
            cnpj_api_service_1.CnpjApiService,
            cep_api_service_1.CepApiService,
            documento_validator_service_1.DocumentoValidatorService,
            unicidade_validator_service_1.UnicidadeValidatorService,
            cliente_mapper_1.ClienteMapper,
            auditoria_service_1.AuditoriaService,
            idempotency_service_1.IdempotencyService,
            integridade_service_1.IntegridadeService,
            tenant_throttler_service_1.TenantThrottlerService,
        ],
        exports: [
            clientes_service_1.ClientesService,
            documento_validator_service_1.DocumentoValidatorService,
            unicidade_validator_service_1.UnicidadeValidatorService,
        ],
    })
], ClientesModule);
//# sourceMappingURL=clientes.module.js.map