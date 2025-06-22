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
    constructor() {
        super({
            log: ['query', 'warn', 'error'],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.tenantClients = new Map();
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
            select: { id: true, name: true, schema: true, isActive: true },
        });
    }
    async getTenantByschema(schema) {
        return this.tenant.findUnique({
            where: { schema },
            select: { id: true, name: true, schema: true, isActive: true },
        });
    }
    async getActiveTenants() {
        return this.tenant.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                schema: true,
                cnpj: true,
                email: true,
                createdAt: true,
            },
        });
    }
    async getTenantClient(schema) {
        if (!schema)
            throw new Error('Schema URL do tenant não informado.');
        if (this.tenantClients.has(schema)) {
            this.logger.debug(`Cliente em cache para schema: ${schema}`);
            return this.tenantClients.get(schema);
        }
        const dbUrl = this.buildTenantDatabaseUrl(schema);
        const client = new client_1.PrismaClient({
            datasources: { db: { url: dbUrl } },
            log: ['error', 'warn'],
        });
        try {
            await client.$connect();
            this.tenantClients.set(schema, client);
            this.logger.log(`Novo cliente conectado para schema: ${schema}`);
            return client;
        }
        catch (err) {
            this.logger.error(`Erro ao conectar no schema '${schema}':`, err.stack);
            throw err;
        }
    }
    buildTenantDatabaseUrl(schema) {
        const base = process.env.DATABASE_URL_BASE;
        if (!base)
            throw new Error('DATABASE_URL_BASE não está definida no .env.');
        return `${base}?options=-c%20search_path%3D"${schema}"`;
    }
    getConnectionStats() {
        return {
            total: this.tenantClients.size,
            schemas: Array.from(this.tenantClients.keys()),
        };
    }
    async cleanupInactiveConnections() {
        const activeSchemas = new Set((await this.getActiveTenants()).map(t => t.schema));
        for (const [schema, client] of this.tenantClients.entries()) {
            if (!activeSchemas.has(schema)) {
                await client.$disconnect();
                this.tenantClients.delete(schema);
                this.logger.log(`Removida conexão inativa: ${schema}`);
            }
        }
    }
    async createTenantSchema(schema) {
        if (!schema)
            throw new Error('Schema inválido.');
        try {
            await this.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
            this.logger.log(`Schema '${schema}' criado com sucesso.`);
            await this.runTenantMigrations(schema);
            this.logger.log(`Migrações aplicadas no schema '${schema}'.`);
        }
        catch (error) {
            this.logger.error(`Erro ao criar schema '${schema}':`, error.stack);
            await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
            throw error;
        }
    }
    async dropTenantSchema(schema) {
        if (!schema || ['public', 'information_schema'].includes(schema) || schema.startsWith('pg_')) {
            throw new Error('Tentativa de remover schema protegido.');
        }
        if (this.tenantClients.has(schema)) {
            await this.tenantClients.get(schema)?.$disconnect();
            this.tenantClients.delete(schema);
        }
        await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        this.logger.log(`Schema '${schema}' removido com sucesso.`);
    }
    async runTenantMigrations(schema) {
        this.logger.log(`Iniciando migrações para '${schema}'...`);
        const base = process.env.DATABASE_URL_BASE;
        if (!base)
            throw new Error('DATABASE_URL_BASE não configurada.');
        const url = `${base}?options=-c%20search_path%3D"${schema}"`;
        const originalUrl = process.env.DATABASE_URL;
        try {
            process.env.DATABASE_URL = url;
            const { stdout, stderr } = await execAsync(`npx prisma migrate deploy --schema=./prisma/schema.prisma`);
            this.logger.log(`stdout: ${stdout}`);
            if (stderr)
                this.logger.warn(`stderr: ${stderr}`);
        }
        catch (err) {
            this.logger.error(`Erro ao migrar schema '${schema}':`, err.stderr || err.message);
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
                const client = await this.getTenantClient(tenant.schema);
                const result = await operation(client, tenant);
                results.push({ tenant, result });
            }
            catch (err) {
                this.logger.error(`Erro no tenant '${tenant.schema}':`, err.message);
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