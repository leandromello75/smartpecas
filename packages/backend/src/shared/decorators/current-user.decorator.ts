// =============================================================================
// SmartPeças ERP - Decorator - Usuário Atual
// =============================================================================
// Arquivo: src/shared/decorators/current-user.decorator.ts
//
// Descrição: Decorador de parâmetro customizado para extrair e injetar
// o objeto 'user' (decodificado do token JWT) diretamente nos métodos do controller.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtTenantUserPayload } from '../interfaces/jwt-payload.interface'; // Ajuste o caminho se necessário

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtTenantUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);