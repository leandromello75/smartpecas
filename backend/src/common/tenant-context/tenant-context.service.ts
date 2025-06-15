// =============================================================================
// SmartPeças ERP - TenantContextService (Aprimorado com AsyncLocalStorage)
// =============================================================================
// Arquivo: backend/src/common/tenant-context/tenant-context.service.ts
//
// Descrição: Serviço para armazenar e propagar o contexto do tenant
// (ID, schemaUrl, e dados do Tenant) em fluxos de execução assíncronos.
// Essencial para a estratégia multi-schema do sistema.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Tenant } from '@prisma/client'; // Importa o tipo Tenant para a interface

// Interface expandida para o contexto do tenant, com informações úteis
export interface TenantContext {
  id: string;          // ID do Tenant (UUID)
  schemaUrl: string;   // Nome do schema PostgreSQL para este tenant
  name: string;        // Nome amigável do tenant
  cnpj: string;        // CNPJ do tenant
  email: string;       // Email do tenant
  billingStatus: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED'; // Status de pagamento (do enum BillingStatus)
  // Adicione aqui quaisquer outras informações do modelo Tenant que você precise acessar frequentemente
  // sem ter que buscar no banco de dados em cada serviço.
}

@Injectable() // Não precisa de Scope.REQUEST explicitamente com AsyncLocalStorage
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  /**
   * Define o contexto do tenant para o fluxo de execução assíncrono atual.
   * Deve ser chamado no início da requisição (ex: por um Guard ou Interceptor).
   * @param tenantContext Objeto TenantContext com as informações do tenant.
   */
  setTenant(tenantContext: TenantContext): void {
    this.logger.debug(`Definindo contexto do tenant: ${tenantContext.id} (${tenantContext.schemaUrl})`);
    this.asyncLocalStorage.enterWith(tenantContext); // Armazena o objeto TenantContext completo
  }

  /**
   * Retorna o contexto do tenant atual.
   * Lança um erro se o contexto não estiver definido (erro de lógica de aplicação).
   * @returns O objeto TenantContext.
   */
  getTenantContext(): TenantContext {
    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      this.logger.error('Contexto do inquilino não foi definido para esta requisição.');
      throw new InternalServerErrorException('Contexto do inquilino não definido.');
    }
    return store;
  }

  /**
   * Retorna o ID do tenant atual, ou undefined se o contexto não estiver definido.
   */
  get tenantId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.id;
  }

  /**
   * Retorna o URL do schema do tenant atual, ou undefined se o contexto não estiver definido.
   */
  get tenantSchemaUrl(): string | undefined {
    return this.asyncLocalStorage.getStore()?.schemaUrl;
  }

  /**
   * Retorna o status de faturamento do tenant atual, ou undefined se o contexto não estiver definido.
   */
  get billingStatus(): 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | undefined {
    return this.asyncLocalStorage.getStore()?.billingStatus;
  }

  /**
   * Encerra o contexto do AsyncLocalStorage (útil em testes ou se precisar limpar explicitamente).
   */
  disable(): void {
    this.asyncLocalStorage.disable();
  }
}
