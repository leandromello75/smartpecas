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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const swagger_1 = require("@nestjs/swagger");
const login_admin_dto_1 = require("./dto/login-admin.dto");
const login_rate_limiter_service_1 = require("./login-rate-limiter.service");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService, loginRateLimiterService) {
        this.authService = authService;
        this.loginRateLimiterService = loginRateLimiterService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async loginAdmin(loginAdminDto, req, res) {
        const userIp = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        this.logger.log(`Tentativa de login para admin: ${loginAdminDto.email} do IP: ${userIp}`);
        await this.loginRateLimiterService.checkAttempts(loginAdminDto.email, userIp);
        const authResult = await this.authService.validateAndLoginAdmin(loginAdminDto.email, loginAdminDto.password, userIp, userAgent);
        res.cookie('jwt_admin', authResult.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: authResult.expires_in * 1000
        });
        return {
            access_token: authResult.access_token,
            expires_in: authResult.expires_in,
            token_type: 'Bearer',
            user: authResult.user,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login/admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login de administrador global e retorno de token JWT.' }),
    (0, swagger_1.ApiBody)({ type: login_admin_dto_1.LoginAdminDto, description: 'Credenciais de login do administrador.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login bem-sucedido. Retorna o token JWT e metadados.', schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1Ni...',
                expires_in: 3600,
                token_type: 'Bearer',
                user: { id: 'uuid', email: 'admin@example.com', name: 'Admin Name' }
            }
        } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciais inválidas.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acesso à conta suspenso.' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Muitas tentativas de login. Conta temporariamente bloqueada.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_admin_dto_1.LoginAdminDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginAdmin", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Autenticação'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        login_rate_limiter_service_1.LoginRateLimiterService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map