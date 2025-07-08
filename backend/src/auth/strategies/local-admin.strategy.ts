// =============================================================================
// SmartPeças ERP - LocalAdminStrategy (Otimizada v1.0.1)
// =============================================================================
// Arquivo: backend/src/auth/strategies/local-admin.strategy.ts
//
// Descrição: Estratégia Passport para autenticação local de administradores globais.
// Valida credenciais (e-mail/senha) e retorna o usuário.
//
// Versão: 1.0.1
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 08/07/2025
// =============================================================================

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service'; // Importar o AuthService
import { AdminUser } from '../../generated/prisma-client'; // Importar o tipo AdminUser

@Injectable()
export class LocalAdminStrategy extends PassportStrategy(Strategy, 'local-admin') {
  private readonly logger = new Logger(LocalAdminStrategy.name);

  constructor(private authService: AuthService) { // Injetar o AuthService
    super({
      usernameField: 'email', // Campo para o nome de usuário no DTO de login
      passwordField: 'password', // Campo para a senha no DTO de login
    });
  }

  /**
   * Método de validação da estratégia.
   * Chamado pelo AuthGuard('local-admin').
   * @param email - E-mail do usuário
   * @param password - Senha do usuário
   * @returns O objeto de usuário validado (sem a senha) ou null/false.
   */
  async validate(email: string, password_plain: string): Promise<Omit<AdminUser, 'password'> | null> {
    this.logger.debug(`Tentativa de validação local para: ${email}`);
    
    // CORREÇÃO: Chama o método validateCredentials do AuthService
    const user = await this.authService.validateCredentials(email, password_plain);

    if (!user) {
      this.logger.warn(`Credenciais inválidas para ${email}.`);
      throw new UnauthorizedException('Credenciais inválidas.'); // Lançar exceção para o Guard capturar
    }

    // Retorna o usuário (sem senha) para ser injetado em req.user
    return user;
  }
}