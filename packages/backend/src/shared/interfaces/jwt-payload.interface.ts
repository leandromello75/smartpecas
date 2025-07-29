// =============================================================================
// SmartPeças ERP - Interface de Payload JWT para Admin e Usuários
// =============================================================================
// Arquivo: backend/src/shared/interfaces/jwt-payload.interface.ts
//
// Descrição: Define a estrutura do payload de um token JWT para administradores
// e usuários comuns do sistema.
//
// Versão: 1.1.4 (Atualizada)
// Equipe SmartPeças
// Atualizado em: 10/07/2025 (Corrigido em 13/07/2025)
// =============================================================================

// CORREÇÃO DEFINITIVA: Caminho relativo corrigido para o PrismaClient gerado
import { Role } from '@prisma/client';

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
  userAgent: string | null; // GARANTIR QUE ESTE CAMPO ESTÁ AQUI
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
  userAgent?: string | null; // CORREÇÃO: Adicionado userAgent (opcional)
}