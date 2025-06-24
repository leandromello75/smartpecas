// =============================================================================
// SmartPeças ERP - AuthTenantService (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/auth-tenant/auth-tenant.service.ts
//
// Descrição: Serviço de autenticação para usuários de tenant, alinhado com a
// arquitetura multi-client e as melhores práticas de tipagem.
//
// Versão: 2.1
// =============================================================================

import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// ✅ CORREÇÃO 1: Usando o "path alias" que definimos no tsconfig.json.
import {User, PrismaClient as TenantPrismaClient } from '@/tenant-client';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthTenantService {
  // O logger agora será usado, então o aviso desaparecerá.
  private readonly logger = new Logger(AuthTenantService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Valida as credenciais de um usuário do tenant no contexto atual.
   */
  async validateTenantUser(
    email: string,
    plainPassword: string,
  ): Promise<Omit<User, 'password'>> {

    // ✅ CORREÇÃO 2: Usando o nome correto do getter: 'tenantSchema'
    const tenantSchema = this.tenantContext.tenantSchemaUrl;
    if (!tenantSchema) {
      throw new InternalServerErrorException('Schema do tenant não encontrado no contexto da requisição.');
    }

    const tenantPrisma: TenantPrismaClient = await this.prisma.getTenantClient(
      tenantSchema,
    );

    const user = await tenantPrisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      // ✅ CORREÇÃO 3: Usando o logger para registrar a falha.
      this.logger.warn(`Tentativa de login falhou para ${email} no schema ${tenantSchema}: Usuário não encontrado ou inativo.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordOk = await bcrypt.compare(plainPassword, user.password);
    if (!passwordOk) {
      // ✅ CORREÇÃO 3: Usando o logger para registrar a falha.
      this.logger.warn(`Tentativa de login falhou para ${email} no schema ${tenantSchema}: Senha inválida.`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { password, ...userSafe } = user;
    return userSafe;
  }

  /**
   * Gera um token JWT para um usuário do tenant validado.
   */
  async loginTenantUser(user: Omit<User, 'password'>): Promise<{ access_token: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}
