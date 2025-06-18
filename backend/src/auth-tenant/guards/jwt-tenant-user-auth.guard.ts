// =============================================================================
// SmartPeças ERP - JwtTenantUserAuthGuard
// =============================================================================
// Arquivo: backend/src/auth-tenant/guards/jwt-tenant-user-auth.guard.ts
//
// Descrição: Guarda de autenticação NestJS para proteger rotas de acesso a
// dados de inquilino, utilizando a estratégia 'jwt-tenant-user'.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 17/06/2025
// =============================================================================

import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// O nome 'jwt-tenant-user' deve corresponder exatamente ao nome da estratégia
// definida em JwtTenantUserStrategy.ts
export class JwtTenantUserAuthGuard extends AuthGuard('jwt-tenant-user') {
  private readonly logger = new Logger(JwtTenantUserAuthGuard.name);

  // Manipula a resposta de autenticação personalizada.
  // Este método é chamado automaticamente pelo Passport após a execução da estratégia.
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(`Falha na autenticação JwtTenantUserAuthGuard. Erro: ${err?.message || 'N/A'}. Info: ${info?.message || 'N/A'}`);
      throw err || new UnauthorizedException('Token de autenticação inválido ou expirado.');
    }

    // Se o usuário for válido, ele será retornado e atribuído automaticamente a req.user
    return user;
  }
}
