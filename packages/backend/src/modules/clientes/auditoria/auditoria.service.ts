// =============================================================================
// SmartPeças ERP - Serviço de Auditoria
// =============================================================================
// Arquivo: backend/src/modules/clientes/auditoria/auditoria.service.ts
//
// Descrição: Serviço responsável pelo registro de ações do usuário para fins
// de rastreabilidade, transparência e segurança, com otimização de desempenho.
//
// Versão: 2.1.2
// Equipe SmartPeças
// Atualizado em: 13/07/2025
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtTenantUserPayload, JwtAdminPayload } from '../../../shared/interfaces/jwt-payload.interface';
// CORREÇÃO: Importar AuditoriaLog e OperacaoAuditoria do Prisma Client unificado
import { AuditoriaLog, OperacaoAuditoria } from '@prisma/client'; // Caminho corrigido

// NOVO: Tipo union para 'usuario' se ele pode ser Admin ou TenantUser
type AuditUserPayload = JwtTenantUserPayload | JwtAdminPayload;

interface DadosAuditoria {
  operacao: OperacaoAuditoria;
  recurso: string;
  recursoId: string;
  dadosAnteriores?: Record<string, any> | null;
  dadosAtuais?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrarOperacao(
    tenantId: string,
    usuario: AuditUserPayload,
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
      `[AUDITORIA - ${tenantId}] ${operacao} em ${recurso}:${recursoId} por ${usuario.name ?? usuario.email} (ID: ${usuario.sub})`,
    );

    // Persistência em banco de dados de forma assíncrona ("fire and forget")
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
            realizadoPor: usuario.sub,
            realizadoPorNome: usuario.name ?? usuario.email ?? null, // CORREÇÃO: Fallback para null se name/email forem null
            realizadoPorIp: ip ?? usuario.ip ?? null,
            userAgent: userAgent ?? usuario.userAgent ?? null, // CORREÇÃO: Pega userAgent do payload, se existe
          },
        });
        this.logger.verbose(`[AUDITORIA - ${tenantId}] Operação registrada com sucesso em segundo plano: ${operacao} em ${recurso}:${recursoId}`);
      } catch (error: unknown) {
        if (error instanceof Error) {
            this.logger.error(`[AUDITORIA ERRO CRÍTICO - ${tenantId}] Falha fatal ao registrar operação em segundo plano: ${error.message}`, error.stack);
        } else {
            this.logger.error(`[AUDITORIA ERRO CRÍTICO - ${tenantId}] Falha fatal ao registrar operação em segundo plano: erro desconhecido.`);
        }
      }
    });
  }
}