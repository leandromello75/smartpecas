export interface JwtAdminPayload {
    sub: string;
    email: string;
    role: string | null;
    tenantId: string;
}
