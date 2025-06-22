// =============================================================================
// SmartPeças ERP - JwtAdminPayload Interface
// =============================================================================
// Arquivo: backend/src/types/jwt/jwt-admin-payload.interface.ts
//
// Descrição: Define a estrutura de dados (payload) que é encodada e
// decodificada de um token JWT para um AdminUser.
//
// Versão: 1.1
// =============================================================================

export interface JwtAdminPayload {
  /**
   * O ID do AdminUser (campo 'sub' padrão do JWT).
   */
  sub: string;

  /**
   * O email do AdminUser, utilizado para exibição e validação.
   */
  email: string;

  /**
   * A função do administrador, por exemplo: 'admin', 'super_admin'.
   * Pode ser null se o campo ainda não estiver definido.
   */
  role: string | null;

  /**
   * ID do tenant ao qual o administrador está vinculado.
   * Se o AdminUser for global (sem tenant), esse campo poderá ser ignorado no futuro.
   */
  tenantId: string;
}
