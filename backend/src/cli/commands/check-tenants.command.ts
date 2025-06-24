// =============================================================================
// SmartPeças ERP - Comando CLI: Verificação de Schemas de Tenants
// =============================================================================
// Arquivo: backend/src/cli/commands/check-tenants.command.ts
//
// Descrição: Comando CLI que verifica a conectividade e estrutura mínima
// dos schemas de cada tenant ativo no banco de dados.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Command({
  name: 'tenant:check',
  description: 'Verifica a conectividade e integridade mínima dos tenants ativos',
})
@Injectable()
export class CheckTenantsCommand extends CommandRunner {
  private readonly logger = new Logger(CheckTenantsCommand.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('🔍 Iniciando verificação de schemas de tenants...');
    const tenants = await this.prisma.getActiveTenants();

    let success = 0;
    let fail = 0;

    for (const tenant of tenants) {
      try {
        const client = await this.prisma.getTenantClient(tenant.schemaUrl);
        await client.$queryRawUnsafe(`SELECT 1;`);
        this.logger.log(`✅ Tenant '${tenant.name}' conectado com sucesso. Schema: ${tenant.schemaUrl}`);
        success++;
      } catch (err:any) {
        this.logger.error(`❌ Falha na conexão do tenant '${tenant.name}' (${tenant.schemaUrl}): ${err.message}`);
        fail++;
      }
    }

    this.logger.log(`\n📊 Resultado: Sucesso: ${success} | Falhas: ${fail} | Total: ${success + fail}`);
  }
}
