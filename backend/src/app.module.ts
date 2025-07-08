// =============================================================================
// SmartPeças ERP - AppModule (VERSÃO FINAL CONSOLIDADA E SEGURA v2.3)
// =============================================================================
// Arquivo: backend/src/app.module.ts
//
// Descrição: Módulo raiz que une todas as partes da aplicação,
// configurando a infraestrutura global e os módulos de funcionalidade.
//
// Versão: 2.3.0
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 07/07/2025
// =============================================================================

import { Module, ValidationPipe } from '@nestjs/common'; // Importa ValidationPipe
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core'; // Importa APP_PIPE, APP_INTERCEPTOR
import { envValidationSchema } from './config/env.validation'; // Assumindo que este arquivo existe

// --- Módulos de Configuração e Infraestrutura Global ---
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module'; // CORREÇÃO: Apenas um import

// Importar interceptors e guards globais
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor'; // Assumindo que você os criou
import { TransformInterceptor } from './shared/interceptors/transform.interceptor'; // Assumindo que você os criou

// Se CommonModule, TenantModule, AuthTenantModule forem para arquitetura antiga
// ou não tiverem funções claras na nova arquitetura, eles deverão ser removidos.
// POR ENQUANTO, VOU REMOVÊ-LOS PARA ALINHAR COM A ARQUITETURA UNIFICADA.
// import { CommonModule } from './common/common.module';
// import { TenantModule } from './tenant/tenant.module';
// import { AuthTenantModule } from './auth-tenant/auth-tenant.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema, // Valida variáveis de ambiente (JWT_SECRET, DATABASE_URL, etc.)
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),

    // --- Módulos de Funcionalidade da Aplicação ---
    PrismaModule, // Fornece PrismaService
    AuthModule,   // Fornece AuthService, JwtModule, Guards (se for global)
    ClientesModule, // Seu módulo de Clientes

    // Removendo módulos que podem estar ligados a arquitetura multi-schema antiga:
    // CommonModule, TenantModule, AuthTenantModule
  ],
  controllers: [], // CORREÇÃO: Controllers são registrados DENTRO de seus respectivos módulos
  providers: [
    // Aplica o Rate Limiting (Throttler) globalmente em todas as rotas
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // CORREÇÃO: Aplica o ValidationPipe globalmente para todos os DTOs
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // CORREÇÃO: Aplica o LoggingInterceptor globalmente
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // CORREÇÃO: Aplica o TransformInterceptor globalmente para padronizar respostas
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Note: JwtAuthGuard, TenantGuard, RolesGuard são aplicados no ClienteController
    // ou podem ser aplicados aqui globalmente via APP_GUARD, se desejar.
    // Se quiser aplicar esses Guards globalmente, adicione-os aqui,
    // mas remova @UseGuards() dos Controllers.
    // Exemplo:
    // { provide: APP_GUARD, useClass: JwtAuthGuard },
    // { provide: APP_GUARD, useClass: TenantGuard },
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}