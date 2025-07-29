import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { Request, Response } from 'express';
import { LoginRateLimiterService } from './login-rate-limiter.service';
export declare class AuthController {
    private authService;
    private loginRateLimiterService;
    private readonly logger;
    constructor(authService: AuthService, loginRateLimiterService: LoginRateLimiterService);
    loginAdmin(loginAdminDto: LoginAdminDto, req: Request, res: Response): Promise<{
        access_token: string;
        expires_in: number;
        token_type: string;
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    }>;
}
