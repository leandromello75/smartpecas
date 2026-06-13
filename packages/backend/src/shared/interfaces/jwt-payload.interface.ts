export interface JwtAdminPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
  name: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface JwtTenantUserPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  name?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}
