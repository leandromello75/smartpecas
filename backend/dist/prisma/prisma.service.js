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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const util_1 = require("util");
const client_1 = require("@prisma/client");
const tenant_client_1 = require("../generated/tenant-client/index.js");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        super({
            log: ['warn', 'error'],
        });
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.tenantClients = new Map();
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Prisma (cliente público) conectado com sucesso.');
    }
    async onModuleDestroy() {
        await this.$disconnect();
        for (const client of this.tenantClients.values()) {
            await client.$disconnect();
        }
        this.logger.log('Todas as conexões Prisma foram encerradas.');
    }
    async getTenantClient(schemaUrl) {
        if (!schemaUrl)
            throw new Error('Schema do tenant não informado.');
        if (this.tenantClients.has(schemaUrl)) {
            return this.tenantClients.get(schemaUrl);
        }
        const dbUrl = this.buildTenantDatabaseUrl(schemaUrl);
        const client = new tenant_client_1.PrismaClient({
            datasources: { db: { url: dbUrl } },
        });
        await client.$connect();
        this.tenantClients.set(schemaUrl, client);
        this.logger.log(`Nova conexão Prisma estabelecida para o schema: ${schemaUrl}`);
        return client;
    }
    buildTenantDatabaseUrl(schemaUrl) {
        const baseUrl = this.configService.get('DATABASE_URL');
        if (!baseUrl)
            throw new Error('DATABASE_URL não está definida no .env.');
        const url = new URL(baseUrl);
        url.searchParams.set('schema', schemaUrl);
        return url.toString();
    }
    async createTenantSchema(schemaUrl) {
        if (!schemaUrl)
            throw new Error('Schema inválido.');
        await this.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaUrl}"`);
        this.logger.log(`Schema '${schemaUrl}' criado com sucesso.`);
        await this.runTenantMigrations(schemaUrl);
    }
    async runTenantMigrations(schemaUrl) {
        const databaseUrl = this.buildTenantDatabaseUrl(schemaUrl);
        const command = `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy --schema=./prisma/tenant.prisma`;
        try {
            this.logger.log(`Executando migrações para o schema '${schemaUrl}'...`);
            const { stdout, stderr } = await execAsync(command);
            if (stdout)
                this.logger.log(`Migrações [${schemaUrl}] stdout: ${stdout}`);
            if (stderr)
                this.logger.warn(`Migrações [${schemaUrl}] stderr: ${stderr}`);
        }
        catch (error) {
            this.logger.error(`Falha ao migrar schema '${schemaUrl}':`, error);
            await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaUrl}" CASCADE`);
            throw new common_1.InternalServerErrorException(`Não foi possível migrar o banco de dados do tenant.`);
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map