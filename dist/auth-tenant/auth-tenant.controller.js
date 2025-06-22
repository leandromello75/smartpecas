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
var AuthTenantController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTenantController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_tenant_service_1 = require("./services/auth-tenant.service");
const login_tenant_user_dto_1 = require("./dto/login-tenant-user.dto");
const local_tenant_user_guard_1 = require("./guards/local-tenant-user.guard");
let AuthTenantController = AuthTenantController_1 = class AuthTenantController {
    constructor(authTenantService) {
        this.authTenantService = authTenantService;
        this.logger = new common_1.Logger(AuthTenantController_1.name);
    }
    async login(req) {
        this.logger.log(`Login efetuado para usuário do tenant: ${req.user.email}`);
        return this.authTenantService.loginTenantUser(req.user);
    }
};
exports.AuthTenantController = AuthTenantController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(local_tenant_user_guard_1.LocalTenantUserAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Login de usuário de inquilino (empresa)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login bem-sucedido. Retorna token JWT.',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciais inválidas.' }),
    (0, swagger_1.ApiBody)({ type: login_tenant_user_dto_1.LoginTenantUserDto, description: 'Credenciais de login do usuário do inquilino' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthTenantController.prototype, "login", null);
exports.AuthTenantController = AuthTenantController = AuthTenantController_1 = __decorate([
    (0, swagger_1.ApiTags)('Auth - Usuários do Tenant'),
    (0, common_1.Controller)('auth/tenant'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_tenant_service_1.AuthTenantService !== "undefined" && auth_tenant_service_1.AuthTenantService) === "function" ? _a : Object])
], AuthTenantController);
//# sourceMappingURL=auth-tenant.controller.js.map