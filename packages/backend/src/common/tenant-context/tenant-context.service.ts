// =============================================================================
// SmartPeças ERP - Service - Contexto de Requisição (Tenant)
// =============================================================================
// Arquivo: backend/src/common/tenant-context/tenant-context.service.ts
//
// Descrição: Serviço que gerencia o estado da requisição (tenantId e usuário)
// usando AsyncLocalStorage para garantir o isolamento entre requisições.
//
// Versão: 1.1.0
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { JwtTenantUserPayload } from '../../shared/interfaces/jwt-payload.interface';

export interface TenantContext {
  tenantId: string;
  user: JwtTenantUserPayload;
}

@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  /**
   * Executa um callback dentro de um contexto de tenant e usuário.
   */
  runWithContext<T>(context: TenantContext, callback: () => T): T {
    return this.als.run(context, callback);
  }

  /**
   * Retorna o ID do tenant da requisição atual.
   * Lança um erro se chamado fora de um contexto válido.
   */
  getTenantId(): string {
    const store = this.als.getStore();
    if (!store?.tenantId) {
      throw new InternalServerErrorException('ERRO FATAL: ID do Tenant não encontrado no contexto da requisição.');
    }
    return store.tenantId;
  }
  
  /**
   * Retorna o payload do usuário da requisição atual.
   * Lança um erro se chamado fora de um contexto válido.
   */
  getUser(): JwtTenantUserPayload {
    const store = this.als.getStore();
    if (!store?.user) {
      throw new InternalServerErrorException('ERRO FATAL: Usuário não encontrado no contexto da requisição.');
    }
    return store.user;
  }
}