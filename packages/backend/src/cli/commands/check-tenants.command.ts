// =============================================================================
// SmartPeças ERP - Comando CLI: Verificação de Tenants Ativos
// =============================================================================
// Arquivo: backend/src/cli/commands/check-tenants.command.ts
//
// Descrição: Comando CLI que verifica a acessibilidade e integridade dos tenants ativos no esquema unificado.
//
// Versão: 1.1.1
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 10/07/2025
// =============================================================================

import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
//import { Tenant } from '@prisma/client'; // Importar o modelo Tenant

// NOVO: Definir uma interface para o tipo de Tenant retornado pela query 'select'
interface TenantSubset {
  id: string;
  name: string;
  billingStatus: string; // Ou 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' se for um enum em TS
  isActive: boolean; // Adicionado porque é filtrado no where e é importante para o status
}

@Command({
  name: 'tenant:check',
  description: 'Verifica a acessibilidade e integridade dos tenants ativos no esquema unificado.',
})
@Injectable()
export class CheckTenantsCommand extends CommandRunner {
  private readonly logger = new Logger(CheckTenantsCommand.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('🔍 Iniciando verificação de tenants ativos no esquema unificado...');
    
    let tenants: TenantSubset[]; // CORREÇÃO: Tipagem ajustada para o subconjunto de campos
    try {
      // Buscar todos os tenants ATIVOS do banco de dados principal
      tenants = await this.prisma.tenant.findMany({
        where: { isActive: true }, // Filtrar por isActive aqui
        select: {
          id: true,
          name: true,
          billingStatus: true,
          isActive: true, // Incluir isActive no select
          // Removido: schemaUrl, cnpj, createdAt, updatedAt pois não são necessários para TenantSubset
        },
      });
      if (tenants.length === 0) {
        this.logger.warn('Nenhum tenant ativo encontrado no sistema.');
        return;
      }
    } catch (err: any) {
      this.logger.error(`❌ Falha ao buscar tenants ativos no DB principal: ${err.message}`, err.stack);
      process.exit(1); // Sai com erro
    }

    let success = 0;
    let fail = 0;

    for (const tenant of tenants) {
      // Ignorar tenants inativos na verificação de conectividade se a query findMany não tiver filtrado.
      // Já está filtrado no findMany, então esta verificação é redundante aqui, mas manteremos por robustez se for movida.
      if (!tenant.isActive) {
        this.logger.verbose(`Tenant '${tenant.name}' (${tenant.id}) está inativo, pulando verificação.`);
        continue;
      }

      const start = process.hrtime.bigint(); // Medir tempo de simulação
      try {
        // Usa o getTenantClient para simular o acesso como um serviço de domínio
        // NOTE: O getTenantClient do PrismaService agora espera um tenantId, não schemaUrl
        const tenantPrisma = this.prisma; 
        
        // Simular uma query simples filtrando pelo tenantId (ex: contar clientes)
        await tenantPrisma.cliente.count({ where: { tenantId: tenant.id } });
        
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;

        this.logger.log(`✅ Tenant '${tenant.name}' (${tenant.id}) OK. Status Faturamento: ${tenant.billingStatus}. Simulação em ${durationMs.toFixed(2)}ms`);
        success++;
      } catch (err: any) {
        this.logger.error(`❌ Falha na simulação de acesso para o tenant '${tenant.name}' (${tenant.id}): ${err.message}`, err.stack);
        fail++;
      }
    }

    this.logger.log(`\n📊 Resultado da verificação de tenants: Sucesso: ${success} | Falhas: ${fail} | Total: ${success + fail}`);
    if (fail > 0) {
      process.exit(1); // Sai com erro se houver falhas
    } else {
      process.exit(0); // Sai com sucesso
    }
  }
}