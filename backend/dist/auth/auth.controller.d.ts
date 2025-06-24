import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    loginAdmin(req: Request, res: Response): Promise<{
        access_token: string;
    }>;
}
