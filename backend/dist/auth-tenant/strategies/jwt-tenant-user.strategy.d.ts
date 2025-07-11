import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTenantUserPayload } from '@/types/jwt/jwt-tenant-user-payload.interface';
declare const JwtTenantUserStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtTenantUserStrategy extends JwtTenantUserStrategy_base {
    private readonly logger;
    constructor(configService: ConfigService);
    validate(payload: JwtTenantUserPayload): Promise<JwtTenantUserPayload>;
}
export {};
