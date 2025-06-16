// =============================================================================
// SmartPeças ERP - AuthTenantService
// =============================================================================
// Arquivo: backend/src/auth-tenant/auth-tenant.service.ts
//
// Descrição: Serviço de autenticação para usuários específicos de um tenant.
// Realiza validação de credenciais, geração de token JWT e acesso isolado
// ao schema do inquilino via Prisma multi-schema.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 16/06/2025
// =============================================================================

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, User } from '@prisma/client';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthTenantService {
  private readonly logger = new Logger(AuthTenantService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Valida as credenciais de um usuário do tenant no contexto atual.
   * @param email Email do usuário do inquilino
   * @param plainPassword Senha em texto puro
   * @returns O usuário validado sem senha ou lança exceção
   */
  async validateTenantUser(email: string, plainPassword: string): Promise<Omit<User, 'password'>> {
    const schemaUrl = this.tenantContext.tenantSchemaUrl;
    const tenantPrisma: PrismaClient = await this.prisma.getTenantClient(schemaUrl);

    const user = await tenantPrisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      this.logger.warn(`Tentativa de login falhou. Usuário não encontrado ou inativo: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordOk = await bcrypt.compare(plainPassword, user.password);
    if (!passwordOk) {
      this.logger.warn(`Tentativa de login falhou. Senha inválida para: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { password, ...userSafe } = user;
    return userSafe;
  }

  /**
   * Gera um token JWT para um usuário do tenant validado.
   * @param user O usuário validado (sem a senha)
   * @returns Objeto com token JWT
   */
  async loginTenantUser(user: Omit<User, 'password'>): Promise<{ access_token: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: this.tenantContext.tenantId, // importante para resoluções posteriores
    };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}
