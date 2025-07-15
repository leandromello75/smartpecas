// =============================================================================
// SmartPeças ERP - Serviço de Validação de Unicidade
// =============================================================================
// Arquivo: backend/src/modules/clientes/validacoes/unicidade-validator.service.ts
//
// Descrição: Serviço para verificar a unicidade de documentos (CPF/CNPJ) e e-mails
// dentro do escopo de um tenant, prevenindo duplicações no banco de dados.
//
// Versão: 1.1.0
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 09/07/2025
// =============================================================================

import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UnicidadeValidatorService {
  private readonly logger = new Logger(UnicidadeValidatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Limpa caracteres não numéricos de um CPF/CNPJ.
   */
  private limparDocumento(doc: string): string {
    return doc.replace(/[^\d]/g, '');
  }

  /**
   * Valida se um documento já está em uso por outro cliente no mesmo tenant.
   */
  async validarDocumento(tenantId: string, documento: string, clienteId?: string): Promise<void> {
    const docLimpo = this.limparDocumento(documento);

    const clienteExistente = await this.prisma.cliente.findFirst({
      where: {
        tenantId,
        documento: docLimpo,
        id: clienteId ? { not: clienteId } : undefined,
      },
    });

    if (clienteExistente) {
      this.logger.warn(`Documento duplicado detectado: ${docLimpo} (Tenant: ${tenantId})`);
      throw new ConflictException(`O documento ${docLimpo} já está em uso${clienteId ? ` por outro cliente (ignorado ID ${clienteId})` : ''}.`);
    }
  }

  /**
   * Valida se um e-mail já está em uso por outro cliente no mesmo tenant.
   */
  async validarEmail(tenantId: string, email: string, clienteId?: string): Promise<void> {
    const clienteExistente = await this.prisma.cliente.findFirst({
      where: {
        tenantId,
        email,
        id: clienteId ? { not: clienteId } : undefined,
      },
    });

    if (clienteExistente) {
      this.logger.warn(`E-mail duplicado detectado: ${email} (Tenant: ${tenantId})`);
      throw new ConflictException(`O e-mail ${email} já está em uso${clienteId ? ` por outro cliente (ignorado ID ${clienteId})` : ''}.`);
    }
  }
}
