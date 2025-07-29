// =============================================================================
// SmartPeças ERP - AdminAuthGuard (Corrigido e Tipado)
// =============================================================================
// Arquivo: backend/src/auth/guards/admin-auth.guard.ts
//
// Descrição: Guarda de autenticação para administradores globais usando JWT.
// Corrige o uso do método 'handleRequest' com 'override' e tipos corretos.
//
// Versão: 1.1
// Equipe SmartPeças
// Atualizado em: 08/07/2025
// =============================================================================

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt-admin') {
  override handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException('Autenticação JWT de administrador falhou.');
    }
    return user;
  }
}
