// backend/src/auth-tenant/interfaces/jwt-tenant-user-payload.interface.ts
// =============================================================================
// SmartPeças ERP - Interface: JwtTenantUserPayload
// =============================================================================
// Arquivo: backend/src/auth-tenant/interfaces/jwt-tenant-user-payload.interface.ts
//
// Descrição: Define a estrutura do payload para tokens JWT emitidos para
// usuários específicos de um inquilino.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 16/06/2025
// =============================================================================

export interface JwtTenantUserPayload {
  sub: string;      // ID do usuário (subject)
  email: string;
  role: string;     // Ex: 'SELLER', 'MANAGER', 'ADMIN' (do tenant)
  tenantId: string; // ID do inquilino (empresa)
  schemaUrl: string; // Nome do schema PostgreSQL para este inquilino
  // Opcional: Adicione quaisquer outras informações que precise no token
  // Ex: 'name', 'companyId', 'permissions', etc.
}
