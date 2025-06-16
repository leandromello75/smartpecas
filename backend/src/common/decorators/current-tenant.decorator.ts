// =============================================================================
// SmartPeças ERP - CurrentTenant Decorator
// =============================================================================
// Arquivo: backend/src/common/decorators/current-tenant.decorator.ts
//
// Descrição: Decorator para acessar diretamente o contexto do tenant atual
// que foi previamente populado pelo TenantResolveGuard.
//
// Versão: 1.1
// =============================================================================

import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { TenantContext } from '../tenant-context/tenant-context.service';

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext as TenantContext;

    if (!tenantContext) {
      throw new InternalServerErrorException('TenantContext não definido na requisição.');
    }

    return data ? tenantContext[data] : tenantContext;
  },
);
