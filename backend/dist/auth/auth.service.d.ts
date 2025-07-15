import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUser } from '../generated/prisma-client';
import { LoginRateLimiterService } from './login-rate-limiter.service';
type AdminUserWithTenant = AdminUser & {
    tenant: {
        id: string;
        billingStatus: string;
        isActive: boolean;
    } | null;
};
export declare class AuthService {
    private prisma;
    private jwtService;
    private loginRateLimiterService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, loginRateLimiterService: LoginRateLimiterService);
    validateCredentials(email: string, password_plain: string): Promise<Omit<AdminUserWithTenant, 'password'> | null>;
    validateAndLoginAdmin(email: string, password_plain: string, ip: string): Promise<{
        access_token: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    }>;
    private verificarStatusTenant;
}
export {};
