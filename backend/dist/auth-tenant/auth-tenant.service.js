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
var AuthTenantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTenantService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const tenant_context_service_1 = require("../common/tenant-context/tenant-context.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthTenantService = AuthTenantService_1 = class AuthTenantService {
    constructor(jwtService, prisma, tenantContext) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.tenantContext = tenantContext;
        this.logger = new common_1.Logger(AuthTenantService_1.name);
    }
    async validateTenantUser(email, plainPassword) {
        const tenantSchema = this.tenantContext.tenantSchemaUrl;
        if (!tenantSchema) {
            throw new common_1.InternalServerErrorException('Schema do tenant não encontrado no contexto da requisição.');
        }
        const tenantPrisma = await this.prisma.getTenantClient(tenantSchema);
        const user = await tenantPrisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            this.logger.warn(`Tentativa de login falhou para ${email} no schema ${tenantSchema}: Usuário não encontrado ou inativo.`);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        const passwordOk = await bcrypt.compare(plainPassword, user.password);
        if (!passwordOk) {
            this.logger.warn(`Tentativa de login falhou para ${email} no schema ${tenantSchema}: Senha inválida.`);
            throw new common_1.UnauthorizedException('Credenciais inválidas.');
        }
        const { password, ...userSafe } = user;
        return userSafe;
    }
    async loginTenantUser(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };
        const token = this.jwtService.sign(payload);
        return { access_token: token };
    }
};
exports.AuthTenantService = AuthTenantService;
exports.AuthTenantService = AuthTenantService = AuthTenantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        tenant_context_service_1.TenantContextService])
], AuthTenantService);
//# sourceMappingURL=auth-tenant.service.js.map