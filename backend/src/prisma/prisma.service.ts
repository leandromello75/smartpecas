// =============================================================================
// SmartPeças ERP - PrismaService Multi-Schema Refatorado
// =============================================================================
// Arquivo: backend/src/prisma/prisma.service.ts
//
// Descrição: Serviço Prisma para multi-tenancy real com PostgreSQL + Prisma.
// Gera instâncias dinâmicas por schema (tenant), cria/destroi schemas, executa
// migrações, e oferece ferramentas para manutenção e consulta centralizada.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly tenantClients = new Map<string, PrismaClient>();

  constructor() {
    super({
      log: ['query', 'warn', 'error'],
    });
  }

  // ============================================================================
  // CICLO DE VIDA
  // ============================================================================

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

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => await app.close());
  }

  // ============================================================================
  // GESTÃO DE TENANTS
  // ============================================================================

  async getTenantById(tenantId: string) {
    return this.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, schemaUrl: true, isActive: true },
    });
  }

  async getTenantBySchemaUrl(schemaUrl: string) {
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

  // ============================================================================
  // MULTI-SCHEMA CLIENTES
  // ============================================================================

  public async getTenantClient(schemaUrl: string): Promise<PrismaClient> {
    if (!schemaUrl) throw new Error('Schema URL do tenant não informado.');

    if (this.tenantClients.has(schemaUrl)) {
      this.logger.debug(`Cliente em cache para schema: ${schemaUrl}`);
      return this.tenantClients.get(schemaUrl)!;
    }

    const dbUrl = this.buildTenantDatabaseUrl(schemaUrl);
    const client = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ['error', 'warn'],
    });

    try {
      await client.$connect();
      this.tenantClients.set(schemaUrl, client);
      this.logger.log(`Novo cliente conectado para schema: ${schemaUrl}`);
      return client;
    } catch (err) {
      this.logger.error(`Erro ao conectar no schema '${schemaUrl}':`, err.stack);
      throw err;
    }
  }

  private buildTenantDatabaseUrl(schemaUrl: string): string {
    const base = process.env.DATABASE_URL_BASE;
    if (!base) throw new Error('DATABASE_URL_BASE não está definida no .env.');
    return `${base}?options=-c%20search_path%3D"${schemaUrl}"`;
  }

  public getConnectionStats() {
    return {
      total: this.tenantClients.size,
      schemas: Array.from(this.tenantClients.keys()),
    };
  }

  public async cleanupInactiveConnections(): Promise<void> {
    const activeSchemas = new Set((await this.getActiveTenants()).map(t => t.schemaUrl));

    for (const [schemaUrl, client] of this.tenantClients.entries()) {
      if (!activeSchemas.has(schemaUrl)) {
        await client.$disconnect();
        this.tenantClients.delete(schemaUrl);
        this.logger.log(`Removida conexão inativa: ${schemaUrl}`);
      }
    }
  }

  // ============================================================================
  // OPERAÇÕES DE SCHEMA (CREATE, MIGRATE, DROP)
  // ============================================================================

  public async createTenantSchema(schemaUrl: string): Promise<void> {
    if (!schemaUrl) throw new Error('Schema inválido.');

    try {
      await this.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaUrl}"`);
      this.logger.log(`Schema '${schemaUrl}' criado com sucesso.`);

      await this.runTenantMigrations(schemaUrl);
      this.logger.log(`Migrações aplicadas no schema '${schemaUrl}'.`);
    } catch (error) {
      this.logger.error(`Erro ao criar schema '${schemaUrl}':`, error.stack);
      await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaUrl}" CASCADE`);
      throw error;
    }
  }

  public async dropTenantSchema(schemaUrl: string): Promise<void> {
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

  private async runTenantMigrations(schemaUrl: string): Promise<void> {
    this.logger.log(`Iniciando migrações para '${schemaUrl}'...`);

    const base = process.env.DATABASE_URL_BASE;
    if (!base) throw new Error('DATABASE_URL_BASE não configurada.');

    const url = `${base}?options=-c%20search_path%3D"${schemaUrl}"`;
    const originalUrl = process.env.DATABASE_URL;

    try {
      process.env.DATABASE_URL = url;
      const { stdout, stderr } = await execAsync(`npx prisma migrate deploy --schema=./prisma/schema.prisma`);
      this.logger.log(`stdout: ${stdout}`);
      if (stderr) this.logger.warn(`stderr: ${stderr}`);
    } catch (err: any) {
      this.logger.error(`Erro ao migrar schema '${schemaUrl}':`, err.stderr || err.message);
      throw err;
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }
  }

  // ============================================================================
  // EXECUÇÃO GLOBAL EM TODOS OS TENANTS
  // ============================================================================

  public async executeOnAllTenants<T>(
    operation: (client: PrismaClient, tenant: any) => Promise<T>
  ): Promise<Array<{ tenant: any; result: T; error?: any }>> {
    const tenants = await this.getActiveTenants();
    const results: Array<{ tenant: any; result: T; error?: any }> = [];

    for (const tenant of tenants) {
      try {
        const client = await this.getTenantClient(tenant.schemaUrl);
        const result = await operation(client, tenant);
        results.push({ tenant, result });
      } catch (err) {
        this.logger.error(`Erro no tenant '${tenant.schemaUrl}':`, err.message);
        results.push({ tenant, result: null as any, error: err.message });
      }
    }

    return results;
  }
}
