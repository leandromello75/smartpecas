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
const prisma_client_1 = require("../../generated/prisma-client");
let JwtAdminStrategy = JwtAdminStrategy_1 = class JwtAdminStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-admin') {
    constructor(configService, prisma) {
        const jwtSecret = configService.get('JWT_SECRET');
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
        this.prisma = prisma;
        this.logger = new common_1.Logger(JwtAdminStrategy_1.name);
    }
    async validate(payload) {
        this.logger.debug(`Validando token JWT para admin: ${payload.email} (sub: ${payload.sub})`);
        try {
            const adminUser = await this.prisma.adminUser.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    name: true,
                    role: true,
                    isActive: true,
                    tenantId: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            id: true,
                            billingStatus: true,
                            isActive: true,
                        },
                    },
                },
            });
            if (!adminUser || !adminUser.isActive) {
                this.logger.warn(`Admin inválido ou inativo encontrado no token: ${payload.email} (DB: ${adminUser?.email || 'N/A'}, Ativo: ${adminUser?.isActive || 'N/A'}).`);
                throw new common_1.UnauthorizedException('Usuário não encontrado ou inativo.');
            }
            if (!adminUser.tenant || adminUser.tenant.billingStatus !== 'ACTIVE' || !adminUser.tenant.isActive) {
                this.logger.warn(`Acesso negado: Tenant (${adminUser.tenantId}) associado ao admin '${payload.email}' está ${adminUser.tenant?.billingStatus || 'N/A'}.`);
                throw new common_1.ForbiddenException('Acesso à conta suspenso. Entre em contato com o suporte.');
            }
            const dbRoleEnum = adminUser.role;
            if (payload.role !== dbRoleEnum || !Object.values(prisma_client_1.Role).includes(payload.role)) {
                this.logger.warn(`[SEGURANÇA] Papel (role) do token difere do DB ou é inválido para ${payload.email}. Token: ${payload.role}, DB: ${adminUser.role}.`);
                throw new common_1.UnauthorizedException('Perfil de acesso inválido ou alterado.');
            }
            const { password, ...safeUserFromDb } = adminUser;
            const safeUser = {
                ...safeUserFromDb,
                name: safeUserFromDb.name ?? null,
                tenantId: safeUserFromDb.tenantId ?? null,
                role: safeUserFromDb.role,
                tenant: safeUserFromDb.tenant,
            };
            return safeUser;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Erro fatal na validação JWT para ${payload.email}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            throw new common_1.UnauthorizedException('Token inválido ou erro interno na autenticação.');
        }
    }
};
exports.JwtAdminStrategy = JwtAdminStrategy;
exports.JwtAdminStrategy = JwtAdminStrategy = JwtAdminStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtAdminStrategy);
//# sourceMappingURL=jwt-admin.strategy.js.map