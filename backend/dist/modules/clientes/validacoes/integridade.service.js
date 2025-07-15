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
var IntegridadeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegridadeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let IntegridadeService = IntegridadeService_1 = class IntegridadeService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IntegridadeService_1.name);
    }
    async validarExclusaoCliente(tenantId, clienteId) {
        this.logger.debug(`[${tenantId}] Verificando integridade para exclusão do cliente: ${clienteId}`);
        await this.verificarOrdensEmAberto(tenantId, clienteId);
        await this.verificarFaturasPendentes(tenantId, clienteId);
        await this.verificarVeiculosAtivos(tenantId, clienteId);
        this.logger.verbose(`[${tenantId}] Nenhuma pendência encontrada. Cliente ${clienteId} pode ser desativado.`);
    }
    async verificarOrdensEmAberto(tenantId, clienteId) {
        const ordens = await this.prisma.order.count({
            where: {
                tenantId,
                customerId: clienteId,
                status: { in: ['pending', 'processing'] },
            },
        });
        if (ordens > 0) {
            this.logger.warn(`[${tenantId}] Cliente ${clienteId} tem ${ordens} ordens de serviço em aberto.`);
            throw new common_1.ConflictException(`Não é possível excluir o cliente: possui ${ordens} ordens de serviço em aberto.`);
        }
    }
    async verificarFaturasPendentes(tenantId, clienteId) {
    }
    async verificarVeiculosAtivos(tenantId, clienteId) {
    }
};
exports.IntegridadeService = IntegridadeService;
exports.IntegridadeService = IntegridadeService = IntegridadeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegridadeService);
//# sourceMappingURL=integridade.service.js.map