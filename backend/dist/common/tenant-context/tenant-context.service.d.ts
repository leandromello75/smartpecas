export interface TenantContext {
    id: string;
    schemaUrl: string;
    name: string;
    cnpj: string | null;
    isActive: boolean;
    billingStatus: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
}
export declare class TenantContextService {
    private readonly logger;
    private readonly asyncLocalStorage;
    run<R>(context: TenantContext, fn: () => R): R;
    getTenantContext(): TenantContext;
    get tenantId(): string;
    get tenantSchemaUrl(): string;
    get billingStatus(): 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
}
