// =============================================================================
// SmartPeças ERP - AppModule (Versão Final v2.4 com Cache Global Redis)
// =============================================================================
// Arquivo: backend/src/app.module.ts
//
// Descrição: Módulo raiz com infraestrutura consolidada (Redis, Throttler, ValidationPipe, Interceptors).
//
// Versão: 2.4.0
// Equipe SmartPeças
// Atualizado em: 11/07/2025
// =============================================================================

import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

@Module({
  imports: [
    // Variáveis de ambiente globais e validadas
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
    }),

    // Cache distribuído com Redis (global)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: configService.get<number>('CACHE_TTL', 300),
      }),
    }),

    // Rate limiting básico para segurança
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),

    // Módulos de domínio
    PrismaModule,
    AuthModule,
    ClientesModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}