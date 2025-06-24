// =============================================================================
// SmartPeças ERP - LocalTenantUserAuthGuard
// =============================================================================
// Arquivo: backend/src/auth-tenant/guards/local-tenant-user.guard.ts
//
// Descrição: Guarda de autenticação para usuários do inquilino (tenant),
// usando a estratégia 'local-tenant-user'. Valida credenciais e lida com falhas.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 16/06/2025
// =============================================================================

import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// O nome 'local-tenant-user' deve corresponder ao nome da estratégia definida em LocalTenantUserStrategy
export class LocalTenantUserAuthGuard extends AuthGuard('local-tenant-user') {
  private readonly logger = new Logger(LocalTenantUserAuthGuard.name);

  /**
   * Manipula o resultado da autenticação local.
   * Se falhar, lança exceção customizada com log apropriado.
   */
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const req = context.switchToHttp().getRequest();
      const emailAttempt = req.body?.email || 'N/D';
      this.logger.warn(`Falha de login para email '${emailAttempt}': ${err?.message || info?.message || 'Não autenticado.'}`);
      throw err || new UnauthorizedException('Credenciais inválidas para usuário do inquilino.');
    }
    return user;
  }
}
