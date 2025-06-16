// =============================================================================
// SmartPeças ERP - TenantResolverGuard
// =============================================================================
// Arquivo: backend/src/common/guards/tenant-resolver.guard.ts
//
// Descrição: Guard que identifica o inquilino atual a partir do token JWT,
// busca suas informações no schema público e injeta no TenantContextService.
// Garante que apenas tenants ativos e com pagamentos em dia acessem suas APIs.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { Request } from 'express';
import { TenantContext } from '../tenant-context/tenant-context.service'; // Para tipagem forte
import '../../interfaces/request-with-tenant.interface'; // Extensão do tipo Request com tenantContext

@Injectable()
export class TenantResolverGuard implements CanActivate {
  private readonly logger = new Logger(TenantResolverGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { tenantId?: string };

    if (!user?.tenantId) {
      this.logger.warn('Token JWT não contém tenantId. Verifique o AuthGuard anterior.');
      throw new UnauthorizedException('Tenant não identificado no token de autenticação.');
    }

    const tenantId = user.tenantId;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        cnpj: true,
        email: true,
        schemaUrl: true,
        isActive: true,
        billingStatus: true,
      },
    });

    if (!tenant) {
      this.logger.warn(`Tenant '${tenantId}' não encontrado no schema público.`);
      throw new UnauthorizedException('Inquilino associado ao token não encontrado.');
    }

    if (!tenant.isActive) {
      this.logger.warn(`Tenant '${tenant.name}' está desativado.`);
      throw new ForbiddenException('Acesso negado: Este inquilino está desativado.');
    }

    if (tenant.billingStatus !== 'ACTIVE') {
      this.logger.warn(`Tenant '${tenant.name}' está com status de faturamento '${tenant.billingStatus}'.`);
      throw new ForbiddenException('Acesso negado: Este inquilino está com pendências financeiras.');
    }

    const contextData: TenantContext = {
      id: tenant.id,
      schemaUrl: tenant.schemaUrl,
      name: tenant.name,
      cnpj: tenant.cnpj,
      email: tenant.email,
      billingStatus: tenant.billingStatus as 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED',
    };

    // Define o contexto para o serviço
    this.tenantContext.setTenant(contextData);

    // E opcionalmente também no request (caso alguém precise diretamente no controller)
    request.tenantContext = contextData;

    this.logger.debug(`Tenant '${tenant.name}' (${tenant.id}) validado e contexto definido.`);
    return true;
  }
}
