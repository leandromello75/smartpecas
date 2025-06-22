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
exports.BaseTenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const tenant_context_service_1 = require("../tenant-context/tenant-context.service");
let BaseTenantService = class BaseTenantService {
    constructor(prisma, tenantContextService) {
        this.prisma = prisma;
        this.tenantContextService = tenantContextService;
        this.logger = new common_1.Logger(this.constructor.name);
    }
    async getTenantPrismaClient() {
        const tenantContext = this.tenantContextService.getTenantContext();
        if (!tenantContext?.schema) {
            this.logger.error('Tentativa de obter PrismaClient sem contexto de tenant ou schema.');
            throw new common_1.InternalServerErrorException('Contexto do inquilino não disponível para a operação.');
        }
        return this.prisma.getTenantClient(tenantContext.schema);
    }
    getTenantContext() {
        return this.tenantContextService.getTenantContext();
    }
    get tenantId() {
        return this.getTenantContext().id;
    }
    get schema() {
        return this.getTenantContext().schema;
    }
    get billingStatus() {
        return this.getTenantContext().billingStatus;
    }
    logTenantAction(message, contextData) {
        const tenantInfo = this.getTenantContext();
        this.logger.log(`[Tenant: ${tenantInfo.name} - ${tenantInfo.id}] ${message}`, contextData);
    }
    errorTenantAction(message, error) {
        const tenantInfo = this.getTenantContext();
        this.logger.error(`[Tenant: ${tenantInfo.name} - ${tenantInfo.id}] ${message}`, error instanceof Error ? error.stack : String(error));
    }
    async debugTenantConnection() {
        const prisma = await this.getTenantPrismaClient();
        const result = await prisma.$queryRawUnsafe(`SELECT current_schema();`);
        this.logger.debug(`[Tenant: ${this.tenantId}] Schema atual ativo: ${JSON.stringify(result)}`);
    }
};
exports.BaseTenantService = BaseTenantService;
exports.BaseTenantService = BaseTenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_service_1.TenantContextService])
], BaseTenantService);
//# sourceMappingURL=base-tenant.service.js.map