// =============================================================================
// SmartPeças ERP - LocalAdminStrategy
// =============================================================================
// Arquivo: backend/src/auth/strategies/local-admin.strategy.ts
//
// Descrição: Estratégia Passport local customizada para autenticação de
// administradores globais do sistema. Integra com AuthService para validação
// de credenciais e controle de acesso por status do Tenant.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AdminUser } from '@prisma/client';

@Injectable()
export class LocalAdminStrategy extends PassportStrategy(Strategy, 'local-admin') {
  private readonly logger = new Logger(LocalAdminStrategy.name);

  constructor(private authService: AuthService) {
    // Configura a estratégia para usar os campos 'email' e 'password'
    super({ usernameField: 'email', passwordField: 'password' });
  }

  /**
   * Método invocado automaticamente pelo Passport ao usar o LocalAuthGuard.
   * Retorna o AdminUser validado (será injetado em req.user no controller).
   */
  async validate(email: string, password: string): Promise<Omit<AdminUser, 'password'>> {
    this.logger.debug(`Executando validação local para admin: ${email}`);

    const adminUser = await this.authService.validateAdminUser(email, password);

    if (!adminUser) {
      this.logger.warn(`AdminUser inválido ou tenant não autorizado: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas ou acesso suspenso.');
    }

    return adminUser;
  }
}
