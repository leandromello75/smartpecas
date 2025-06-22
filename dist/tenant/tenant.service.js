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
var TenantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let TenantService = TenantService_1 = class TenantService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TenantService_1.name);
    }
    async create(createTenantDto) {
        const { cnpj, email, name, adminName, password, ...rest } = createTenantDto;
        const schema = `tenant_${this.generateSlug(name || cnpj)}_${this.generateUniqueSuffix()}`;
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
                        schema,
                        isActive: true,
                        ...rest,
                    },
                });
                this.logger.log(`Tenant '${name}' criado no schema público.`);
                await this.prisma.createTenantSchema(schema);
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
                this.logger.log(`AdminUser criado para tenant '${schema}'`);
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