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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ClientesStatsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesStatsService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("../../../prisma/prisma.service");
const tenant_context_service_1 = require("../../../common/tenant-context/tenant-context.service");
let ClientesStatsService = ClientesStatsService_1 = class ClientesStatsService {
    constructor(prisma, cacheManager, tenantContext) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
        this.tenantContext = tenantContext;
        this.logger = new common_1.Logger(ClientesStatsService_1.name);
        this.CACHE_TTL = 300000;
    }
    async obterEstatisticasResumo() {
        const tenantId = this.tenantContext.getTenantId();
        if (!tenantId) {
            throw new common_1.InternalServerErrorException('Contexto de tenant não encontrado.');
        }
        const cacheKey = `estatisticas:${tenantId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const [totalClientes, clientesAtivos, clientesInadimplentes, clientesPF, clientesPJ, clientesUltimos30Dias,] = await this.prisma.$transaction([
            this.prisma.cliente.count({ where: { tenantId } }),
            this.prisma.cliente.count({ where: { tenantId, isAtivo: true } }),
            this.prisma.cliente.count({ where: { tenantId, isInadimplente: true } }),
            this.prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_FISICA' } }),
            this.prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_JURIDICA' } }),
            this.prisma.cliente.count({
                where: {
                    tenantId,
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            }),
        ]);
        const estatisticas = {
            totalClientes,
            clientesAtivos,
            clientesInativos: totalClientes - clientesAtivos,
            clientesInadimplentes,
            clientesPessoaFisica: clientesPF,
            clientesPessoaJuridica: clientesPJ,
            clientesUltimos30Dias,
            percentualInadimplencia: totalClientes > 0 ? (clientesInadimplentes / totalClientes) * 100 : 0,
        };
        await this.cacheManager.set(cacheKey, estatisticas, this.CACHE_TTL);
        return estatisticas;
    }
};
exports.ClientesStatsService = ClientesStatsService;
exports.ClientesStatsService = ClientesStatsService = ClientesStatsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, tenant_context_service_1.TenantContextService])
], ClientesStatsService);
//# sourceMappingURL=clientes-stats.service.js.map