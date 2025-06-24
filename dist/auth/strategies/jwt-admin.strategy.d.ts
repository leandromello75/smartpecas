import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export interface JwtAdminPayload {
    sub: string;
    email!: string;
    role: string;
    tenantId?: string;
}
declare const JwtAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtAdminStrategy extends JwtAdminStrategy_base {
    private configService;
    private prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtAdminPayload): Promise<Omit<AdminUserUser, 'password'>>;
}
export {};
