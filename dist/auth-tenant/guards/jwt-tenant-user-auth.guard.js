"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var JwtTenantUserAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTenantUserAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let JwtTenantUserAuthGuard = JwtTenantUserAuthGuard_1 = class JwtTenantUserAuthGuard extends (0, passport_1.AuthGuard)('jwt-tenant-user') {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(JwtTenantUserAuthGuard_1.name);
    }
    handleRequest(err, user, info, context) {
        if (err || !user) {
            this.logger.warn(`Falha na autenticação JwtTenantUserAuthGuard. Erro: ${err?.message || 'N/A'}. Info: ${info?.message || 'N/A'}`);
            throw err || new common_1.UnauthorizedException('Token de autenticação inválido ou expirado.');
        }
        return user;
    }
};
exports.JwtTenantUserAuthGuard = JwtTenantUserAuthGuard;
exports.JwtTenantUserAuthGuard = JwtTenantUserAuthGuard = JwtTenantUserAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], JwtTenantUserAuthGuard);
//# sourceMappingURL=jwt-tenant-user-auth.guard.js.map