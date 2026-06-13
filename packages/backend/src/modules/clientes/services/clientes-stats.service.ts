import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { EstatisticasResumoDto } from '../dto/cliente.dto';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

@Injectable()
export class ClientesStatsService {
  private readonly CACHE_TTL = 300000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly tenantContext: TenantContextService,
  ) {}

  async obterEstatisticasResumo(): Promise<EstatisticasResumoDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) throw new InternalServerErrorException('Contexto de tenant não encontrado.');

    const cacheKey = `estatisticas:${tenantId}`;
    const cached = await (this.cacheManager as any).get(cacheKey) as EstatisticasResumoDto | undefined;
    if (cached) return cached;

    const [totalClientes, clientesAtivos, clientesPF, clientesPJ, clientesUltimos30Dias] =
      await this.prisma.$transaction([
        this.prisma.cliente.count({ where: { tenantId } }),
        this.prisma.cliente.count({ where: { tenantId, isAtivo: true } }),
        this.prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_FISICA' } }),
        this.prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_JURIDICA' } }),
        this.prisma.cliente.count({
          where: { tenantId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        }),
      ]);

    const estatisticas: EstatisticasResumoDto = {
      totalClientes,
      clientesAtivos,
      clientesInativos: totalClientes - clientesAtivos,
      clientesPessoaFisica: clientesPF,
      clientesPessoaJuridica: clientesPJ,
      clientesUltimos30Dias,
    };

    await (this.cacheManager as any).set(cacheKey, estatisticas, this.CACHE_TTL);
    return estatisticas;
  }
}
