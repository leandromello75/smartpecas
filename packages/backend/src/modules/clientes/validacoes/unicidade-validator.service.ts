import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UnicidadeValidatorService {
  private readonly logger = new Logger(UnicidadeValidatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  private limparDocumento(doc: string): string {
    return doc.replace(/[^\d]/g, '');
  }

  async validarDocumento(
    tenantId: string,
    documento: string,
    clienteId?: string,
    prismaClient: any = this.prisma,
  ): Promise<void> {
    const docLimpo = this.limparDocumento(documento);

    const clienteExistente = await prismaClient.cliente.findFirst({
      where: {
        tenantId,
        documento: docLimpo,
        id: clienteId ? { not: clienteId } : undefined,
      },
    });

    if (clienteExistente) {
      this.logger.warn(`Documento duplicado detectado: ${docLimpo} (Tenant: ${tenantId})`);
      throw new ConflictException(
        `O documento ${docLimpo} ja esta em uso${clienteId ? ` por outro cliente (ignorado ID ${clienteId})` : ''}.`,
      );
    }
  }

  async validarEmail(
    tenantId: string,
    email: string,
    clienteId?: string,
    prismaClient: any = this.prisma,
  ): Promise<void> {
    const clienteExistente = await prismaClient.cliente.findFirst({
      where: {
        tenantId,
        email,
        id: clienteId ? { not: clienteId } : undefined,
      },
    });

    if (clienteExistente) {
      this.logger.warn(`E-mail duplicado detectado: ${email} (Tenant: ${tenantId})`);
      throw new ConflictException(
        `O e-mail ${email} ja esta em uso${clienteId ? ` por outro cliente (ignorado ID ${clienteId})` : ''}.`,
      );
    }
  }
}
