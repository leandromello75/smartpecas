import { JwtService } from '@nestjs/jwt';
import { User } from '@/tenant-client';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthTenantService {
    private readonly jwtService;
    private readonly prisma;
    private readonly tenantContext;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService, tenantContext: TenantContextService);
    validateTenantUser(email: string, plainPassword: string): Promise<Omit<User, 'password'>>;
    loginTenantUser(user: Omit<User, 'password'>): Promise<{
        access_token: string;
    }>;
}
