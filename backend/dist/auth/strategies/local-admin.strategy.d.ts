import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AdminUser } from '@/public-client';
declare const LocalAdminStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalAdminStrategy extends LocalAdminStrategy_base {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<Omit<AdminUser, 'password'>>;
}
export {};
