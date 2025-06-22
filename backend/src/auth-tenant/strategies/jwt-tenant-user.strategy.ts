// =============================================================================
// SmartPeças ERP - JwtTenantUserStrategy
// =============================================================================
// Arquivo: backend/src/auth-tenant/strategies/jwt-tenant-user.strategy.ts
//
// Descrição: Estratégia Passport.js para autenticação de usuários de inquilino
// via JWT. Valida o token e extrai informações do usuário.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 16/06/2025
// =============================================================================

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtTenantUserPayload } from '../../types/jwt/jwt-tenant-user-payload.interface'; // Interface movida para pasta dedicada
import { User } from '@prisma/client';

@Injectable()
// Estratégia identificada como 'jwt-tenant-user' (usada nos Guards)
export class JwtTenantUserStrategy extends PassportStrategy(Strategy, 'jwt-tenant-user') {
  private readonly logger = new Logger(JwtTenantUserStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload do JWT de um usuário de inquilino.
   * Executado automaticamente pelo Passport após a extração do token.
   *
   * @param payload Dados extraídos do JWT
   * @returns O objeto User validado (sem a senha), anexado a `req.user`
   * @throws UnauthorizedException se o token for inválido ou o usuário não for encontrado
   */
  async validate(payload: JwtTenantUserPayload): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Validando JWT para usuário do tenant: ${payload.email}`);

    const tenantPrisma = await this.prismaService.getTenantClient(payload.schemaUrl);

    const user = await tenantPrisma.user.findUnique({
      where: {
        id: payload.sub,
        email: payload.email,
      },
    });

    if (!user || !user.isActive) {
      this.logger.warn(
        `JWT inválido ou usuário não encontrado para tenant '${payload.tenantId}': ${payload.email}`,
      );
      throw new UnauthorizedException('Token JWT inválido ou usuário inativo.');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
