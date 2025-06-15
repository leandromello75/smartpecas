// =============================================================================
// SmartPeças ERP - TenantResolveGuard
// =============================================================================
// Arquivo: backend/src/common/guards/tenant-resolve.guard.ts
//
// Descrição: Guard que identifica o inquilino atual a partir do token JWT,
// busca suas informações no schema público e injeta no TenantContextService.
// Garante que apenas tenants ativos e com pagamentos em dia acessem suas APIs.
//
// Versão: 1.2
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
import { BillingStatus } from '@prisma/client'; // Enum do Prisma

interface AuthenticatedUser {
  tenantId?: string;
}

@Injectable()
export class TenantResolveGuard implements CanActivate {
  private readonly logger = new Logger(TenantResolveGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user?.tenantId) {
      this.logger.warn('Acesso negado: Token JWT sem tenantId.');
      throw new UnauthorizedException('Tenant não identificado no token.');
    }

    const tenantId = user.tenantId;

    try {
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
        this.logger.warn(`Acesso negado: Tenant '${tenantId}' não encontrado.`);
        throw new UnauthorizedException('Inquilino associado ao token não encontrado.');
      }

      if (!tenant.isActive) {
        this.logger.warn(`Acesso negado: Tenant '${tenant.name}' está desativado.`);
        throw new ForbiddenException('Inquilino desativado.');
      }

      if (tenant.billingStatus !== BillingStatus.ACTIVE) {
        this.logger.warn(`Tenant '${tenant.name}' com billingStatus '${tenant.billingStatus}' bloqueado.`);
        throw new ForbiddenException('Acesso negado: Pendência financeira.');
      }

      this.tenantContext.setTenant({
        id: tenant.id,
        schemaUrl: tenant.schemaUrl,
        name: tenant.name,
        cnpj: tenant.cnpj,
        email: tenant.email,
        billingStatus: tenant.billingStatus,
      });

      this.logger.debug(`Contexto do tenant '${tenant.name}' (${tenant.id}) definido.`);
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao validar tenant '${tenantId}':`,
        error.stack || error.message,
      );
      throw new UnauthorizedException('Erro ao validar o inquilino.');
    }
  }
}
