import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OperacaoAuditoria } from '@prisma/client';
import { JwtTenantUserPayload, JwtAdminPayload } from '../../../shared/interfaces/jwt-payload.interface';

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
    const { operacao, recurso, recursoId, dadosAnteriores, dadosAtuais } = dados;

    this.logger.log(`[AUDITORIA] ${operacao} em ${recurso}:${recursoId} por ${usuario.sub}`);

    setImmediate(async () => {
      try {
        await this.prisma.auditoriaLog.create({
          data: {
            tenantId,
            recurso,
            recursoId,
            operacao,
            dados: { dadosAnteriores: dadosAnteriores ?? {}, dadosAtuais: dadosAtuais ?? {} },
            realizadoPor: usuario.sub,
          },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error(`[AUDITORIA ERRO] ${error.message}`, error.stack);
        }
      }
    });
  }
}
