import { Role } from '../../generated/prisma-client';
export interface JwtAdminPayload {
    sub: string;
    email: string;
    role: Role;
    tenantId: string | null;
    name: string | null;
    ip: string | null;
}
export interface JwtTenantUserPayload {
    sub: string;
    email: string;
    tenantId: string;
    role: Role;
    name?: string | null;
    ip?: string | null;
}
