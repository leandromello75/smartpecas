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
var IdempotencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let IdempotencyService = IdempotencyService_1 = class IdempotencyService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IdempotencyService_1.name);
    }
    async executeOrRecover(idemKey, tenantId, route, operation, origin, ttlMs = 86400000) {
        if (!idemKey) {
            return this.prisma.$transaction(operation);
        }
        return this.prisma.$transaction(async (tx) => {
            const existingKey = await tx.idempotencyKey.findUnique({
                where: { key_tenantId: { key: idemKey, tenantId } },
            });
            if (existingKey) {
                this.logger.warn(`[${tenantId}] Requisição idempotente detectada (rota: ${route}, chave: ${idemKey}). Retornando resultado armazenado.`);
                return existingKey.response;
            }
            const result = await operation(tx);
            try {
                JSON.stringify(result);
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(`Erro ao serializar resposta para idempotência (rota: ${route}): ${e.message}`, e.stack);
                }
                else {
                    this.logger.error(`Erro desconhecido ao serializar resposta para idempotência (rota: ${route}).`);
                }
                throw new common_1.InternalServerErrorException('Erro ao armazenar resposta da operação. Resultado não serializável.');
            }
            await tx.idempotencyKey.create({
                data: {
                    key: idemKey,
                    route,
                    tenantId,
                    response: result,
                    expiresAt: new Date(Date.now() + ttlMs),
                    origin,
                },
            });
            this.logger.verbose(`[${tenantId}] Chave de idempotência armazenada com sucesso (rota: ${route}, chave: ${idemKey}).`);
            return result;
        });
    }
};
exports.IdempotencyService = IdempotencyService;
exports.IdempotencyService = IdempotencyService = IdempotencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IdempotencyService);
//# sourceMappingURL=idempotency.service.js.map