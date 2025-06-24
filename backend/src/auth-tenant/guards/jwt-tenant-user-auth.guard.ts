// =============================================================================
// SmartPeças ERP - JwtTenantUserAuthGuard (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/auth-tenant/guards/jwt-tenant-user-auth.guard.ts
//
// Descrição: Guarda de rota que protege endpoints de tenant, garantindo que
// o usuário tenha um JWT de tenant válido.
//
// Versão: 1.1
// =============================================================================

import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtTenantUserAuthGuard extends AuthGuard('jwt-tenant-user') {
  private readonly logger = new Logger(JwtTenantUserAuthGuard.name);

  /**
   * Manipula a resposta de autenticação.
   * Sobrescreve o método padrão para adicionar logging customizado.
   */
  // ✅ CORREÇÃO 1: Adicionamos a palavra-chave 'override'.
  // ✅ CORREÇÃO 2: Adicionamos '_' em 'info' e 'context' para indicar que não são usados.
  override handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    if (err || !user) {
      // ✅ A sua lógica customizada de log está mantida e é excelente!
      this.logger.warn(
        `Falha na autenticação (JwtTenantUserAuthGuard). Erro: ${err?.message || 'Usuário não retornado pela estratégia.'}`,
      );
      throw err || new UnauthorizedException('Token de autenticação inválido, expirado ou usuário não existe mais.');
    }
    // Se não houver erro e o usuário existir, o Passport irá anexá-lo a `req.user`.
    return user;
  }
}
