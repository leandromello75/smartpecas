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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("./tenant.service");
const swagger_1 = require("@nestjs/swagger");
let TenantController = class TenantController {
    constructor(tenantService) {
        this.tenantService = tenantService;
    }
};
exports.TenantController = TenantController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    (0, swagger_1.ApiOperation)({
        summary: 'Cria um novo inquilino e seu usuário administrador global',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Inquilino e administrador criados com sucesso.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Tenant e administrador criados com sucesso.' },
                tenant: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-do-tenant' },
                        name: { type: 'string', example: 'Nome da Loja X' },
                        schema: { type: 'string', example: 'tenant_nomedaloja_12345' },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados de entrada inválidos.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflito: nome, CNPJ ou e-mail do administrador já existe.' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Erro interno do servidor ao criar o inquilino.' }),
    __metadata("design:type", Object)
], TenantController.prototype, "", void 0);
exports.TenantController = TenantController = __decorate([
    (0, swagger_1.ApiTags)('Tenants'),
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenant_service_1.TenantService])
], TenantController);
//# sourceMappingURL=tenant.controller.js.map