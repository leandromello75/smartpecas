import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class IntegridadeService {
  private readonly logger = new Logger(IntegridadeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validarExclusaoCliente(tenantId: string, clienteId: string): Promise<void> {
    this.logger.debug(`[${tenantId}] Verificando integridade para exclusao do cliente: ${clienteId}`);

    const pedidosVinculados = await this.prisma.order.count({
      where: {
        tenantId,
        customerId: clienteId,
      },
    });

    if (pedidosVinculados > 0) {
      throw new ConflictException(
        `Cliente possui ${pedidosVinculados} pedido(s) vinculado(s) e nao pode ser removido. Use desativacao.`,
      );
    }
  }
}
