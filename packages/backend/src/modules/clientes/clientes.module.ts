// =============================================================================
// SmartPeças ERP - ClientesModule (Versão 1.1.1 - Final)
// =============================================================================
// Arquivo: backend/src/modules/clientes/clientes.module.ts
//
// Descrição: Módulo principal responsável por agrupar e configurar todos os
// componentes relacionados ao cadastro e gestão de clientes.
//
// Versão: 1.1.1
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 21/06/2026
// =============================================================================

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../prisma/prisma.module';

import { ClientesController } from './clientes.controller';
import { ClientesService } from './services/clientes.service';
import { ClientesIntegrationService } from './services/clientes-integration.service';
import { ClientesStatsService } from './services/clientes-stats.service';
import { CnpjApiService } from './integracoes/cnpj-api.service';
import { CepApiService } from './integracoes/cep-api.service';
import { DocumentoValidatorService } from './validacoes/documento-validator.service';
import { UnicidadeValidatorService } from './validacoes/unicidade-validator.service';
import { ClienteMapper } from './mappers/cliente.mapper';
import { AuditoriaService } from './auditoria/auditoria.service';
import { IdempotencyService } from './auditoria/idempotency.service';
import { IntegridadeService } from './validacoes/integridade.service';
import { TenantThrottlerService } from './throttling/tenant-throttler.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
  ],
  controllers: [ClientesController],
  providers: [
    ClientesService,
    ClientesIntegrationService,
    ClientesStatsService,
    CnpjApiService,
    CepApiService,
    DocumentoValidatorService,
    UnicidadeValidatorService,
    ClienteMapper,
    AuditoriaService,
    IdempotencyService,
    IntegridadeService,
    TenantThrottlerService,
  ],
  exports: [
    ClientesService,
    DocumentoValidatorService,
    UnicidadeValidatorService,
  ],
})
export class ClientesModule {}