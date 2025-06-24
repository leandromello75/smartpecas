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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
const tenant_context_service_1 = require("../tenant-context/tenant-context.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let TenantInterceptor = class TenantInterceptor {
    constructor(tenantContextService, prisma) {
        this.tenantContextService = tenantContextService;
        this.prisma = prisma;
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const tenantId = request.headers['x-tenant-id'];
        if (!tenantId) {
            return next.handle();
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId, isActive: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant com ID ${tenantId} não encontrado ou inativo.`);
        }
        return this.tenantContextService.run(tenant, () => next.handle());
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_context_service_1.TenantContextService,
        prisma_service_1.PrismaService])
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map