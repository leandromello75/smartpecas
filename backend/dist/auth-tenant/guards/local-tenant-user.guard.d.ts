import { ExecutionContext } from '@nestjs/common';
declare const LocalTenantUserAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class LocalTenantUserAuthGuard extends LocalTenantUserAuthGuard_base {
    private readonly logger;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
}
export {};
