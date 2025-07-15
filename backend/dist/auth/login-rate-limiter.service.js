"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LoginRateLimiterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
let LoginRateLimiterService = LoginRateLimiterService_1 = class LoginRateLimiterService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(LoginRateLimiterService_1.name);
        this.MAX_ATTEMPTS = 5;
        this.LOCK_TIME_SECONDS = 300;
        this.ATTEMPT_WINDOW_SECONDS = 600;
    }
    async checkAttempts(email, ip) {
        const emailKey = `login_failed:${email}`;
        const ipKey = `login_failed_ip:${ip}`;
        const emailLockedKey = `login_locked:${email}`;
        const ipLockedKey = `login_locked_ip:${ip}`;
        const isEmailLocked = await this.cacheManager.get(emailLockedKey);
        const isIpLocked = await this.cacheManager.get(ipLockedKey);
        if (isEmailLocked || isIpLocked) {
            this.logger.warn(`Tentativa de login bloqueada para email: ${email}, IP: ${ip} (bloqueado por ${isEmailLocked ? 'email' : 'IP'})`);
            throw new throttler_1.ThrottlerException('Muitas tentativas de login. Tente novamente mais tarde.');
        }
        const emailAttempts = (await this.cacheManager.get(emailKey)) ?? 0;
        const ipAttempts = (await this.cacheManager.get(ipKey)) ?? 0;
        if (emailAttempts >= this.MAX_ATTEMPTS || ipAttempts >= this.MAX_ATTEMPTS) {
            await this.cacheManager.set(emailLockedKey, true, this.LOCK_TIME_SECONDS);
            await this.cacheManager.set(ipLockedKey, true, this.LOCK_TIME_SECONDS);
            this.logger.error(`Bloqueio de login ativado para email: ${email}, IP: ${ip}.`);
            throw new throttler_1.ThrottlerException('Muitas tentativas de login. Sua conta foi temporariamente bloqueada.');
        }
    }
    async recordFailedAttempt(email, ip) {
        const emailKey = `login_failed:${email}`;
        const ipKey = `login_failed_ip:${ip}`;
        const currentEmailAttempts = (await this.cacheManager.get(emailKey)) ?? 0;
        await this.cacheManager.set(emailKey, currentEmailAttempts + 1, this.ATTEMPT_WINDOW_SECONDS);
        const currentIpAttempts = (await this.cacheManager.get(ipKey)) ?? 0;
        await this.cacheManager.set(ipKey, currentIpAttempts + 1, this.ATTEMPT_WINDOW_SECONDS);
        this.logger.warn(`Tentativa falha registrada para email: ${email}, IP: ${ip}. E-mail tentativas: ${currentEmailAttempts + 1}, IP tentativas: ${currentIpAttempts + 1}`);
    }
    async resetAttempts(email, ip) {
        const emailKey = `login_failed:${email}`;
        const ipKey = `login_failed_ip:${ip}`;
        await this.cacheManager.del(emailKey);
        await this.cacheManager.del(ipKey);
        await this.cacheManager.del(`login_locked:${email}`);
        await this.cacheManager.del(`login_locked_ip:${ip}`);
        this.logger.verbose(`Contadores de login resetados para email: ${email}, IP: ${ip}.`);
    }
};
exports.LoginRateLimiterService = LoginRateLimiterService;
exports.LoginRateLimiterService = LoginRateLimiterService = LoginRateLimiterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], LoginRateLimiterService);
//# sourceMappingURL=login-rate-limiter.service.js.map