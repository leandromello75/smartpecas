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
import { TenantContextService } from './tenant-context/tenant-context.service';

@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class CommonModule {}