// =============================================================================
// SmartPeças ERP - AppModule (VERSÃO FINAL COM TODOS OS MÓDULOS)
// =============================================================================
// Arquivo: backend/src/app.module.ts
//
// Descrição: Módulo raiz que une todas as partes da aplicação.
//
// Versão: 2.2
// =============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';

// ✅ PASSO 1: Importar as classes dos seus módulos de funcionalidade
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthTenantModule } from './auth-tenant/auth-tenant.module';

@Module({
  imports: [
    // --- Módulos de Configuração e Infraestrutura Global ---
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),

    // --- Módulos de Funcionalidade da Aplicação ---
    // ✅ PASSO 2: Registrar (conectar) seus módulos na "placa-mãe"
    PrismaModule,
    CommonModule,
    AuthModule,
    AuthTenantModule,
    TenantModule,
    // Adicione aqui futuros módulos, como ProductModule, OrderModule, etc.
  ],
  controllers: [],
  providers: [
    // Aplica o Rate Limiting (Throttler) globalmente em todas as rotas
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
