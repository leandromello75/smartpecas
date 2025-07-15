// =============================================================================
// SmartPeças ERP - TenantContextService (VERSÃO FINAL COMPLETA E CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/common/tenant-context/tenant-context.service.ts
//
// Descrição: Serviço para gerenciar o contexto do tenant (ID, nome, status)
// para a requisição atual, usando AsyncLocalStorage.
//
// Versão: 2.0.3
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 10/07/2025 - 10:48 PM BRT
// =============================================================================

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { BillingStatus } from '../../generated/prisma-client'; // Importar BillingStatus

// INTERFACE TENANTCONTEXT COMPLETA E CORRIGIDA
export interface TenantContext {
  id: string;
  name: string;
  billingStatus: BillingStatus;
  isActive: boolean;
  schemaUrl: string;
  cnpj: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  // CORREÇÃO: Declaração da propriedade explicitamente no corpo da classe
  // Isso garante que ela seja reconhecida como uma propriedade da instância
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  constructor() {
    // A propriedade já está inicializada acima, então o construtor pode ficar vazio
    // Ou você pode inicializá-la aqui: this.asyncLocalStorage = new AsyncLocalStorage<TenantContext>();
  }

  /**
   * Executa uma função com um contexto de tenant definido.
   * @param context Objeto TenantContext a ser armazenado.
   * @param callback Função a ser executada com o contexto definido.
   * @returns O resultado da função callback.
   */
  run<R>(context: TenantContext, fn: () => R): R {
    this.logger.debug(`[TenantContextService] Definindo contexto para tenant: ${context.id} (SchemaURL: ${context.schemaUrl})`);
    return this.asyncLocalStorage.run(context, fn); // Acessando a propriedade corretamente
  }

  /**
   * Retorna o contexto do tenant da requisição atual.
   * @returns TenantContext
   * @throws InternalServerErrorException se o contexto não estiver definido.
   */
  getTenantContext(): TenantContext {
    const store = this.asyncLocalStorage.getStore(); // Acessando a propriedade corretamente
    if (!store) {
      this.logger.error('[TenantContextService] Contexto do inquilino não encontrado na AsyncLocalStorage. Isso pode indicar um TenantInterceptor ou Guard ausente/falho.');
      throw new InternalServerErrorException('Contexto do inquilino não definido para a requisição.');
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

  get billingStatus(): BillingStatus {
    return this.getTenantContext().billingStatus;
  }

  get tenantCnpj(): string | null {
    return this.getTenantContext().cnpj;
  }

  get tenantCreatedAt(): Date {
    return this.getTenantContext().createdAt;
  }

  get tenantUpdatedAt(): Date {
    return this.getTenantContext().updatedAt;
  }
}