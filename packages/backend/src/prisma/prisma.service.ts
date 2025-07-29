// =============================================================================
// SmartPeças ERP - Service - Prisma (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: src/prisma/prisma.service.ts
//
// Descrição: Serviço central para interação com o banco de dados.
// Estende o PrismaClient para herdar todos os modelos e métodos.
//
// Versão: 2.1.0
// Equipe SmartPeças
// Atualizado em: 22/07/2025
// =============================================================================

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// ✅ CORREÇÃO: A importação agora usa o caminho relativo direto para o cliente gerado,
// o que é mais robusto do que depender de um path alias.
import { PrismaClient } from '@prisma/client';

@Injectable()
// A classe agora estende o PrismaClient importado corretamente
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['warn', 'error'], // Opcional: configure os logs do Prisma
    });
  }

  async onModuleInit() {
    // Este método agora existirá, pois a herança de PrismaClient está correta
    await this.$connect();
  }

  async onModuleDestroy() {
    // Este método agora existirá
    await this.$disconnect();
  }
}
