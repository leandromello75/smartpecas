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
var TenantResolverGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantResolverGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const tenant_context_service_1 = require("../tenant-context/tenant-context.service");
require("../../interfaces/request-with-tenant.interface");
let TenantResolverGuard = TenantResolverGuard_1 = class TenantResolverGuard {
    prisma;
    tenantContext;
    logger = new common_1.Logger(TenantResolverGuard_1.name);
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.tenantId) {
            this.logger.warn('Token JWT não contém tenantId. Verifique o AuthGuard anterior.');
            throw new common_1.UnauthorizedException('Tenant não identificado no token de autenticação.');
        }
        const tenantId = user.tenantId;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                cnpj: true,
                email: true,
                schemaUrl: true,
                isActive: true,
                billingStatus: true,
            },
        });
        if (!tenant) {
            this.logger.warn(`Tenant '${tenantId}' não encontrado no schema público.`);
            throw new common_1.UnauthorizedException('Inquilino associado ao token não encontrado.');
        }
        if (!tenant.isActive) {
            this.logger.warn(`Tenant '${tenant.name}' está desativado.`);
            throw new common_1.ForbiddenException('Acesso negado: Este inquilino está desativado.');
        }
        if (tenant.billingStatus !== 'ACTIVE') {
            this.logger.warn(`Tenant '${tenant.name}' está com status de faturamento '${tenant.billingStatus}'.`);
            throw new common_1.ForbiddenException('Acesso negado: Este inquilino está com pendências financeiras.');
        }
        const contextData = {
            id: tenant.id,
            schemaUrl: tenant.schemaUrl,
            name: tenant.name,
            cnpj: tenant.cnpj,
            email: tenant.email,
            billingStatus: tenant.billingStatus,
        };
        this.tenantContext.setTenant(contextData);
        request.tenantContext = contextData;
        this.logger.debug(`Tenant '${tenant.name}' (${tenant.id}) validado e contexto definido.`);
        return true;
    }
};
exports.TenantResolverGuard = TenantResolverGuard;
exports.TenantResolverGuard = TenantResolverGuard = TenantResolverGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_service_1.TenantContextService])
], TenantResolverGuard);
//# sourceMappingURL=tenant-resolve.guard.js.map