// =============================================================================
// SmartPeças ERP - Health Check Controller
// =============================================================================
// Arquivo: packages/backend/src/health/health.controller.ts
//
// Descrição: Endpoint GET /health exigido pelo Railway para verificar
// se o serviço está saudável e pronto para receber requisições.
// =============================================================================

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'smartpecas-backend',
    };
  }
}