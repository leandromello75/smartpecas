// =============================================================================
// SmartPeças ERP - PrismaModule
// =============================================================================
// Arquivo: backend/src/prisma/prisma.module.ts
//
// Descrição: Módulo global que fornece o PrismaService para toda a aplicação.
//
// Versão 1.0
// =============================================================================

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
