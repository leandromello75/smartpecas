import { AuthTenantService } from './auth-tenant.service';
import { Request as ExpressRequest } from 'express';
export declare class AuthTenantController {
    private readonly authTenantService;
    private readonly logger;
    constructor(authTenantService: AuthTenantService);
    login(req: ExpressRequest): Promise<{
        access_token: string;
    }>;
}
