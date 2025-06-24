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
var JwtTenantUserStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTenantUserStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let JwtTenantUserStrategy = JwtTenantUserStrategy_1 = class JwtTenantUserStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-tenant-user') {
    constructor(configService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.logger = new common_1.Logger(JwtTenantUserStrategy_1.name);
    }
    async validate(payload) {
        if (!payload?.sub ||
            !payload?.email ||
            !payload?.role ||
            !payload?.tenantId ||
            !payload?.schema) {
            this.logger.warn(`Payload JWT de tenant inválido recebido: ${JSON.stringify(payload)}`);
            throw new common_1.UnauthorizedException('Token JWT inválido ou malformado.');
        }
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(`Usuário de Tenant autenticado via JWT: ${payload.email} para o tenant ${payload.tenantId}`);
        }
        return payload;
    }
};
exports.JwtTenantUserStrategy = JwtTenantUserStrategy;
exports.JwtTenantUserStrategy = JwtTenantUserStrategy = JwtTenantUserStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JwtTenantUserStrategy);
//# sourceMappingURL=jwt-tenant-user.strategy.js.map