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
var TenantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let TenantService = TenantService_1 = class TenantService {
    prisma;
    logger = new common_1.Logger(TenantService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTenantDto) {
        const { cnpj, email, name, adminName, password, ...rest } = createTenantDto;
        const schemaUrl = `tenant_${this.generateSlug(name || cnpj)}_${this.generateUniqueSuffix()}`;
        const existingTenant = await this.prisma.tenant.findFirst({
            where: {
                OR: [{ cnpj }, { name }],
            },
        });
        if (existingTenant) {
            if (existingTenant.cnpj === cnpj) {
                throw new common_1.ConflictException(`Um inquilino com o CNPJ '${cnpj}' já existe.`);
            }
            if (existingTenant.name === name) {
                throw new common_1.ConflictException(`Um inquilino com o nome '${name}' já existe.`);
            }
        }
        const existingAdminUser = await this.prisma.adminUser.findUnique({
            where: { email },
        });
        if (existingAdminUser) {
            throw new common_1.ConflictException(`Um usuário administrador global com o e-mail '${email}' já existe.`);
        }
        try {
            const tenant = await this.prisma.$transaction(async (prismaTx) => {
                const createdTenant = await prismaTx.tenant.create({
                    data: {
                        name,
                        cnpj,
                        email,
                        schemaUrl,
                        isActive: true,
                        ...rest,
                    },
                });
                this.logger.log(`Tenant '${name}' criado no schema público.`);
                await this.prisma.createTenantSchema(schemaUrl);
                const hashedPassword = await bcrypt.hash(password, 10);
                await prismaTx.adminUser.create({
                    data: {
                        name: adminName,
                        email,
                        password: hashedPassword,
                        tenantId: createdTenant.id,
                        role: 'tenant_admin',
                    },
                });
                this.logger.log(`AdminUser criado para tenant '${schemaUrl}'`);
                return createdTenant;
            });
            return tenant;
        }
        catch (error) {
            this.logger.error(`Erro ao criar tenant '${name}':`, error.stack);
            throw new common_1.InternalServerErrorException(`Erro ao criar o tenant '${name}': ${error.message}`);
        }
    }
    async findOne(id) {
        const tenant = await this.prisma.getTenantById(id);
        if (!tenant) {
            throw new common_1.NotFoundException(`Inquilino com ID '${id}' não encontrado.`);
        }
        return tenant;
    }
    async findAll() {
        return this.prisma.getActiveTenants();
    }
    generateSlug(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '_');
    }
    generateUniqueSuffix() {
        return `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = TenantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map