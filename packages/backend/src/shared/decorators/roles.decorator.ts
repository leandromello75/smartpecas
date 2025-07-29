// =============================================================================
// SmartPeças ERP - Decorator - Roles (Cargos)
// =============================================================================
// Arquivo: src/shared/decorators/roles.decorator.ts
//
// Descrição: Decorador para definir metadados de 'roles' (cargos) em rotas,
// utilizado pelo RolesGuard para autorização baseada em cargos.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Atualizado em: 16/07/2025
// =============================================================================

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);