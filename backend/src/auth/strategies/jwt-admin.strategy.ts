// =============================================================================
// SmartPeças ERP - JwtAdminStrategy (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/auth/strategies/jwt-admin.strategy.ts
// Versão: 2.3
// =============================================================================

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service'; // Importamos o PrismaService
import { AdminUser } from '@/public-client'; // Importamos o tipo do cliente público
import { JwtAdminPayload } from '@/types/jwt/jwt-admin-payload.interface'; // Importamos nossa interface

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  private readonly logger = new Logger(JwtAdminStrategy.name);

  constructor(
    configService: ConfigService,
    // ✅ Injetamos o PrismaService para buscar o usuário no banco
    private prisma: PrismaService,
  ) {
    super({
      // ✅ CORREÇÃO: Adicionamos a forma de extrair o token, o que resolve 2 erros.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  /**
   * Valida o payload do JWT e busca o usuário no banco para garantir que ele
   * ainda existe e está ativo. Esta é a abordagem stateful, mais segura.
   */
  async validate(payload: JwtAdminPayload): Promise<Omit<AdminUser, 'password'>> {
    this.logger.debug(`Validando token JWT para admin: ${payload.email}`);
    
    // Buscamos o usuário no banco a cada requisição para máxima segurança.
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!adminUser || !adminUser.isActive) {
      this.logger.warn(`AdminUser do token JWT inválido ou inativo: ${payload.email}`);
      throw new UnauthorizedException('Token inválido ou usuário removido.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = adminUser;
    return result;
  }
}
