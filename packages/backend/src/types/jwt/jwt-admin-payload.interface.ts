// =============================================================================
// SmartPeças ERP - JwtAdminPayload Interface
// =============================================================================
// Arquivo: backend/src/types/jwt/jwt-admin-payload.interface.ts
//
// Descrição: Define a estrutura de dados (payload) que é encodada e
// decodificada de um token JWT para um AdminUser.
//
// Versão: 1.2
// =============================================================================

export interface JwtAdminPayload {
  sub: string;
  email: string;
  role: string | null;
  tenantId: string;
}