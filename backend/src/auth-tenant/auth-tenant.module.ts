// =============================================================================
// SmartPeças ERP - AuthTenantModule
// =============================================================================
// Arquivo: backend/src/auth-tenant/auth-tenant.module.ts
//
// Descrição: Módulo responsável por autenticação de usuários do tenant.
// Inclui estratégias JWT, controladores e serviços específicos para cada schema.
//
// Versão: 2.1
// =============================================================================

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthTenantController } from './auth-tenant.controller';
import { AuthTenantService } from './auth-tenant.service';
import { JwtTenantUserStrategy } from './strategies/jwt-tenant-user.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthTenantController],
  providers: [
    AuthTenantService,
    JwtTenantUserStrategy,
    // 🔒 Se você criar uma estratégia local futuramente, registre aqui.
  ],
  exports: [AuthTenantService],
})
export class AuthTenantModule {}
