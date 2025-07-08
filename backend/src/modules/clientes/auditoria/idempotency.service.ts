// =============================================================================
// SmartPeças ERP - Service - IdempotencyService
// =============================================================================
// Arquivo: backend/src/modules/clientes/auditoria/idempotency.service.ts
//
// Descrição: Serviço de suporte para execução idempotente de operações,
// com cache persistente por tenant, TTL configurável e rastreabilidade de origem.
//
// Versão: 1.2.2
// Equipe SmartPeças + Otimizações IA
// Atualizado em: 28/06/2025
// =============================================================================

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client'; // Importar 'Prisma' para tipagem de transação

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa uma função de negócio de forma idempotente.
   * Se a chave já tiver sido usada, retorna o resultado armazenado.
   *
   * @param idemKey   - Chave de idempotência fornecida pelo cliente.
   * @param tenantId  - Identificador do tenant.
   * @param route     - Nome da operação executada (ex: 'clientes.criar').
   * @param operation - Função assíncrona que executa a lógica de negócio, com acesso à transação Prisma.
   * @param origin    - (Opcional) Origem da requisição (ex: 'Controller', 'Webhook').
   * @param ttlMs     - Tempo de validade da chave, em milissegundos (padrão: 24h).
   */
  async executeOrRecover<T>(
    idemKey: string | undefined,
    tenantId: string,
    route: string,
    // Tipagem da função 'operation'
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    origin?: string,
    ttlMs: number = 86400000,
  ): Promise<T> {
    if (!idemKey) {
      // Se não houver chave, execute a operação normalmente em uma transação
      // A tipagem 'any' é usada para compatibilidade com o callback do $transaction
      return this.prisma.$transaction(operation as any);
    }

    // AQUI ESTÁ A CORREÇÃO: tipagem explícita do 'tx'
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingKey = await tx.idempotencyKey.findUnique({
        where: { key_tenantId: { key: idemKey, tenantId } },
      });

      if (existingKey) {
        this.logger.warn(
          `[${tenantId}] Requisição idempotente detectada (rota: ${route}, chave: ${idemKey}). Retornando resultado armazenado.`,
        );
        return existingKey.response as T;
      }

      const result = await operation(tx);

      try {
        // Validação de serialização para garantir que o resultado pode ser armazenado em JSON
        JSON.stringify(result);
      } catch (e: unknown) {
        if (e instanceof Error) {
          this.logger.error(
            `Erro ao serializar resposta para idempotência (rota: ${route}): ${e.message}`,
            e.stack,
          );
        } else {
          this.logger.error(`Erro desconhecido ao serializar resposta para idempotência (rota: ${route}).`);
        }
        throw new InternalServerErrorException(
          'Erro ao armazenar resposta da operação. Resultado não serializável.',
        );
      }

      await tx.idempotencyKey.create({
        data: {
          key: idemKey,
          route,
          tenantId,
          response: result as any,
          expiresAt: new Date(Date.now() + ttlMs),
          origin,
        },
      });

      this.logger.verbose(
        `[${tenantId}] Chave de idempotência armazenada com sucesso (rota: ${route}, chave: ${idemKey}).`,
      );

      return result;
    });
  }
}
