import { Cache } from 'cache-manager';
export declare class LoginRateLimiterService {
    private cacheManager;
    private readonly logger;
    private readonly MAX_ATTEMPTS;
    private readonly LOCK_TIME_SECONDS;
    private readonly ATTEMPT_WINDOW_SECONDS;
    constructor(cacheManager: Cache);
    checkAttempts(email: string, ip: string): Promise<void>;
    recordFailedAttempt(email: string, ip: string): Promise<void>;
    resetAttempts(email: string, ip: string): Promise<void>;
}
