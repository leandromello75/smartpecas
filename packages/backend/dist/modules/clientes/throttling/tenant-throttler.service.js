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
var TenantThrottlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantThrottlerService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
let TenantThrottlerService = TenantThrottlerService_1 = class TenantThrottlerService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(TenantThrottlerService_1.name);
        this.limits = {
            'consultar-cnpj': { limit: 10, ttl: 60 },
            'consultar-cep': { limit: 50, ttl: 60 },
            'criar': { limit: 5, ttl: 60 },
        };
    }
    async checkLimit(tenantId, operation) {
        const { limit, ttl } = this.limits[operation];
        const cacheKey = `throttle:${tenantId}:${operation}`;
        const currentCount = (await this.cacheManager.get(cacheKey)) ?? 0;
        if (currentCount >= limit) {
            const remainingTtl = await this.cacheManager.ttl?.(cacheKey);
            this.logger.warn(`[${tenantId}] Excedeu limite de '${operation}' (${currentCount}/${limit}).`);
            throw new throttler_1.ThrottlerException(`Limite excedido para '${operation}'. Tente novamente em ${remainingTtl ?? ttl} segundos.`);
        }
        const newCount = currentCount + 1;
        await this.cacheManager.set(cacheKey, newCount, ttl);
        this.logger.verbose(`[${tenantId}] Requisição '${operation}' autorizada (${newCount}/${limit}).`);
    }
};
exports.TenantThrottlerService = TenantThrottlerService;
exports.TenantThrottlerService = TenantThrottlerService = TenantThrottlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], TenantThrottlerService);
//# sourceMappingURL=tenant-throttler.service.js.map