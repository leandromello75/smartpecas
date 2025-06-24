// =============================================================================
// SmartPeças ERP - BaseTenantService
// =============================================================================
// Arquivo: backend/src/common/base-tenant/base-tenant.service.ts
//
// Descrição: Classe abstrata base para todos os serviços que operam
// com dados específicos de um inquilino. Fornece acesso ao PrismaClient
// correto para o tenant da requisição atual e ao contexto do tenant.
//
// Versão: 1.2 (AsyncLocalStorage + melhorias de debug e tipagem)
// 
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@/tenant-client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService, TenantContext } from '../tenant-context/tenant-context.service';

@Injectable()
export abstract class BaseTenantService {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tenantContextService: TenantContextService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Retorna uma instância de PrismaClient configurada para o schema do tenant atual da requisição.
   * @returns PrismaClient configurado para o schema do tenant.
   * @throws InternalServerErrorException se o contexto do tenant não estiver definido ou incompleto.
   */
  protected async getTenantPrismaClient(): Promise<PrismaClient> {
    const tenantContext = this.tenantContextService.getTenantContext();
    if (!tenantContext?.schemaUrl) {
      this.logger.error('Tentativa de obter PrismaClient sem contexto de tenant ou schemaUrl.');
      throw new InternalServerErrorException('Contexto do inquilino não disponível para a operação.');
    }
    return this.prisma.getTenantClient(tenantContext.schemaUrl);
  }

  /**
   * Retorna o objeto de contexto do tenant para a requisição atual.
   * @returns TenantContext
   * @throws InternalServerErrorException
   */
  protected getTenantContext(): TenantContext {
    return this.tenantContextService.getTenantContext();
  }

  /** Atalhos úteis */
  protected get tenantId(): string {
    return this.getTenantContext().id;
  }

  protected get schemaUrl(): string {
    return this.getTenantContext().schemaUrl;
  }

  protected get billingStatus(): 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' {
    return this.getTenantContext().billingStatus;
  }

  /**
   * Loga uma ação contextualizada com o tenant.
   * @param message Mensagem de log
   * @param contextData Dados adicionais opcionais
   */
  protected logTenantAction(message: string, contextData?: Record<string, any>): void {
    const tenantInfo = this.getTenantContext();
    this.logger.log(`[Tenant: ${tenantInfo.name} - ${tenantInfo.id}] ${message}`, contextData);
  }

  /**
   * Loga um erro contextualizado com o tenant.
   * @param message Mensagem de erro
   * @param error Objeto de erro
   */
  protected errorTenantAction(message: string, error?: unknown): void {
    const tenantInfo = this.getTenantContext();
    this.logger.error(`[Tenant: ${tenantInfo.name} - ${tenantInfo.id}] ${message}`, error instanceof Error ? error.stack : String(error));
  }

  /**
   * Diagnóstico: loga o schema atual (útil para debugging de multi-tenancy).
   */
  protected async debugTenantConnection(): Promise<void> {
    const prisma = await this.getTenantPrismaClient();
    const result = await prisma.$queryRawUnsafe(`SELECT current_schema();`);
    this.logger.debug(`[Tenant: ${this.tenantId}] Schema atual ativo: ${JSON.stringify(result)}`);
  }
}
