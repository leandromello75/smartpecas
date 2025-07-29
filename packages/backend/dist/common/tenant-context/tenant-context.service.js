"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextService = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
let TenantContextService = class TenantContextService {
    constructor() {
        this.als = new async_hooks_1.AsyncLocalStorage();
    }
    runWithContext(context, callback) {
        return this.als.run(context, callback);
    }
    getTenantId() {
        const store = this.als.getStore();
        if (!store?.tenantId) {
            throw new common_1.InternalServerErrorException('ERRO FATAL: ID do Tenant não encontrado no contexto da requisição.');
        }
        return store.tenantId;
    }
    getUser() {
        const store = this.als.getStore();
        if (!store?.user) {
            throw new common_1.InternalServerErrorException('ERRO FATAL: Usuário não encontrado no contexto da requisição.');
        }
        return store.user;
    }
};
exports.TenantContextService = TenantContextService;
exports.TenantContextService = TenantContextService = __decorate([
    (0, common_1.Injectable)()
], TenantContextService);
//# sourceMappingURL=tenant-context.service.js.map