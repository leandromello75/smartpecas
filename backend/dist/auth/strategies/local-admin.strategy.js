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
var LocalAdminStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAdminStrategy = void 0;
const passport_local_1 = require("passport-local");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
let LocalAdminStrategy = LocalAdminStrategy_1 = class LocalAdminStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy, 'local-admin') {
    authService;
    logger = new common_1.Logger(LocalAdminStrategy_1.name);
    constructor(authService) {
        super({ usernameField: 'email', passwordField: 'password' });
        this.authService = authService;
    }
    async validate(email, password) {
        this.logger.debug(`Executando validação local para admin: ${email}`);
        const adminUser = await this.authService.validateAdminUser(email, password);
        if (!adminUser) {
            this.logger.warn(`AdminUser inválido ou tenant não autorizado: ${email}`);
            throw new common_1.UnauthorizedException('Credenciais inválidas ou acesso suspenso.');
        }
        return adminUser;
    }
};
exports.LocalAdminStrategy = LocalAdminStrategy;
exports.LocalAdminStrategy = LocalAdminStrategy = LocalAdminStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], LocalAdminStrategy);
//# sourceMappingURL=local-admin.strategy.js.map