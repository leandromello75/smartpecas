// =============================================================================
// SmartPeças ERP - AppModule (VERSÃO FINAL DE PRODUÇÃO)
// =============================================================================
// Arquivo: backend/src/app.module.ts
//
// Descrição: Módulo raiz da aplicação, configurado com validação de ambiente,
// segurança (rate limiting) e módulos de negócio.
//
// Versão: 2.1
// =============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';

// Módulos da Aplicação
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthTenantModule } from './auth-tenant/auth-tenant.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Módulo de configuração global com validação
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
    }),

    // ✅ MELHORIA DE SEGURANÇA: Módulo de Rate Limiting (Throttler)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Tempo de vida do registro em milissegundos (60 segundos)
        limit: 20,  // Limite de 20 requisições por IP dentro do 'ttl'
      },
    ]),

    // Módulos funcionais da aplicação
    PrismaModule,
    AuthModule,
    TenantModule,
    AuthTenantModule,
    CommonModule,
  ],
  controllers: [],
  providers: [
    // ✅ MELHORIA DE SEGURANÇA: Aplica o Rate Limit globalmente em todas as rotas
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}