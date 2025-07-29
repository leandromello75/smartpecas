declare const AdminAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class AdminAuthGuard extends AdminAuthGuard_base {
    handleRequest(err: any, user: any): any;
}
export {};
