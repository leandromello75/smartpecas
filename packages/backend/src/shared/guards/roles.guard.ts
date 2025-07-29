// =============================================================================
// SmartPeças ERP - Guard - Autorização por Roles (Cargos)
// =============================================================================
// Arquivo: src/shared/guards/roles.guard.ts
//
// Descrição: Guardião que verifica se o usuário autenticado possui algum dos
// cargos (roles) definidos pelo decorador @Roles para acessar uma rota.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se a rota não exige nenhum cargo, permite o acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Verifica se o array de cargos do usuário inclui algum dos cargos requeridos
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}