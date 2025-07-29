import { AdminUser } from '@prisma/client';
declare const LocalAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class LocalAuthGuard extends LocalAuthGuard_base {
    private readonly logger;
    handleRequest<TUser = AdminUser>(err: any, user: TUser, info: any): TUser;
}
export {};
