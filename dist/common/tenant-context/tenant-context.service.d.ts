export interface TenantContext {
    id: string;
    schema: string;
    name!: string;
    cnpj: string;
    email!: string;
    billingStatus: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
}
export declare class TenantContextService {
    private readonly logger;
    private readonly asyncLocalStorage;
    setTenant(tenantContext: TenantContext): void;
    getTenantContext(): TenantContext;
    get tenantId(): string | undefined;
    get tenantschema(): string | undefined;
    get billingStatus(): 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | undefined;
    disable(): void;
}
