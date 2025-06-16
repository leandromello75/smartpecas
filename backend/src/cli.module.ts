// =============================================================================
// SmartPeças ERP - Módulo CLI (Command Line Interface)
// =============================================================================
// Arquivo: backend/src/cli.module.ts
//
// Descrição: Módulo NestJS responsável por agrupar e registrar os comandos CLI
// personalizados do sistema, permitindo a execução de ferramentas de linha de
// comando no contexto da aplicação.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 16/06/2025
// =============================================================================

import { Module } from '@nestjs/common';
import { CheckTenantsCommand } from './cli/check-tenants.command'; // Caminho ajustado para a sua estrutura
import { PrismaService } from './prisma/prisma.service'; // Necessário para injeção no comando CLI
import { TenantService } from './tenant/tenant.service'; // Necessário se comandos futuros usarem TenantService

@Module({
  providers: [
    CheckTenantsCommand, // Registra o comando CLI de verificação de tenants
    PrismaService,       // Prover PrismaService para que os comandos CLI possam injetá-lo
    TenantService,       // Prover TenantService se comandos CLI futuros precisarem
  ],
  // Não há necessidade de 'controllers' ou 'exports' para um módulo CLI típico,
  // pois ele não expõe rotas HTTP nem é injetado em outros módulos da aplicação web.
})
export class CliModule {}
