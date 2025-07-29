import { JwtTenantUserPayload } from '../../shared/interfaces/jwt-payload.interface';
export interface TenantContext {
    tenantId: string;
    user: JwtTenantUserPayload;
}
export declare class TenantContextService {
    private readonly als;
    runWithContext<T>(context: TenantContext, callback: () => T): T;
    getTenantId(): string;
    getUser(): JwtTenantUserPayload;
}
