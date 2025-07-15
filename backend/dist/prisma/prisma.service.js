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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_client_1 = require("../generated/prisma-client");
let PrismaService = PrismaService_1 = class PrismaService extends prisma_client_1.PrismaClient {
    constructor() {
        super({
            log: ['warn', 'error'],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Prisma (cliente único) conectado com sucesso.');
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Conexão Prisma principal encerrada.');
    }
    getTenantClient(tenantId) {
        if (!tenantId) {
            throw new common_1.InternalServerErrorException('Tenant ID é obrigatório para operações do cliente.');
        }
        this.logger.verbose(`[PrismaService] Acessando cliente para tenantId: ${tenantId}`);
        return this;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map