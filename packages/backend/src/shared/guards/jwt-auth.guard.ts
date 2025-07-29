// =============================================================================
// SmartPeças ERP - Guard - Autenticação JWT (Base)
// =============================================================================
// Arquivo: src/shared/guards/jwt-auth.guard.ts
//
// Descrição: Guardião base que utiliza a estratégia 'jwt' do Passport para proteger
// rotas, com tratamento customizado de falhas na autenticação.
//
// Versão: 1.1.1
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw new UnauthorizedException('Acesso negado. Token inválido ou ausente.');
    }
    return user;
  }
}
