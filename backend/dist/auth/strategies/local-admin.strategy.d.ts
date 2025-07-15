import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AdminUser } from '../../generated/prisma-client';
declare const LocalAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalAdminStrategy extends LocalAdminStrategy_base {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    validate(email: string, password_plain: string): Promise<Omit<AdminUser, 'password'> | null>;
}
export {};
