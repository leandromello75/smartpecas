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
        this.logger.log('🔍 Iniciando verificação de schemas de tenants...');
        const tenants = await this.prisma.getActiveTenants();
        let success = 0;
        let fail = 0;
        for (const tenant of tenants) {
            try {
                const client = await this.prisma.getTenantClient(tenant.schema);
                const res = await client.$queryRawUnsafe(`SELECT 1;`);
                this.logger.log(`✅ Tenant '${tenant.name}' conectado com sucesso. Schema: ${tenant.schema}`);
                success++;
            }
            catch (err) {
                this.logger.error(`❌ Falha na conexão do tenant '${tenant.name}' (${tenant.schema}): ${err.message}`);
                fail++;
            }
        }
        this.logger.log(`\n📊 Resultado: Sucesso: ${success} | Falhas: ${fail} | Total: ${success + fail}`);
    }
};
exports.CheckTenantsCommand = CheckTenantsCommand;
exports.CheckTenantsCommand = CheckTenantsCommand = CheckTenantsCommand_1 = __decorate([
    (0, nest_commander_1.Command)({
        name: 'tenant:check',
        description: 'Verifica a conectividade e integridade mínima dos tenants ativos',
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CheckTenantsCommand);
//# sourceMappingURL=check-tenants.command.js.map