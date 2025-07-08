// =============================================================================
// SmartPeças ERP - Interface de Payload JWT para Admin e Usuários
// =============================================================================
// Arquivo: backend/src/shared/interfaces/jwt-payload.interface.ts
//
// Descrição: Define a estrutura do payload de um token JWT para administradores
// e usuários comuns do sistema.
//
// Versão: 1.1.2
// Equipe SmartPeças
// Atualizado em: 07/07/2025 (Corrigido em 08/07/2025)
// =============================================================================

// CORREÇÃO: Caminho relativo corrigido para o PrismaClient gerado
import { Role } from '../../generated/prisma-client';

/**
 * Payload para o token JWT de um administrador do sistema.
 */
export interface JwtAdminPayload {
  sub: string;       // ID do admin (subject)
  email: string;
  role: Role;        // Papel do admin (ADMIN, USER, etc.)
  tenantId: string | null;  // Pode ser string ou null, conforme DB e uso
  name: string | null;     // Pode ser string ou null
  ip: string | null;       // Pode ser string ou null
}

/**
 * Payload para o token JWT de um usuário comum de tenant.
 */
export interface JwtTenantUserPayload {
  sub: string;       // ID do usuário
  email: string;
  tenantId: string;  // Assumindo que tenantId nunca é null para usuário comum
  role: Role;        // Papel do usuário
  name?: string | null;
  ip?: string | null;
}