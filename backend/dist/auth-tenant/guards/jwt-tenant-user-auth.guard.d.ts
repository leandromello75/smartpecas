import { ExecutionContext } from '@nestjs/common';
declare const JwtTenantUserAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtTenantUserAuthGuard extends JwtTenantUserAuthGuard_base {
    private readonly logger;
    handleRequest(err: any, user: any, _info: any, _context: ExecutionContext): any;
}
export {};
