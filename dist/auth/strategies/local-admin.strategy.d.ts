import { AuthService } from '../auth.service';
import { Prisma } from '@prisma/client';
declare const LocalAdminStrategy_base: new (...args: any[]) => any;
export declare class LocalAdminStrategy extends LocalAdminStrategy_base {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<Omit<AdminUserUser, 'password'>>;
}
export {};
