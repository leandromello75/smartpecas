import { Injectable, Logger, InternalServerErrorException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { EstatisticasResumoDto } from '../dto/cliente.dto';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

@Injectable()
export class ClientesStatsService {
  private readonly logger = new Logger(ClientesStatsService.name);
  private readonly CACHE_TTL = 300000; // 5 minutos em MS

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly tenantContext: TenantContextService,
  ) {}

  async obterEstatisticasResumo(): Promise<EstatisticasResumoDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new InternalServerErrorException('Contexto de tenant não encontrado.');
    }

    const cacheKey = `estatisticas:${tenantId}`;
    const cached = await this.cacheManager.get<EstatisticasResumoDto>(cacheKey);
    if (cached) return cached;

    const [
      totalClientes,
      clientesAtivos,
      clientesInadimplentes,
      clientesPF,
      clientesPJ,
      clientesUltimos30Dias,
    ] = await this.prisma.$transaction([
      this.prisma.cliente.count({ where: { tenantId } }),
      this.prisma.cliente.count({ where: { tenantId, isAtivo: true } }),
      this.prisma.cliente.count({ where: { tenantId, isInadimplente: true } }),
      this.prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_FISICA' } }),
      this.prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_JURIDICA' } }),
      this.prisma.cliente.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Corrigido para createdAt
        }
      }),
    ]);

    const estatisticas: EstatisticasResumoDto = {
      totalClientes,
      clientesAtivos,
      clientesInativos: totalClientes - clientesAtivos,
      clientesInadimplentes,
      clientesPessoaFisica: clientesPF,
      clientesPessoaJuridica: clientesPJ,
      clientesUltimos30Dias,
      percentualInadimplencia: totalClientes > 0 ? (clientesInadimplentes / totalClientes) * 100 : 0,
    };

    await this.cacheManager.set(cacheKey, estatisticas, this.CACHE_TTL);
    return estatisticas;
  }
}