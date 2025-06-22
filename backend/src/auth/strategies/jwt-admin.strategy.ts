// =============================================================================
// SmartPeças ERP - JwtAdminStrategy
// =============================================================================
// Arquivo: backend/src/auth/strategies/jwt-admin.strategy.ts
//
// Descrição: Estratégia JWT para autenticação de administradores globais do
// sistema. Valida o token e carrega o usuário do schema público.
//
// Versão: 2.2
//
// Equipe SmartPeças
// Criado em: 15/06/2025 Altereado: 21/06/2025
// =============================================================================

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAdminPayload } from '@/types/jwt/jwt-admin-payload.interface';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  private readonly logger = new Logger(JwtAdminStrategy.name);

  // ✅ REFINAMENTO: Usando 'private readonly', o padrão do NestJS para injeção.
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // ✅ REFINAMENTO: A validação agora é feita de forma centralizada no ConfigModule,
      // o que torna o construtor mais limpo e a configuração mais robusta.
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload do JWT e o retorna como `req.user`.
   */
  async validate(payload: JwtAdminPayload): Promise<JwtAdminPayload> {
    // Validação de segurança para garantir a integridade do payload.
    if (!payload?.sub || !payload?.email || !payload?.role) {
      this.logger.warn(`Payload JWT inválido recebido: ${JSON.stringify(payload)}`);
      throw new UnauthorizedException('Token JWT inválido ou malformado.');
    }

    // Logging condicional para ambientes de não-produção.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`Admin autenticado via JWT: ${payload.email}`);
    }

    return payload;
  }
}
