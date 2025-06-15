// =============================================================================
// SmartPeças ERP - AuthModule
// =============================================================================
// Arquivo: backend/src/auth/auth.module.ts
//
// Descrição: Módulo de autenticação global do sistema. Gerencia o login de
// administradores, valida credenciais e protege rotas com JWT.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { LocalAdminStrategy } from './strategies/local-admin.strategy';

@Module({
  imports: [
    ConfigModule, // Acesso às variáveis de ambiente
    PassportModule.register({
      defaultStrategy: 'jwt-admin', // Estratégia padrão para AuthGuard
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '60m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtAdminStrategy,
    LocalAdminStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAdminStrategy,
    LocalAdminStrategy,
  ],
})
export class AuthModule {}
