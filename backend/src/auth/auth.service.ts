// =============================================================================
// SmartPeças ERP - AuthService (AdminUser) - VERSÃO FINAL
// =============================================================================
// Arquivo: backend/src/auth/auth.service.ts
//
// Versão: 3.0
// =============================================================================

import {
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
// AdminUser vem do cliente público padrão
import { AdminUser } from '@/public-client'; 
// JwtAdminPayload vem do nosso tipo compartilhado
import { JwtAdminPayload } from '@/types/jwt/jwt-admin-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida as credenciais de um AdminUser.
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
      this.logger.warn(`Login de admin falhou para '${email}': usuário não encontrado ou inativo.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!adminUser.tenant || adminUser.tenant.billingStatus !== 'ACTIVE') {
      this.logger.warn(`Login de admin bloqueado para '${email}': tenant inadimplente.`);
      throw new ForbiddenException('O acesso à conta está suspenso.');
    }

    const isPasswordValid = await bcrypt.compare(password_plain, adminUser.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login de admin falhou para '${email}': senha inválida.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { password, ...safeUser } = adminUser;
    return safeUser;
  }

  /**
   * Gera um token JWT para o AdminUser validado.
   */
  async loginAdmin(
    adminUser: Omit<AdminUser, 'password'>,
  ): Promise<{ access_token: string }> {
    this.logger.debug(`Gerando JWT para adminUser: ${adminUser.email}`);

    const payload: JwtAdminPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      tenantId: adminUser.tenantId,
    };

    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}
