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
var UnicidadeValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnicidadeValidatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let UnicidadeValidatorService = UnicidadeValidatorService_1 = class UnicidadeValidatorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UnicidadeValidatorService_1.name);
    }
    limparDocumento(doc) {
        return doc.replace(/[^\d]/g, '');
    }
    async validarDocumento(tenantId, documento, clienteId, prismaClient = this.prisma) {
        const docLimpo = this.limparDocumento(documento);
        const clienteExistente = await this.prisma.cliente.findFirst({
            where: {
                tenantId,
                documento: docLimpo,
                id: clienteId ? { not: clienteId } : undefined,
            },
        });
        if (clienteExistente) {
            this.logger.warn(`Documento duplicado detectado: ${docLimpo} (Tenant: ${tenantId})`);
            throw new common_1.ConflictException(`O documento ${docLimpo} já está em uso${clienteId ? ` por outro cliente (ignorado ID ${clienteId})` : ''}.`);
        }
    }
    async validarEmail(tenantId, email, clienteId, prismaClient = this.prisma) {
        const clienteExistente = await this.prisma.cliente.findFirst({
            where: {
                tenantId,
                email,
                id: clienteId ? { not: clienteId } : undefined,
            },
        });
        if (clienteExistente) {
            this.logger.warn(`E-mail duplicado detectado: ${email} (Tenant: ${tenantId})`);
            throw new common_1.ConflictException(`O e-mail ${email} já está em uso${clienteId ? ` por outro cliente (ignorado ID ${clienteId})` : ''}.`);
        }
    }
};
exports.UnicidadeValidatorService = UnicidadeValidatorService;
exports.UnicidadeValidatorService = UnicidadeValidatorService = UnicidadeValidatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnicidadeValidatorService);
//# sourceMappingURL=unicidade-validator.service.js.map