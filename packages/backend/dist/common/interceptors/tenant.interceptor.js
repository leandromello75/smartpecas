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
var TenantInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
const tenant_context_service_1 = require("../tenant-context/tenant-context.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TenantInterceptor = TenantInterceptor_1 = class TenantInterceptor {
    constructor(tenantContextService, prisma) {
        this.tenantContextService = tenantContextService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(TenantInterceptor_1.name);
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const tenantIdFromHeader = request.headers['x-tenant-id'];
        if (!tenantIdFromHeader) {
            this.logger.debug('Header x-tenant-id ausente. Continuar sem contexto de tenant.');
            return next.handle();
        }
        let tenantDb;
        try {
            tenantDb = await this.prisma.tenant.findUnique({
                where: { id: tenantIdFromHeader },
                select: {
                    id: true,
                    name: true,
                    billingStatus: true,
                    isActive: true,
                    schemaUrl: true,
                    cnpj: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
        }
        catch (error) {
            this.logger.error(`Erro ao buscar tenant ${tenantIdFromHeader}: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            return next.handle();
        }
        if (!tenantDb || !tenantDb.isActive || tenantDb.billingStatus !== client_1.BillingStatus.ACTIVE) {
            this.logger.warn(`Tenant ID ${tenantIdFromHeader} inválido ou inativo/inadimplente. Continuando sem definir contexto.`);
            return next.handle();
        }
        const tenantContext = {
            id: tenantDb.id,
            name: tenantDb.name,
            billingStatus: tenantDb.billingStatus,
            isActive: tenantDb.isActive,
            schemaUrl: tenantDb.schemaUrl,
            cnpj: tenantDb.cnpj,
            createdAt: tenantDb.createdAt,
            updatedAt: tenantDb.updatedAt,
        };
        this.logger.debug(`Contexto de tenant ${tenantContext.name} (${tenantContext.id}) definido para a requisição.`);
        return this.tenantContextService.runWithContext(tenantContext, () => next.handle());
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = TenantInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_context_service_1.TenantContextService,
        prisma_service_1.PrismaService])
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map