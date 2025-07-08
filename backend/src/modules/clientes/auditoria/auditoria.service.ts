// =============================================================================
// SmartPeças ERP - Serviço de Auditoria (v2.1.0)
// =============================================================================
// Arquivo: backend/src/modules/clientes/auditoria/auditoria.service.ts
//
// Descrição: Serviço responsável pelo registro de ações do usuário para fins
// de rastreabilidade, transparência e segurança, com otimização de desempenho.
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtTenantUserPayload } from '../../../shared/interfaces/jwt-payload.interface';
import { AuditoriaLog } from '../../generated/tenant-client'; // Importe o tipo de modelo AuditoriaLog do Prisma Client gerado

interface DadosAuditoria {
  operacao: 'CRIAR' | 'ATUALIZAR' | 'EXCLUIR' | 'RESTAURAR' | string;
  recurso: string;          // Ex: 'cliente'
  recursoId: string;        // Ex: UUID do recurso
  dadosAnteriores?: Record<string, any>; // Tipagem mais específica
  dadosAtuais?: Record<string, any>;     // Tipagem mais específica
  timestamp?: Date;        // Será sobrescrito por 'now'
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrarOperacao(
    tenantId: string,
    usuario: JwtTenantUserPayload,
    dados: DadosAuditoria,
  ): Promise<void> {
    const now = new Date();
    const {
      operacao,
      recurso,
      recursoId,
      dadosAnteriores,
      dadosAtuais,
      ip,
      userAgent,
    } = dados;

    // Log visível para auditoria em tempo real
    this.logger.log(
      `[AUDITORIA - ${tenantId}] ${operacao} em ${recurso}:${recursoId} por ${usuario.name} (${usuario.id})`,
    );

    // Persistência em banco de dados de forma assíncrona ("fire and forget")
    // Isso evita que a operação principal espere pelo registro de auditoria,
    // melhorando a latência percebida para o usuário.
    setImmediate(async () => {
      try {
        await this.prisma.auditoriaLog.create({
          data: {
            tenantId,
            recurso,
            recursoId,
            operacao,
            dadosAnteriores: JSON.stringify(dadosAnteriores ?? {}),
            dadosAtuais: JSON.stringify(dadosAtuais ?? {}),
            realizadoEm: now,
            realizadoPor: usuario.id,
            realizadoPorNome: usuario.name,
            realizadoPorIp: ip ?? usuario.ip ?? null,
            userAgent: userAgent ?? null,
          },
        });
        this.logger.verbose(`[AUDITORIA - ${tenantId}] Operação registrada com sucesso em segundo plano: ${operacao} em ${recurso}:${recursoId}`);
      } catch (error: unknown) { // Captura erros no processo em segundo plano
        if (error instanceof Error) {
            this.logger.error(`[AUDITORIA ERRO CRÍTICO - ${tenantId}] Falha fatal ao registrar operação em segundo plano: ${error.message}`, error.stack);
        } else {
            this.logger.error(`[AUDITORIA ERRO CRÍTICO - ${tenantId}] Falha fatal ao registrar operação em segundo plano: erro desconhecido.`);
        }
        // Para garantir 100% de persistência em caso de falha, considere:
        // - Enviar para uma fila de mensagens (Kafka, RabbitMQ, Redis Streams) para retry.
        // - Logar em um sistema de log externo com alta durabilidade (S3, ELK).
      }
    });
    // Não há 'await' aqui, então o método retorna imediatamente
  }
}