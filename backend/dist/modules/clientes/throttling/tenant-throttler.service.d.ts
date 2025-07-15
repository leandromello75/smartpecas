import { Cache } from 'cache-manager';
export declare class TenantThrottlerService {
    private cacheManager;
    private readonly logger;
    private readonly limits;
    constructor(cacheManager: Cache);
    checkLimit(tenantId: string, operation: keyof typeof this.limits): Promise<void>;
}
