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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTenantController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_tenant_service_1 = require("./auth-tenant.service");
const swagger_1 = require("@nestjs/swagger");
let AuthTenantController = AuthTenantController_1 = class AuthTenantController {
    constructor(authTenantService) {
        this.authTenantService = authTenantService;
        this.logger = new common_1.Logger(AuthTenantController_1.name);
    }
    async login(req) {
        const user = req.user;
        if (!user) {
            this.logger.error('AuthGuard falhou em anexar o usuário à requisição.');
            throw new common_1.UnauthorizedException('Erro de autenticação.');
        }
        this.logger.log(`Login efetuado para usuário do tenant: ${user.email}`);
        return this.authTenantService.loginTenantUser(user);
    }
};
exports.AuthTenantController = AuthTenantController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('local-tenant')),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Realiza o login de um usuário de tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login bem-sucedido.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciais inválidas.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthTenantController.prototype, "login", null);
exports.AuthTenantController = AuthTenantController = AuthTenantController_1 = __decorate([
    (0, swagger_1.ApiTags)('Authentication (Tenant)'),
    (0, common_1.Controller)('auth/tenant'),
    __metadata("design:paramtypes", [auth_tenant_service_1.AuthTenantService])
], AuthTenantController);
//# sourceMappingURL=auth-tenant.controller.js.map