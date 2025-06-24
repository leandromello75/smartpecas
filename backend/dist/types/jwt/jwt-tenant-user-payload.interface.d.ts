export interface JwtTenantUserPayload {
    sub: string;
    email: string;
    role: string;
    tenantId: string;
    schema: string;
}
