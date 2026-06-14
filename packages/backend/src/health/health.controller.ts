// =============================================================================
// SmartPeças ERP - Health Check Controller
// =============================================================================
// Arquivo: packages/backend/src/health/health.controller.ts
//
// Descrição: Endpoint GET /health exigido pelo Railway para verificar
// se o serviço está saudável e pronto para receber requisições.
// =============================================================================

import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajuste o caminho se necessário

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const start = Date.now();

    try {
      // Teste leve de conexão com o banco de dados
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        service: 'smartpecas-backend',
        database: 'connected',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${Date.now() - start}ms`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';

      this.logger.error('Healthcheck failed - Database unreachable', error);

      return {
        status: 'degraded',
        service: 'smartpecas-backend',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }
}