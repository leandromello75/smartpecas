// =============================================================================
// SmartPeças ERP - Interface de Payload JWT para Admin e Usuários
// =============================================================================
// Arquivo: backend/src/shared/interfaces/jwt-payload.interface.ts
//
// Descrição: Define a estrutura do payload de um token JWT para administradores
// e usuários comuns do sistema.
//
// Versão: 1.1.3
// Equipe SmartPeças
// Atualizado em: 10/07/2025
// =============================================================================

import { Role } from '../../generated/prisma-client'; // Importa o enum Role do Prisma Client unificado

/**
 * Payload para o token JWT de um administrador do sistema.
 */
export interface JwtAdminPayload {
  sub: string;       // ID do admin (subject)
  email: string;
  role: Role;        // Papel do admin (ADMIN, USER, etc.)
  tenantId: string | null;
  name: string | null;
  ip: string | null;
  userAgent: string | null; // CORREÇÃO: Adicionado userAgent (pode ser string ou null)
}

/**
 * Payload para o token JWT de um usuário comum de tenant.
 */
export interface JwtTenantUserPayload {
  sub: string;       // ID do usuário
  email: string;
  tenantId: string;
  role: Role;
  name?: string | null;
  ip?: string | null;
}