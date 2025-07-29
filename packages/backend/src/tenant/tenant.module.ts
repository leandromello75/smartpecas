// =============================================================================
// SmartPeças ERP - Tenant Module
// =============================================================================
// Arquivo: backend/src/tenant/tenant.module.ts
//
// Descrição: Módulo responsável pelo gerenciamento de tenants (empresas) e
// integração com o Prisma para operações multi-schema.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, PrismaService],
  exports: [TenantService],
})
export class TenantModule {}
