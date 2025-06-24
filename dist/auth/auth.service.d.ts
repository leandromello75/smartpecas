import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateAdminUser(email: string, password_plain: string): Promise<Omit<AdminUserUser, 'password'>>;
    loginAdmin(adminUser: Omit<AdminUserUser, 'password'>): Promise<{
        access_token: string;
    }>;
}
