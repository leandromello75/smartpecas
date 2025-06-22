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
var AuthTenantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTenantService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const tenant_context_service_1 = require("../common/tenant-context/tenant-context.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthTenantService = AuthTenantService_1 = class AuthTenantService {
    constructor(jwtService, prisma, tenantContext) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.tenantContext = tenantContext;
        this.logger = new common_1.Logger(AuthTenantService_1.name);
    }
    async validateTenantUser(email, plainPassword) {
        const schema = this.tenantContext.tenantschema;
        const tenantPrisma = await this.prisma.getTenantClient(schema);
        const user = await tenantPrisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            this.logger.warn(`Tentativa de login falhou. Usuário não encontrado ou inativo: ${email}`);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        const passwordOk = await bcrypt.compare(plainPassword, user.password);
        if (!passwordOk) {
            this.logger.warn(`Tentativa de login falhou. Senha inválida para: ${email}`);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        const { password, ...userSafe } = user;
        return userSafe;
    }
    async loginTenantUser(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: this.tenantContext.tenantId,
        };
        const token = this.jwtService.sign(payload);
        return { access_token: token };
    }
};
exports.AuthTenantService = AuthTenantService;
exports.AuthTenantService = AuthTenantService = AuthTenantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        tenant_context_service_1.TenantContextService])
], AuthTenantService);
//# sourceMappingURL=auth-tenant.service.js.map