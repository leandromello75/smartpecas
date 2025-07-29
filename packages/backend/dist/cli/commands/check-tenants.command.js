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
var CheckTenantsCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckTenantsCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CheckTenantsCommand = CheckTenantsCommand_1 = class CheckTenantsCommand extends nest_commander_1.CommandRunner {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.logger = new common_1.Logger(CheckTenantsCommand_1.name);
    }
    async run() {
        this.logger.log('🔍 Iniciando verificação de tenants ativos no esquema unificado...');
        let tenants;
        try {
            tenants = await this.prisma.tenant.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    billingStatus: true,
                    isActive: true,
                },
            });
            if (tenants.length === 0) {
                this.logger.warn('Nenhum tenant ativo encontrado no sistema.');
                return;
            }
        }
        catch (err) {
            this.logger.error(`❌ Falha ao buscar tenants ativos no DB principal: ${err.message}`, err.stack);
            process.exit(1);
        }
        let success = 0;
        let fail = 0;
        for (const tenant of tenants) {
            if (!tenant.isActive) {
                this.logger.verbose(`Tenant '${tenant.name}' (${tenant.id}) está inativo, pulando verificação.`);
                continue;
            }
            const start = process.hrtime.bigint();
            try {
                const tenantPrisma = this.prisma.getTenantClient(tenant.id);
                await tenantPrisma.cliente.count({ where: { tenantId: tenant.id } });
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1_000_000;
                this.logger.log(`✅ Tenant '${tenant.name}' (${tenant.id}) OK. Status Faturamento: ${tenant.billingStatus}. Simulação em ${durationMs.toFixed(2)}ms`);
                success++;
            }
            catch (err) {
                this.logger.error(`❌ Falha na simulação de acesso para o tenant '${tenant.name}' (${tenant.id}): ${err.message}`, err.stack);
                fail++;
            }
        }
        this.logger.log(`\n📊 Resultado da verificação de tenants: Sucesso: ${success} | Falhas: ${fail} | Total: ${success + fail}`);
        if (fail > 0) {
            process.exit(1);
        }
        else {
            process.exit(0);
        }
    }
};
exports.CheckTenantsCommand = CheckTenantsCommand;
exports.CheckTenantsCommand = CheckTenantsCommand = CheckTenantsCommand_1 = __decorate([
    (0, nest_commander_1.Command)({
        name: 'tenant:check',
        description: 'Verifica a acessibilidade e integridade dos tenants ativos no esquema unificado.',
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CheckTenantsCommand);
//# sourceMappingURL=check-tenants.command.js.map