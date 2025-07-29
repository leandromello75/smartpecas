// =============================================================================
// SmartPeças ERP - CommonModule
// =============================================================================
// Arquivo: backend/src/common/common.module.ts
//
// Descrição: Módulo global para provedores de serviços compartilhados, como
// o TenantContextService, que são usados em toda a aplicação.
//
// Versão: 1.0
// =============================================================================

import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantContextService } from './tenant-context/tenant-context.service';
import { TenantInterceptor } from './interceptors/tenant.interceptor';

@Global()
@Module({
  providers: [
    TenantContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [TenantContextService],
})
export class CommonModule {}