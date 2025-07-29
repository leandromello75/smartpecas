// =============================================================================
// SmartPeças ERP - JwtAdminStrategy (VERSÃO OTIMIZADA E SEGURA v3.1.3)
// =============================================================================
// Arquivo: backend/src/auth/strategies/jwt-admin.strategy.ts
//
// Descrição: Estratégia Passport para autenticação JWT de administradores globais.
// Valida o token, busca o usuário no banco, verifica status do tenant e papel.
//
// Versão: 3.1.3
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 08/07/2025
// =============================================================================

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUser, Role } from '@prisma/client';
import { JwtAdminPayload } from '../../shared/interfaces/jwt-payload.interface';

// Interface segura para retornar ao contexto da requisição
// Ela espera TODOS os campos de AdminUser, exceto 'password'.
export type SafeAdminUser = Omit<AdminUser, 'password'> & { 
  tenant: { id: string; billingStatus: string; isActive: boolean }; 
};

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  private readonly logger = new Logger(JwtAdminStrategy.name);

  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET') as string;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Valida o payload do JWT e garante que o usuário ainda existe, está ativo e tem o papel correto.
   * Verifica também o status do tenant associado.
   * Esta é uma abordagem stateful para maior segurança.
   * @param payload Payload decodificado do JWT.
   * @returns O objeto AdminUser seguro para injetar em req.user.
   * @throws UnauthorizedException se o token ou usuário for inválido.
   * @throws ForbiddenException se o tenant estiver suspenso.
   */
  async validate(payload: JwtAdminPayload): Promise<SafeAdminUser> {
    this.logger.debug(`Validando token JWT para admin: ${payload.email} (sub: ${payload.sub})`);

    try {
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          password: true, // Necessário para omitir corretamente depois
          name: true,
          role: true,
          isActive: true,
          tenantId: true,
          createdAt: true, // CORREÇÃO: Incluir createdAt
          updatedAt: true, // CORREÇÃO: Incluir updatedAt
          tenant: { 
            select: {
              id: true,
              billingStatus: true,
              isActive: true,
            },
          },
        },
      });

      // Validações existentes...
      if (!adminUser || !adminUser.isActive) {
        this.logger.warn(`Admin inválido ou inativo encontrado no token: ${payload.email} (DB: ${adminUser?.email || 'N/A'}, Ativo: ${adminUser?.isActive || 'N/A'}).`);
        throw new UnauthorizedException('Usuário não encontrado ou inativo.');
      }

      if (!adminUser.tenant || adminUser.tenant.billingStatus !== 'ACTIVE' || !adminUser.tenant.isActive) {
        this.logger.warn(`Acesso negado: Tenant (${adminUser.tenantId}) associado ao admin '${payload.email}' está ${adminUser.tenant?.billingStatus || 'N/A'}.`);
        throw new ForbiddenException('Acesso à conta suspenso. Entre em contato com o suporte.');
      }

      const dbRoleEnum: Role = adminUser.role as Role; 

      if (payload.role !== dbRoleEnum || !Object.values(Role).includes(payload.role)) {
        this.logger.warn(`[SEGURANÇA] Papel (role) do token difere do DB ou é inválido para ${payload.email}. Token: ${payload.role}, DB: ${adminUser.role}.`);
        throw new UnauthorizedException('Perfil de acesso inválido ou alterado.');
      }

      // Constrói o objeto seguro para req.user, incluindo todos os campos necessários.
      // Omitir a senha aqui e garantir que os outros campos (createdAt, updatedAt) estejam presentes.
      const { password, ...safeUserFromDb } = adminUser;
      
      const safeUser: SafeAdminUser = {
        ...safeUserFromDb, // Inclui todos os campos do adminUser (exceto password)
        name: safeUserFromDb.name ?? null, // Garante que name seja string | null
        tenantId: safeUserFromDb.tenantId ?? null, // Garante que tenantId seja string | null
        // Garante que o role seja o tipo Role para uso consistente
        // A validação acima já garante que adminUser.role é compatível com Role
        role: safeUserFromDb.role as Role, 
        // O tipo 'tenant' já está correto vindo do select, mas preciso garantir que não é null
        tenant: safeUserFromDb.tenant as { id: string; billingStatus: string; isActive: boolean },
        // is Active é boolean e virá corretamente do DB
      };
      
      return safeUser;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Erro fatal na validação JWT para ${payload.email}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
      throw new UnauthorizedException('Token inválido ou erro interno na autenticação.');
    }
  }
}