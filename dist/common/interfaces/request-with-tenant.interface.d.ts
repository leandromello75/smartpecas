import { TenantContext } from '../tenant-context/tenant-context.service';
declare module 'express' {
    interface Request {
        tenantContext?: TenantContext;
    }
}
