import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUser } from '@/public-client';
import { JwtAdminPayload } from '@/types/jwt/jwt-admin-payload.interface';
declare const JwtAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtAdminStrategy extends JwtAdminStrategy_base {
    private prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtAdminPayload): Promise<Omit<AdminUser, 'password'>>;
}
export {};
