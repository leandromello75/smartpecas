import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUser } from '../../generated/prisma-client';
import { JwtAdminPayload } from '../../shared/interfaces/jwt-payload.interface';
export type SafeAdminUser = Omit<AdminUser, 'password'> & {
    tenant: {
        id: string;
        billingStatus: string;
        isActive: boolean;
    };
};
declare const JwtAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtAdminStrategy extends JwtAdminStrategy_base {
    private prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtAdminPayload): Promise<SafeAdminUser>;
}
export {};
