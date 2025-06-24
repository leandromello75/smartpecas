// =============================================================================
// SmartPeças ERP - JwtTenantUserStrategy (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/auth-tenant/strategies/jwt-tenant-user.strategy.ts
//
// Descrição: Estratégia JWT stateless para usuários de tenant. Valida a
// assinatura do token e anexa o payload à requisição.
//
// Versão: 1.2
// =============================================================================

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtTenantUserPayload } from '@/types/jwt/jwt-tenant-user-payload.interface';

@Injectable()
export class JwtTenantUserStrategy extends PassportStrategy(
  Strategy,
  'jwt-tenant-user',
) {
  private readonly logger = new Logger(JwtTenantUserStrategy.name);

  constructor(configService: ConfigService) {
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: configService.get<string>('JWT_SECRET')!, // ✅ Adicionamos '!' aqui
  });
}

  /**
   * Valida o payload do JWT e o retorna como `req.user`.
   */
  async validate(payload: JwtTenantUserPayload): Promise<JwtTenantUserPayload> {
    // Validação de segurança para garantir a integridade do payload.
    if (
      !payload?.sub ||
      !payload?.email ||
      !payload?.role ||
      !payload?.tenantId ||
      !payload?.schema
    ) {
      this.logger.warn(
        `Payload JWT de tenant inválido recebido: ${JSON.stringify(payload)}`,
      );
      throw new UnauthorizedException('Token JWT inválido ou malformado.');
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(
        `Usuário de Tenant autenticado via JWT: ${payload.email} para o tenant ${payload.tenantId}`,
      );
    }

    return payload;
  }
}
