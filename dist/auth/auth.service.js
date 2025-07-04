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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateAdminUser(email, password_plain) {
        this.logger.debug(`Validando adminUser: ${email}`);
        const adminUser = await this.prisma.adminUser.findUnique({
            where: { email },
            include: { tenant: true },
        });
        if (!adminUser || !adminUser.isActive) {
            this.logger.warn(`Login falhou para '${email}': usuário não encontrado ou inativo.`);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        if (!adminUser.tenant || adminUser.tenant.billingStatus !== 'ACTIVE') {
            this.logger.warn(`Login bloqueado para '${email}': tenant suspenso ou inadimplente.`);
            throw new common_1.ForbiddenException('O acesso está suspenso devido à situação de pagamento do cliente.');
        }
        const isPasswordValid = await bcrypt.compare(password_plain, adminUser.password);
        if (!isPasswordValid) {
            this.logger.warn(`Login falhou para '${email}': senha inválida.`);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        const { password, ...safeUser } = adminUser;
        return safeUser;
    }
    async loginAdmin(adminUser) {
        this.logger.debug(`Gerando JWT para adminUser: ${adminUser.email}`);
        const payload = {
            sub: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            tenantId: adminUser.tenantId || undefined,
        };
        const token = this.jwtService.sign(payload);
        return { access_token: token };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map