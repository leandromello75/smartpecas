// =============================================================================
// SmartPeças ERP - PrismaService (VERSÃO FINAL MULTI-CLIENT)
// =============================================================================
// Arquivo: backend/src/prisma/prisma.service.ts
// Descrição: Serviço Prisma avançado que gerencia o cliente público e atua
// como uma fábrica para criar clientes dinâmicos para cada tenant.
// Versão: 3.0
// =============================================================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

// ✅ CORREÇÃO: Importamos AMBOS os clientes, dando apelidos para diferenciá-los.
import { PrismaClient as PublicPrismaClient } from '@prisma/client';
import { PrismaClient as TenantPrismaClient } from '@/tenant-client';

const execAsync = promisify(exec);

// ✅ CORREÇÃO: A classe principal estende o cliente PÚBLICO (o "Gerente Geral").
@Injectable()
export class PrismaService extends PublicPrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly tenantClients = new Map<string, TenantPrismaClient>();

  // ✅ Injetamos o ConfigService para ler a URL base do banco de dados do .env
  constructor(private readonly configService: ConfigService) {
    super({
      log: ['warn', 'error'],
    });
  }

  // --- Ciclo de Vida do Módulo (Corrigido com OnModuleDestroy) ---

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

  // --- Gestão de Clientes Multi-Schema ---

  public async getTenantClient(schemaUrl: string): Promise<TenantPrismaClient> {
    if (!schemaUrl) throw new Error('Schema do tenant não informado.');

    if (this.tenantClients.has(schemaUrl)) {
      return this.tenantClients.get(schemaUrl)!;
    }

    const dbUrl = this.buildTenantDatabaseUrl(schemaUrl);
    
    // ✅ CORREÇÃO: Instancia o cliente específico do Tenant.
    const client = new TenantPrismaClient({
      datasources: { db: { url: dbUrl } },
    });

    await client.$connect();
    this.tenantClients.set(schemaUrl, client);
    this.logger.log(`Nova conexão Prisma estabelecida para o schema: ${schemaUrl}`);
    return client;
  }

  private buildTenantDatabaseUrl(schemaUrl: string): string {
    const baseUrl = this.configService.get<string>('DATABASE_URL');
    if (!baseUrl) throw new Error('DATABASE_URL não está definida no .env.');
    
    const url = new URL(baseUrl);
    url.searchParams.set('schema', schemaUrl);
    return url.toString();
  }

  // --- Operações de Schema ---

  public async createTenantSchema(schemaUrl: string): Promise<void> {
    if (!schemaUrl) throw new Error('Schema inválido.');
    await this.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaUrl}"`);
    this.logger.log(`Schema '${schemaUrl}' criado com sucesso.`);
    await this.runTenantMigrations(schemaUrl);
  }

  private async runTenantMigrations(schemaUrl: string): Promise<void> {
    const databaseUrl = this.buildTenantDatabaseUrl(schemaUrl);
    
    // ✅ CORREÇÃO: O comando agora aponta para o schema de tenant correto.
    const command = `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy --schema=./prisma/tenant.prisma`;

    try {
      this.logger.log(`Executando migrações para o schema '${schemaUrl}'...`);
      const { stdout, stderr } = await execAsync(command);
      if (stdout) this.logger.log(`Migrações [${schemaUrl}] stdout: ${stdout}`);
      if (stderr) this.logger.warn(`Migrações [${schemaUrl}] stderr: ${stderr}`);
    } catch (error) {
      this.logger.error(`Falha ao migrar schema '${schemaUrl}':`, error);
      // Considerar lógica de rollback, como apagar o schema recém-criado.
      await this.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaUrl}" CASCADE`);
      throw new InternalServerErrorException(`Não foi possível migrar o banco de dados do tenant.`);
    }
  }
}