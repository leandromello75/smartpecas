import { AuthService } from './auth.service';
import { Response } from 'express';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    loginAdmin(req: any, res: Response): Promise<{
        access_token: string;
    }>;
}
