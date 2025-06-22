import { AuthTenantService } from './services/auth-tenant.service';
export declare class AuthTenantController {
    private readonly authTenantService;
    private readonly logger;
    constructor(authTenantService: AuthTenantService);
    login(req: any): Promise<any>;
}
