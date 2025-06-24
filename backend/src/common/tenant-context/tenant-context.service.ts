// =============================================================================
// SmartPeças ERP - TenantContextService (VERSÃO FINAL REATORADA)
// =============================================================================
// Arquivo: backend/src/common/tenant-context/tenant-context.service.ts
// Versão: 2.0
// =============================================================================

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

// ✅ A interface agora é a nossa fonte da verdade, usando 'schemaUrl'.
export interface TenantContext {
  id: string;
  schemaUrl: string; // PADRÃO ADOTADO
  name: string;
  cnpj: string | null;
  isActive: boolean;
  billingStatus: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
}

@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  // Substituímos 'setTenant' pelo método 'run', que é mais seguro.
  run<R>(context: TenantContext, fn: () => R): R {
    this.logger.debug(`Iniciando contexto para Tenant ID: ${context.id} (${context.schemaUrl})`);
    return this.asyncLocalStorage.run(context, fn);
  }

  getTenantContext(): TenantContext {
    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      this.logger.error('Contexto do inquilino não foi definido para esta requisição.');
      throw new InternalServerErrorException('Contexto do inquilino não definido.');
    }
    return store;
  }
  
  // Getters para acesso fácil e seguro
  get tenantId(): string {
    return this.getTenantContext().id;
  }

  get tenantSchemaUrl(): string {
    return this.getTenantContext().schemaUrl;
  }

  get billingStatus(): 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' {
    return this.getTenantContext().billingStatus;
  }
}
