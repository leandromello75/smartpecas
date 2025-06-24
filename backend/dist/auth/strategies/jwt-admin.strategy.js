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
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtAdminStrategy = JwtAdminStrategy_1 = class JwtAdminStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-admin') {
    constructor(configService, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.prisma = prisma;
        this.logger = new common_1.Logger(JwtAdminStrategy_1.name);
    }
    async validate(payload) {
        this.logger.debug(`Validando token JWT para admin: ${payload.email}`);
        const adminUser = await this.prisma.adminUser.findUnique({
            where: { id: payload.sub },
        });
        if (!adminUser || !adminUser.isActive) {
            this.logger.warn(`AdminUser do token JWT inválido ou inativo: ${payload.email}`);
            throw new common_1.UnauthorizedException('Token inválido ou usuário removido.');
        }
        const { password, ...result } = adminUser;
        return result;
    }
};
exports.JwtAdminStrategy = JwtAdminStrategy;
exports.JwtAdminStrategy = JwtAdminStrategy = JwtAdminStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtAdminStrategy);
//# sourceMappingURL=jwt-admin.strategy.js.map