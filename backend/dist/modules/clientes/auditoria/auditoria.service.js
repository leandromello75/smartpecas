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
var AuditoriaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let AuditoriaService = AuditoriaService_1 = class AuditoriaService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuditoriaService_1.name);
    }
    async registrarOperacao(tenantId, usuario, dados) {
        const now = new Date();
        const { operacao, recurso, recursoId, dadosAnteriores, dadosAtuais, ip, userAgent, } = dados;
        this.logger.log(`[AUDITORIA - ${tenantId}] ${operacao} em ${recurso}:${recursoId} por ${usuario.name} (${usuario.id})`);
        setImmediate(async () => {
            try {
                await this.prisma.auditoriaLog.create({
                    data: {
                        tenantId,
                        recurso,
                        recursoId,
                        operacao,
                        dadosAnteriores: JSON.stringify(dadosAnteriores ?? {}),
                        dadosAtuais: JSON.stringify(dadosAtuais ?? {}),
                        realizadoEm: now,
                        realizadoPor: usuario.id,
                        realizadoPorNome: usuario.name,
                        realizadoPorIp: ip ?? usuario.ip ?? null,
                        userAgent: userAgent ?? null,
                    },
                });
                this.logger.verbose(`[AUDITORIA - ${tenantId}] Operação registrada com sucesso em segundo plano: ${operacao} em ${recurso}:${recursoId}`);
            }
            catch (error) {
                if (error instanceof Error) {
                    this.logger.error(`[AUDITORIA ERRO CRÍTICO - ${tenantId}] Falha fatal ao registrar operação em segundo plano: ${error.message}`, error.stack);
                }
                else {
                    this.logger.error(`[AUDITORIA ERRO CRÍTICO - ${tenantId}] Falha fatal ao registrar operação em segundo plano: erro desconhecido.`);
                }
            }
        });
    }
};
exports.AuditoriaService = AuditoriaService;
exports.AuditoriaService = AuditoriaService = AuditoriaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditoriaService);
//# sourceMappingURL=auditoria.service.js.map