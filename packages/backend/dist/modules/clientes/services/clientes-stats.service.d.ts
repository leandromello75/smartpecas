import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { EstatisticasResumoDto } from '../dto/cliente.dto';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';
export declare class ClientesStatsService {
    private readonly prisma;
    private cacheManager;
    private readonly tenantContext;
    private readonly logger;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, cacheManager: Cache, tenantContext: TenantContextService);
    obterEstatisticasResumo(): Promise<EstatisticasResumoDto>;
}
