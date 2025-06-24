"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextService = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
let TenantContextService = TenantContextService_1 = class TenantContextService {
    constructor() {
        this.logger = new common_1.Logger(TenantContextService_1.name);
        this.asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
    }
    run(context, fn) {
        this.logger.debug(`Iniciando contexto para Tenant ID: ${context.id} (${context.schemaUrl})`);
        return this.asyncLocalStorage.run(context, fn);
    }
    getTenantContext() {
        const store = this.asyncLocalStorage.getStore();
        if (!store) {
            this.logger.error('Contexto do inquilino não foi definido para esta requisição.');
            throw new common_1.InternalServerErrorException('Contexto do inquilino não definido.');
        }
        return store;
    }
    get tenantId() {
        return this.getTenantContext().id;
    }
    get tenantSchemaUrl() {
        return this.getTenantContext().schemaUrl;
    }
    get billingStatus() {
        return this.getTenantContext().billingStatus;
    }
};
exports.TenantContextService = TenantContextService;
exports.TenantContextService = TenantContextService = TenantContextService_1 = __decorate([
    (0, common_1.Injectable)()
], TenantContextService);
//# sourceMappingURL=tenant-context.service.js.map