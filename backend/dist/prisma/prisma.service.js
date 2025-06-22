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
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    tenantClients = new Map();
    constructor() {
        super({
            log: ['query', 'warn', 'error'],
        });
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Prisma conectado ao schema público.');
    }
    async onModuleDestroy() {
        for (const [schema, client] of this.tenantClients) {
            await client.$disconnect();
            this.logger.log(`Desconectado do schema: ${schema}`);
        }
        await this.$disconnect();
        this.logger.log('Desconectado do schema público.');
    }
    async enableShutdownHooks(app) {
        this.$on('beforeExit', async () => await app.close());
    }
    async getTenantById(tenantId) {
        return this.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, schemaUrl: true, isActive: true },
        });
    }
    async getTenantBySchemaUrl(schemaUrl) {
        return this.tenant.findUnique({
            where: { schemaUrl },
            select: { id: true, name: true, schemaUrl: true, isActive: true },
        });
    }
    async getActiveTenants() {
        return this.tenant.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                schemaUrl: true,
                cnpj: true,
                email: true,
                createdAt: true,
            },
        });
    }
    async getTenantClient(schemaUrl) {
        if (!schemaUrl)
            throw new Error('Schema URL do tenant não informado.');
        if (this.tenantClients.has(schemaUrl)) {
            this.logger.debug(`Cliente em cache para schema: ${schemaUrl}`);
            return this.tenantClients.get(schemaUrl);
        }
        const dbUrl = this.buildTenantDatabaseUrl(schemaUrl);
        const client = new client_1.PrismaClient({
            datasources: { db: { url: dbUrl } },
            log: ['error', 'warn'],
        });
        try {
            await client.$connect();
            this.tenantClients.set(schemaUrl, client);
            this.logger.log(`Novo cliente conectado para schema: ${schemaUrl}`);
            return client;
        }
        catch (err) {
            this.logger.error(`Erro ao conectar no schema '${schemaUrl}':`, err.stack);
            throw err;
        }
    }
    buildTenantDatabaseUrl(schemaUrl) {
        const base = process.env.DATABASE_URL_BASE;
        if (!base)
            throw new Error('DATABASE_URL_BASE não está definida no .env.');
        return `${base}?options=-c%20search_path%3D"${schemaUrl}"`;
    }
    getConnectionStats() {
        return {
            total: this.tenantClients.size,
            schemas: Array.from(this.tenantClients.keys()),
        };
    }
    async cleanupInactiveConnections() {
        const activeSchemas = new Set((await this.getActiveTenants()).map(t => t.schemaUrl));
        for (const [schemaUrl, client] of this.tenantClients.entries()) {
            if (!activeSchemas.has(schemaUrl)) {
                await client.$disconnect();
                this.tenantClients.delete(schemaUrl);
                this.logger.log(`Removida conexão inativa: ${schemaUrl}`);
            }
        }
    }
    async createTenantSchema(schemaUrl) {
        if (!schemaUrl)
            throw new Error('Schema inválido.');
        try {
            await this.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaUrl}"`);
            this.logger.log(`Schema '${schemaUrl}' criado com sucesso.`);
            await this.runTenantMigrations(schemaUrl);
            this.logger.log(`Migrações aplicadas no schema '${schemaUrl}'.`);
        }
        catch (error) {
            this.logger.error(`Erro ao criar schema '${schemaUrl}':`, error.stack);
            await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaUrl}" CASCADE`);
            throw error;
        }
    }
    async dropTenantSchema(schemaUrl) {
        if (!schemaUrl || ['public', 'information_schema'].includes(schemaUrl) || schemaUrl.startsWith('pg_')) {
            throw new Error('Tentativa de remover schema protegido.');
        }
        if (this.tenantClients.has(schemaUrl)) {
            await this.tenantClients.get(schemaUrl)?.$disconnect();
            this.tenantClients.delete(schemaUrl);
        }
        await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaUrl}" CASCADE`);
        this.logger.log(`Schema '${schemaUrl}' removido com sucesso.`);
    }
    async runTenantMigrations(schemaUrl) {
        this.logger.log(`Iniciando migrações para '${schemaUrl}'...`);
        const base = process.env.DATABASE_URL_BASE;
        if (!base)
            throw new Error('DATABASE_URL_BASE não configurada.');
        const url = `${base}?options=-c%20search_path%3D"${schemaUrl}"`;
        const originalUrl = process.env.DATABASE_URL;
        try {
            process.env.DATABASE_URL = url;
            const { stdout, stderr } = await execAsync(`npx prisma migrate deploy --schema=./prisma/schema.prisma`);
            this.logger.log(`stdout: ${stdout}`);
            if (stderr)
                this.logger.warn(`stderr: ${stderr}`);
        }
        catch (err) {
            this.logger.error(`Erro ao migrar schema '${schemaUrl}':`, err.stderr || err.message);
            throw err;
        }
        finally {
            process.env.DATABASE_URL = originalUrl;
        }
    }
    async executeOnAllTenants(operation) {
        const tenants = await this.getActiveTenants();
        const results = [];
        for (const tenant of tenants) {
            try {
                const client = await this.getTenantClient(tenant.schemaUrl);
                const result = await operation(client, tenant);
                results.push({ tenant, result });
            }
            catch (err) {
                this.logger.error(`Erro no tenant '${tenant.schemaUrl}':`, err.message);
                results.push({ tenant, result: null, error: err.message });
            }
        }
        return results;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map