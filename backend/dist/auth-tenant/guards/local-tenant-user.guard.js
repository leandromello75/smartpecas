"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LocalTenantUserAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalTenantUserAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let LocalTenantUserAuthGuard = LocalTenantUserAuthGuard_1 = class LocalTenantUserAuthGuard extends (0, passport_1.AuthGuard)('local-tenant-user') {
    logger = new common_1.Logger(LocalTenantUserAuthGuard_1.name);
    handleRequest(err, user, info, context) {
        if (err || !user) {
            const req = context.switchToHttp().getRequest();
            const emailAttempt = req.body?.email || 'N/D';
            this.logger.warn(`Falha de login para email '${emailAttempt}': ${err?.message || info?.message || 'Não autenticado.'}`);
            throw err || new common_1.UnauthorizedException('Credenciais inválidas para usuário do inquilino.');
        }
        return user;
    }
};
exports.LocalTenantUserAuthGuard = LocalTenantUserAuthGuard;
exports.LocalTenantUserAuthGuard = LocalTenantUserAuthGuard = LocalTenantUserAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], LocalTenantUserAuthGuard);
//# sourceMappingURL=local-tenant-user.guard.js.map