import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAdminPayload } from '@/types/jwt/jwt-admin-payload.interface';
declare const JwtAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtAdminStrategy extends JwtAdminStrategy_base {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    validate(payload: JwtAdminPayload): Promise<JwtAdminPayload>;
}
export {};
