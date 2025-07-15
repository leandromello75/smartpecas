// =============================================================================
// SmartPeças ERP - CurrentTenant Decorator (Otimizado v1.1.1)
// =============================================================================
// Arquivo: backend/src/common/decorators/current-tenant.decorator.ts
//
// Descrição: Decorator para acessar diretamente o contexto do tenant atual
// que foi previamente populado pelo TenantResolveGuard/Interceptor.
//
// Versão: 1.1.1
// Equipe SmartPeças
// Atualizado em: 10/07/2025
// =============================================================================

import { createParamDecorator, ExecutionContext, InternalServerErrorException, Logger } from '@nestjs/common';
import { TenantContext } from '../tenant-context/tenant-context.service';

// Instância de Logger para uso dentro do decorador, se necessário logar erros internos do decorador
const tenantDecoratorLogger = new Logger('CurrentTenantDecorator');

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    // Garante que request.tenantContext é do tipo TenantContext ou undefined
    const tenantContext = request.tenantContext as TenantContext | undefined; 

    if (!tenantContext) {
      tenantDecoratorLogger.error('TenantContext não definido na requisição. Verifique se o TenantInterceptor ou Guard está aplicado corretamente.');
      throw new InternalServerErrorException('Contexto do inquilino não disponível. Autenticação ou interceptor ausente.');
    }

    // Retorna a propriedade específica ou o objeto completo
    return data ? tenantContext[data] : tenantContext;
  },
);