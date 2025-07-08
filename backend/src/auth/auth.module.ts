// =============================================================================
// SmartPeças ERP - AuthModule (Otimizado e Seguro v1.2)
// =============================================================================
// Arquivo: backend/src/auth/auth.module.ts
//
// Descrição: Módulo de autenticação global do sistema. Gerencia o login de
// administradores, valida credenciais e protege rotas com JWT.
// Implementa validações de segurança e configuração robusta do JWT.
//
// Versão: 1.2.0
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 07/07/2025
// =============================================================================

import { Module, Global } from '@nestjs/common'; // Adicionado Global
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { LocalAdminStrategy } from './strategies/local-admin.strategy';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import * as Joi from 'joi'; // Para validação de variáveis de ambiente

@Global() // Torna o AuthModule disponível globalmente se a equipe assim desejar
@Module({
  imports: [
    // Validação de variáveis de ambiente com Joi para garantir que JWT_SECRET exista
    ConfigModule.forRoot({
      isGlobal: true, // Garante que o ConfigService esteja disponível em toda a aplicação
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required().description('Chave secreta para assinatura JWT.'),
        JWT_EXPIRES_IN: Joi.string().default('60m').description('Tempo de expiração do JWT (ex: "60m", "1h", "1d").'),
        // Adicione outras variáveis de ambiente relevantes aqui
      }),
    }),
    PrismaModule,
    PassportModule.register({
      defaultStrategy: 'jwt-admin',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        // Validação explícita para JWT_SECRET (sugestão da equipe)
        if (!secret) {
          throw new Error('JWT_SECRET não está definido nas variáveis de ambiente. A autenticação não pode prosseguir.');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '60m',
            algorithm: 'HS256', // Sugestão da equipe: Algoritmo de assinatura
          },
          verifyOptions: {
            algorithms: ['HS256'], // Sugestão da equipe: Algoritmos permitidos para verificação
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginRateLimiterService,
    JwtAdminStrategy,
    LocalAdminStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule, // Exportar PassportModule é útil para outras rotas que usam @UseGuards(AuthGuard())
  ],
})
export class AuthModule {}
