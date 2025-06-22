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
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtTenantUserStrategy = JwtTenantUserStrategy_1 = class JwtTenantUserStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-tenant-user') {
    configService;
    prismaService;
    logger = new common_1.Logger(JwtTenantUserStrategy_1.name);
    constructor(configService, prismaService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
        this.prismaService = prismaService;
    }
    async validate(payload) {
        this.logger.debug(`Validando JWT para usuário do tenant: ${payload.email}`);
        const tenantPrisma = await this.prismaService.getTenantClient(payload.schemaUrl);
        const user = await tenantPrisma.user.findUnique({
            where: {
                id: payload.sub,
                email: payload.email,
            },
        });
        if (!user || !user.isActive) {
            this.logger.warn(`JWT inválido ou usuário não encontrado para tenant '${payload.tenantId}': ${payload.email}`);
            throw new common_1.UnauthorizedException('Token JWT inválido ou usuário inativo.');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};
exports.JwtTenantUserStrategy = JwtTenantUserStrategy;
exports.JwtTenantUserStrategy = JwtTenantUserStrategy = JwtTenantUserStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtTenantUserStrategy);
//# sourceMappingURL=jwt-tenant-user.strategy.js.map