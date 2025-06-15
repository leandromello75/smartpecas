// =============================================================================
// SmartPeças ERP - JwtAdminStrategy
// =============================================================================
// Arquivo: backend/src/auth/strategies/jwt-admin.strategy.ts
//
// Descrição: Estratégia JWT para autenticação de administradores globais do
// sistema. Valida o token e carrega o usuário do schema público.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUser } from '@prisma/client';

// Payload do token JWT do admin
export interface JwtAdminPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
}

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  private readonly logger = new Logger(JwtAdminStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload JWT após decodificação.
   * @param payload Dados do token.
   * @returns AdminUser sem senha, se válido.
   */
  async validate(payload: JwtAdminPayload): Promise<Omit<AdminUser, 'password'>> {
    this.logger.debug(`Validando token JWT: sub=${payload.sub}, email=${payload.email}`);

    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!adminUser || !adminUser.isActive) {
      this.logger.warn(`AdminUser inválido ou inativo: ${payload.email}`);
      throw new UnauthorizedException('Token inválido ou usuário inativo.');
    }

    return adminUser;
  }
}
