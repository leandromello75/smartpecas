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
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { ConfigService } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

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
      isGlobal: true, // Garante que o CacheManager seja injetável globalmente
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        // ttl: configService.get<number>('CACHE_TTL') // Opcional: TTL padrão
      }),
      inject: [ConfigService],
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
    { provide: APP_PIPE,
    useValue: new ValidationPipe({
    whitelist: true, // Remove propriedades que não existem no DTO
    transform: true, // Transforma o payload para a instância da classe do DTO
    forbidNonWhitelisted: true, // Lança um erro se propriedades extras forem enviadas
     })
    },

    // Ordem dos interceptors pode ser importante
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}