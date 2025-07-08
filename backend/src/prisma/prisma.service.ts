// =============================================================================
// SmartPeças ERP - PrismaService (VERSÃO FINAL - SCHEMA ÚNICO)
// =============================================================================
// Arquivo: backend/src/prisma/prisma.service.ts
// Descrição: Serviço Prisma centralizado que gerencia a conexão com o banco de dados
// para toda a aplicação. Utiliza um único PrismaClient para o schema unificado.
// A segregação de dados por tenant é feita via 'tenantId' nas queries.
//
// Versão: 4.1.1
// Equipe SmartPeças + Arquitetura Unificada
// Atualizado em: 07/07/2025
// =============================================================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, InternalServerErrorException } from '@nestjs/common';
// Removendo import de ConfigService, pois não será mais usado
import { PrismaClient } from '../generated/prisma-client'; // Importa o PrismaClient UNIFICADO

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Removendo 'private readonly configService: ConfigService' do construtor
  constructor() { 
    super({
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma (cliente único) conectado com sucesso.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexão Prisma principal encerrada.');
  }

  public getTenantClient(tenantId: string) {
    if (!tenantId) {
      throw new InternalServerErrorException('Tenant ID é obrigatório para operações do cliente.');
    }
    this.logger.verbose(`[PrismaService] Acessando cliente para tenantId: ${tenantId}`);
    return this; 
  }
}