"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const login_rate_limiter_service_1 = require("./login-rate-limiter.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, loginRateLimiterService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.loginRateLimiterService = loginRateLimiterService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateCredentials(email, password_plain) {
        const adminUser = await this.prisma.adminUser.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
                isActive: true,
                tenantId: true,
                createdAt: true,
                updatedAt: true,
                tenant: {
                    select: {
                        id: true,
                        billingStatus: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!adminUser || !adminUser.isActive) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password_plain, adminUser.password);
        if (!isPasswordValid) {
            return null;
        }
        const { password, ...safeUser } = adminUser;
        return safeUser;
    }
    async validateAndLoginAdmin(email, password_plain, ip, userAgent) {
        this.logger.debug(`Tentativa de login para adminUser: ${email} do IP: ${ip}`);
        await this.loginRateLimiterService.checkAttempts(email, ip);
        const adminUserValidated = await this.validateCredentials(email, password_plain);
        if (!adminUserValidated) {
            this.logger.warn(`Login de admin falhou para '${email}': credenciais inválidas.`);
            await this.loginRateLimiterService.recordFailedAttempt(email, ip);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        await this.verificarStatusTenant(adminUserValidated.tenant);
        const userRoleEnum = adminUserValidated.role;
        if (!Object.values(client_1.Role).includes(userRoleEnum)) {
            this.logger.error(`[SEGURANÇA] Perfil de acesso inválido no DB para '${email}': ${adminUserValidated.role}`);
            throw new common_1.InternalServerErrorException('Configuração de perfil de usuário inválida. Contate o suporte.');
        }
        await this.loginRateLimiterService.resetAttempts(email, ip);
        const payload = {
            sub: adminUserValidated.id,
            email: adminUserValidated.email,
            role: userRoleEnum,
            tenantId: adminUserValidated.tenantId ?? null,
            name: adminUserValidated.name ?? null,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
        };
        const token = this.jwtService.sign(payload);
        const decodedToken = this.jwtService.decode(token);
        const expiresIn = decodedToken.exp ? decodedToken.exp - Math.floor(Date.now() / 1000) : 3600;
        this.logger.debug(`Gerando JWT para adminUser: ${adminUserValidated.email}`);
        return {
            access_token: token,
            expires_in: expiresIn,
            user: {
                id: adminUserValidated.id,
                email: adminUserValidated.email,
                name: adminUserValidated.name,
            },
        };
    }
    async verificarStatusTenant(tenant) {
        if (!tenant || tenant.billingStatus !== 'ACTIVE' || !tenant.isActive) {
            this.logger.warn(`Acesso bloqueado: Tenant com status de faturamento ${tenant?.billingStatus || 'NÃO ENCONTRADO'}.`);
            throw new common_1.ForbiddenException('O acesso à conta está suspenso. Entre em contato com o suporte.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        login_rate_limiter_service_1.LoginRateLimiterService])
], AuthService);
//# sourceMappingURL=auth.service.js.map