import { Request } from 'express';
import { TenantContext } from '../tenant-context/tenant-context.service';
export interface RequestWithTenant extends Request {
    tenant: TenantContext;
}
