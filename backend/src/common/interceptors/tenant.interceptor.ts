// =============================================================================
// SmartPeças ERP - TenantInterceptor (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/shared/interceptors/tenant.interceptor.ts
//
// Descrição: Interceptor global para extrair e propagar o contexto do tenant
// (ID, nome, status) para a requisição atual usando TenantContextService.
//
// Versão: 1.2.3
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 10/07/2025
// =============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { TenantContextService, TenantContext } from '../tenant-context/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
// Importa o modelo Tenant e BillingStatus (se o enum estiver em prisma-client)
import { Tenant, BillingStatus } from '../../generated/prisma-client'; 

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();
    const tenantIdFromHeader = request.headers['x-tenant-id'] as string; 

    if (!tenantIdFromHeader) {
      this.logger.debug('Header x-tenant-id ausente. Continuar sem contexto de tenant.');
      return next.handle();
    }

    let tenantDb: Tenant | null;
    try {
        // CORREÇÃO: Select para pegar TODOS os campos que a interface TenantContext espera
        tenantDb = await this.prisma.tenant.findUnique({
            where: { id: tenantIdFromHeader },
            select: { 
                id: true,
                name: true,
                billingStatus: true,
                isActive: true,
                schemaUrl: true,
                cnpj: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    } catch (error) {
        this.logger.error(`Erro ao buscar tenant ${tenantIdFromHeader}: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
        return next.handle(); 
    }

    if (!tenantDb || !tenantDb.isActive || tenantDb.billingStatus !== BillingStatus.ACTIVE) {
        this.logger.warn(`Tenant ID ${tenantIdFromHeader} inválido ou inativo/inadimplente. Continuando sem definir contexto.`);
        return next.handle(); 
    }

    // Constrói o objeto de contexto a partir dos dados do DB
    // AGORA ISSO ESTÁ ALINHADO COM A INTERFACE COMPLETA DO TenantContext
    const tenantContext: TenantContext = {
        id: tenantDb.id,
        name: tenantDb.name,
        billingStatus: tenantDb.billingStatus,
        isActive: tenantDb.isActive,
        schemaUrl: tenantDb.schemaUrl,
        cnpj: tenantDb.cnpj,
        createdAt: tenantDb.createdAt,
        updatedAt: tenantDb.updatedAt,
    };

    this.logger.debug(`Contexto de tenant ${tenantContext.name} (${tenantContext.id}) definido para a requisição.`);
    return this.tenantContextService.run(tenantContext, () => next.handle());
  }
}