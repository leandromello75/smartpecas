// =============================================================================
// SmartPeças ERP - Serviço de Auditoria (v2.1.1)
// =============================================================================
// Arquivo: backend/src/modules/clientes/auditoria/auditoria.service.ts
//
// Descrição: Serviço responsável pelo registro de ações do usuário para fins
// de rastreabilidade, transparência e segurança, com otimização de desempenho.
//
// Versão: 2.1.1
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 13/07/2025
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtTenantUserPayload, JwtAdminPayload } from '../../../shared/interfaces/jwt-payload.interface'; // Importar ambos os tipos
// CORREÇÃO: Importar AuditoriaLog e OperacaoAuditoria (se existir) do Prisma Client unificado
import { AuditoriaLog, OperacaoAuditoria } from '../../generated/prisma-client';

// NOVO: Tipo union para 'usuario' se ele pode ser Admin ou TenantUser
type AuditUserPayload = JwtTenantUserPayload | JwtAdminPayload;

interface DadosAuditoria {
  // CORREÇÃO: Usar o enum OperacaoAuditoria (se criado)
  operacao: OperacaoAuditoria; // Ou 'CRIAR' | 'ATUALIZAR' | ... se não houver enum
  recurso: string;
  recursoId: string;
  dadosAnteriores?: Record<string, any> | null; // Pode ser null
  dadosAtuais?: Record<string, any> | null;     // Pode ser null
  ip?: string | null; // Garantir compatibilidade com null
  userAgent?: string | null; // Garantir compatibilidade com null
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrarOperacao(
    tenantId: string,
    usuario: AuditUserPayload, // CORREÇÃO: Tipo union para 'usuario'
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
      `[AUDITORIA - ${tenantId}] ${operacao} em ${recurso}:${recursoId} por ${usuario.name ?? usuario.email} (ID: ${usuario.sub})`, // CORREÇÃO: Acessar usuario.sub e usuario.name
    );

    // Persistência em banco de dados de forma assíncrona ("fire and forget")
    setImmediate(async () => {
      try {
        await this.prisma.auditoriaLog.create({
          data: {
            tenantId,
            recurso,
            recursoId,
            operacao, // Operacao agora é o enum
            dadosAnteriores: JSON.stringify(dadosAnteriores ?? {}),
            dadosAtuais: JSON.stringify(dadosAtuais ?? {}),
            realizadoEm: now,
            realizadoPor: usuario.sub, // CORREÇÃO: Acessar usuario.sub
            realizadoPorNome: usuario.name ?? usuario.email, // CORREÇÃO: Acessar usuario.name ou email
            realizadoPorIp: ip ?? usuario.ip ?? null, // Usar IP do payload ou dado
            userAgent: userAgent ?? usuario.userAgent ?? null, // Usar UserAgent do payload ou dado
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