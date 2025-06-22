import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtTenantUserPayload } from '../interfaces/jwt-tenant-user-payload.interface';
import { Prisma } from '@prisma/client';
declare const JwtTenantUserStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtTenantUserStrategy extends JwtTenantUserStrategy_base {
    private readonly configService;
    private readonly prismaService;
    private readonly logger;
    constructor(configService: ConfigService, prismaService: PrismaService);
    validate(payload: JwtTenantUserPayload): Promise<Omit<User, 'password'>>;
}
export {};
