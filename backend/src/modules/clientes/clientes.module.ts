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
// Atualizado em: 10/07/2025
// =============================================================================

import { Module } from '@nestjs/common'; // 'forwardRef' removido
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager'; // Importado (será configurado no AppModule)
import { PrismaModule } from '../../prisma/prisma.module';

// Importa os componentes do Módulo de Clientes
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

// Serviços e utilitários
import { CnpjApiService } from './integracoes/cnpj-api.service';
import { CepApiService } from './integracoes/cep-api.service';
import { DocumentoValidatorService } from './validacoes/documento-validator.service';
import { UnicidadeValidatorService } from './validacoes/unicidade-validator.service';
import { ClienteMapper } from './mappers/cliente.mapper';
import { AuditoriaService } from './auditoria/auditoria.service';
import { IdempotencyService } from './auditoria/idempotency.service';
import { IntegridadeService } from './validacoes/integridade.service';
import { TenantThrottlerService } from './throttling/tenant-throttler.service';
// ValidarDocumentoPipe não precisa ser importado aqui se usado apenas no @Param() do controller
// import { ValidarDocumentoPipe } from './validacoes/pipes/validar-documento.pipe';


@Module({
  imports: [
    PrismaModule,   // Necessário para PrismaService
    HttpModule,     // Necessário para CnpjApiService, CepApiService
    // CacheModule será configurado como global no AppModule, então apenas importamos aqui.
    CacheModule,    
  ],
  controllers: [
    ClientesController, // O controlador que expõe as rotas de clientes
  ],
  providers: [
    // Os serviços e utilitários que serão injetados
    ClientesService,
    CnpjApiService,
    CepApiService,
    DocumentoValidatorService,
    UnicidadeValidatorService, // Mantido como provider (potencialmente reutilizável)
    ClienteMapper,
    AuditoriaService,
    IdempotencyService,
    IntegridadeService,
    TenantThrottlerService,
    // REMOVIDO: ValidarDocumentoPipe (não precisa ser provider se usado direto no @Param)
  ],
  exports: [
    // Componentes que outros módulos da aplicação podem precisar usar
    ClientesService, // Essencial para outros módulos
    DocumentoValidatorService, // Exporta para possível reutilização (ex: em Fornecedores)
    UnicidadeValidatorService, // Exporta para possível reutilização (ex: em Fornecedores)
  ],
})
export class ClientesModule {}
