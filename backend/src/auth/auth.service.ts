// =============================================================================
// SmartPeças ERP - AuthService (AdminUser)
// =============================================================================
// Arquivo: backend/src/auth/auth.service.ts
//
// Descrição: Serviço de autenticação de administradores globais. Valida
// credenciais, verifica status do tenant associado e emite JWT.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import {
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from '@prisma/client';
import { JwtAdminPayload } from './strategies/jwt-admin.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida as credenciais de um AdminUser (email e senha), incluindo
   * verificação do status do tenant associado.
   * @param email E-mail do administrador
   * @param password_plain Senha em texto puro
   * @returns Objeto AdminUser validado (sem a senha)
   */
  async validateAdminUser(
    email: string,
    password_plain: string,
  ): Promise<Omit<AdminUser, 'password'>> {
    this.logger.debug(`Validando adminUser: ${email}`);

    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!adminUser || !adminUser.isActive) {
      this.logger.warn(`Login falhou para '${email}': usuário não encontrado ou inativo.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!adminUser.tenant || adminUser.tenant.billingStatus !== 'ACTIVE') {
      this.logger.warn(`Login bloqueado para '${email}': tenant suspenso ou inadimplente.`);
      throw new ForbiddenException(
        'O acesso está suspenso devido à situação de pagamento do cliente.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password_plain, adminUser.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login falhou para '${email}': senha inválida.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { password, ...safeUser } = adminUser;
    return safeUser;
  }

  /**
   * Gera um token JWT para o AdminUser validado.
   * @param adminUser Usuário autenticado (sem senha)
   * @returns Objeto com token JWT
   */
  async loginAdmin(
    adminUser: Omit<AdminUser, 'password'>,
  ): Promise<{ access_token: string }> {
    this.logger.debug(`Gerando JWT para adminUser: ${adminUser.email}`);

    const payload: JwtAdminPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      tenantId: adminUser.tenantId || undefined,
    };

    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
