// =============================================================================
// SmartPeças ERP - Guard - Verificação de Tenant
// =============================================================================
// Arquivo: src/shared/guards/tenant.guard.ts
//
// Descrição: Guardião que valida a presença do header 'x-tenant-id' em
// requisições destinadas a rotas que dependem de um contexto de tenant.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new BadRequestException('O header x-tenant-id é obrigatório para esta rota.');
    }

    return true;
  }
}