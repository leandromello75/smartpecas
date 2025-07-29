// =============================================================================
// SmartPeças ERP - Serviço de Validação de Integridade
// =============================================================================
// Arquivo: backend/src/modules/clientes/validacoes/integridade.service.ts
//
// Descrição: Serviço para validar a integridade referencial antes de operações
// de desativação ou exclusão de clientes, prevenindo inconsistências de dados.
//
// Versão: 1.1.0
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 09/07/2025
// =============================================================================

import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class IntegridadeService {
  private readonly logger = new Logger(IntegridadeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validarExclusaoCliente(tenantId: string, clienteId: string): Promise<void> {
    this.logger.debug(`[${tenantId}] Verificando integridade para exclusão do cliente: ${clienteId}`);

    await this.verificarOrdensEmAberto(tenantId, clienteId);
    await this.verificarFaturasPendentes(tenantId, clienteId);
    await this.verificarVeiculosAtivos(tenantId, clienteId);

    this.logger.verbose(`[${tenantId}] Nenhuma pendência encontrada. Cliente ${clienteId} pode ser desativado.`);
  }

  private async verificarOrdensEmAberto(tenantId: string, clienteId: string): Promise<void> {
    const ordens = await this.prisma.order.count({
      where: {
        tenantId,
        customerId: clienteId,
        status: { in: ['pending', 'processing'] }, // Idealmente usar enum
      },
    });

    if (ordens > 0) {
      this.logger.warn(`[${tenantId}] Cliente ${clienteId} tem ${ordens} ordens de serviço em aberto.`);
      throw new ConflictException(`Não é possível excluir o cliente: possui ${ordens} ordens de serviço em aberto.`);
    }
  }

  private async verificarFaturasPendentes(tenantId: string, clienteId: string): Promise<void> {
    // Remover comentário caso modelo "fatura" exista
    /*
    const faturas = await this.prisma.fatura.count({
      where: {
        tenantId,
        clienteId,
        status: { not: 'PAID' },
      },
    });

    if (faturas > 0) {
      this.logger.warn(`[${tenantId}] Cliente ${clienteId} tem ${faturas} faturas pendentes.`);
      throw new ConflictException(`Não é possível excluir o cliente: possui ${faturas} faturas pendentes.`);
    }
    */
  }

  private async verificarVeiculosAtivos(tenantId: string, clienteId: string): Promise<void> {
    // Remover comentário caso modelo "veiculoCliente" exista
    /*
    const veiculos = await this.prisma.veiculoCliente.count({
      where: {
        tenantId,
        clienteId,
        isAtivo: true,
      },
    });

    if (veiculos > 0) {
      this.logger.warn(`[${tenantId}] Cliente ${clienteId} tem ${veiculos} veículos ativos vinculados.`);
      throw new ConflictException(`Não é possível excluir o cliente: possui ${veiculos} veículo(s) ativo(s) vinculado(s).`);
    }
    */
  }
}
