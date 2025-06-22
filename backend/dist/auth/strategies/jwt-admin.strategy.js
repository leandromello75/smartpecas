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
var JwtAdminStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAdminStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let JwtAdminStrategy = JwtAdminStrategy_1 = class JwtAdminStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-admin') {
    configService;
    logger = new common_1.Logger(JwtAdminStrategy_1.name);
    constructor(configService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
    }
    async validate(payload) {
        if (!payload?.sub || !payload?.email || !payload?.role) {
            this.logger.warn(`Payload JWT inválido recebido: ${JSON.stringify(payload)}`);
            throw new common_1.UnauthorizedException('Token JWT inválido ou malformado.');
        }
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(`Admin autenticado via JWT: ${payload.email}`);
        }
        return payload;
    }
};
exports.JwtAdminStrategy = JwtAdminStrategy;
exports.JwtAdminStrategy = JwtAdminStrategy = JwtAdminStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JwtAdminStrategy);
//# sourceMappingURL=jwt-admin.strategy.js.map