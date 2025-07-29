// =============================================================================
// SmartPeças ERP - AuthService (AdminUser) - VERSÃO FINAL OTIMIZADA E SEGURA
// =============================================================================
// Arquivo: backend/src/auth/auth.service.ts
//
// Descrição: Serviço de autenticação para administradores globais,
// com validação de credenciais, geração de JWT e checagem de status de tenant.
//
// Versão: 3.1.6
// Equipe SmartPeças
// Atualizado em: 07/07/2025 (Corrigido em 15/07/2025)
// =============================================================================

import {
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AdminUser, Role } from '@prisma/client'; 
import { JwtAdminPayload } from '../shared/interfaces/jwt-payload.interface'; 
import { LoginRateLimiterService } from './login-rate-limiter.service'; 

type AdminUserWithTenant = AdminUser & { 
    tenant: { id: string; billingStatus: string; isActive: boolean } | null 
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private loginRateLimiterService: LoginRateLimiterService,
  ) {}

  async validateCredentials(
    email: string,
    password_plain: string,
  ): Promise<Omit<AdminUserWithTenant, 'password'> | null> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            billingStatus: true,
            isActive: true,
          },
        },
      },
    });

    if (!adminUser || !adminUser.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password_plain, adminUser.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password, ...safeUser } = adminUser;
    return safeUser as Omit<AdminUserWithTenant, 'password'>; 
  }

  /**
   * Valida as credenciais de um AdminUser e gera um JWT.
   * Este é o método principal chamado pelo controller.
   * @param email - E-mail do administrador
   * @param password_plain - Senha em texto plano
   * @param ip - Endereço IP da requisição para rate limiting
   * @param userAgent - User-Agent da requisição para auditoria
   * @returns Um objeto contendo o token de acesso e seu tempo de expiração.
   */
  async validateAndLoginAdmin(
    email: string,
    password_plain: string,
    ip: string,
    userAgent?: string // ESTA É A LINHA CRÍTICA: userAgent como parâmetro opcional
  ): Promise<{
    access_token: string;
    expires_in: number;
    user: { id: string; email: string; name: string | null };
  }> {
    this.logger.debug(`Tentativa de login para adminUser: ${email} do IP: ${ip}`);

    await this.loginRateLimiterService.checkAttempts(email, ip);

    const adminUserValidated: Omit<AdminUserWithTenant, 'password'> | null = await this.validateCredentials(email, password_plain);

    if (!adminUserValidated) {
        this.logger.warn(`Login de admin falhou para '${email}': credenciais inválidas.`);
        await this.loginRateLimiterService.recordFailedAttempt(email, ip);
        throw new UnauthorizedException('Credenciais inválidas.');
    }

    await this.verificarStatusTenant(adminUserValidated.tenant);

    const userRoleEnum: Role = adminUserValidated.role as Role;
    if (!Object.values(Role).includes(userRoleEnum)) {
        this.logger.error(`[SEGURANÇA] Perfil de acesso inválido no DB para '${email}': ${adminUserValidated.role}`);
        throw new InternalServerErrorException('Configuração de perfil de usuário inválida. Contate o suporte.');
    }

    await this.loginRateLimiterService.resetAttempts(email, ip);

    const payload: JwtAdminPayload = {
      sub: adminUserValidated.id,
      email: adminUserValidated.email,
      role: userRoleEnum,
      tenantId: adminUserValidated.tenantId ?? null,
      name: adminUserValidated.name ?? null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    };

    const token = this.jwtService.sign(payload);
    
    const decodedToken = this.jwtService.decode(token) as { exp?: number };
    const expiresIn = decodedToken.exp ? decodedToken.exp - Math.floor(Date.now() / 1000) : 3600;

    this.logger.debug(`Gerando JWT para adminUser: ${adminUserValidated.email}`);
    
    return {
      access_token: token,
      expires_in: expiresIn,
      user: {
        id: adminUserValidated.id,
        email: adminUserValidated.email,
        name: adminUserValidated.name,
      },
    };
  }

  /**
   * Método interno para verificar o status de faturamento do Tenant.
   * @param tenant - Objeto Tenant (com billingStatus e isActive)
   * @throws ForbiddenException se o acesso for suspenso.
   */
  private async verificarStatusTenant(tenant: { billingStatus: string; isActive: boolean } | null): Promise<void> {
    if (!tenant || tenant.billingStatus !== 'ACTIVE' || !tenant.isActive) {
      this.logger.warn(`Acesso bloqueado: Tenant com status de faturamento ${tenant?.billingStatus || 'NÃO ENCONTRADO'}.`);
      throw new ForbiddenException('O acesso à conta está suspenso. Entre em contato com o suporte.');
    }
  }
}