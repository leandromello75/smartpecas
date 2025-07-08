// =============================================================================
// SmartPeças ERP - Serviço de Throttling por Tenant
// =============================================================================
// Arquivo: backend/src/modules/clientes/throttling/tenant-throttler.service.ts
//
// Descrição: Serviço de controle de taxa de requisições (rate limiting) por tenant
// e por operação específica (ex: consultar CNPJ/CEP, criar cliente).
// Utiliza cache com TTL para prevenir abuso e garantir estabilidade da API.
//
// Versão: 1.1.3
// Equipe SmartPeças
// Atualizado em: 28/06/2025
// =============================================================================

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerService {
  private readonly logger = new Logger(TenantThrottlerService.name);

  // Limites de requisição por operação e por tenant (em segundos)
  private readonly limits = {
    'consultar-cnpj': { limit: 10, ttl: 60 }, // 10 chamadas por minuto
    'consultar-cep': { limit: 50, ttl: 60 },  // 50 chamadas por minuto
    'criar': { limit: 5, ttl: 60 },            // 5 criações por minuto
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Verifica e controla o número de requisições feitas por tenant em determinada operação.
   * Lança exceção caso o limite seja excedido.
   * @param tenantId  - ID do tenant
   * @param operation - Nome da operação a ser controlada
   */
  async checkLimit(
    tenantId: string,
    operation: keyof typeof this.limits,
  ): Promise<void> {
    const { limit, ttl } = this.limits[operation];
    const cacheKey = `throttle:${tenantId}:${operation}`;

    const currentCount = (await this.cacheManager.get<number>(cacheKey)) ?? 0;

    if (currentCount >= limit) {
      const remainingTtl = await this.cacheManager.ttl?.(cacheKey);
      this.logger.warn(`[${tenantId}] Excedeu limite de '${operation}' (${currentCount}/${limit}).`);
      throw new ThrottlerException(
        `Limite excedido para '${operation}'. Tente novamente em ${remainingTtl ?? ttl} segundos.`,
      );
    }

    const newCount = currentCount + 1;
    
    // CORREÇÃO: Passa o 'ttl' como um número, conforme a tipagem da sua dependência.
    await this.cacheManager.set(cacheKey, newCount, ttl);

    this.logger.verbose(`[${tenantId}] Requisição '${operation}' autorizada (${newCount}/${limit}).`);
  }
}
