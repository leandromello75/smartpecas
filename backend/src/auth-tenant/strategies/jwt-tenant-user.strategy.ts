// =============================================================================
// SmartPeças ERP - Estratégia JWT para Usuários do Inquilino
// =============================================================================
// Arquivo: backend/src/auth-tenant/strategies/jwt-tenant-user.strategy.ts
//
// Descrição: Estratégia Passport que valida JWTs de usuários do schema de tenant.
// Utiliza o schemaUrl do payload para obter o PrismaClient correto.
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
import { JwtTenantUserPayload } from '../interfaces/jwt-tenant-user-payload.interface'; // Crie essa interface se ainda não existir
import { User } from '@prisma/client';

@Injectable()
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

  async validate(payload: JwtTenantUserPayload): Promise<Omit<User, 'password'>> {
    const { sub: userId, email, schemaUrl } = payload;

    if (!schemaUrl) {
      this.logger.error('Payload JWT sem schemaUrl fornecido.');
      throw new UnauthorizedException('Token inválido: schema do tenant ausente.');
    }

    this.logger.debug(`Validando JWT para usuário: ${email} no schema: ${schemaUrl}`);

    const tenantPrisma = await this.prismaService.getTenantClient(schemaUrl);

    const user = await tenantPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      this.logger.warn(`Usuário inativo ou inexistente [${email}] no schema '${schemaUrl}'`);
      throw new UnauthorizedException('Token JWT inválido ou usuário não autorizado.');
    }

    return user;
  }
}
