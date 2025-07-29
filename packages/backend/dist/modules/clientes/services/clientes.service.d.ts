import { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, ConsultarClienteDto, ClienteResponseDto } from '../dto/cliente.dto';
import { DocumentoValidatorService } from '../validacoes/documento-validator.service';
import { UnicidadeValidatorService } from '../validacoes/unicidade-validator.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { IntegridadeService } from '../validacoes/integridade.service';
import { IdempotencyService } from '../auditoria/idempotency.service';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';
export declare class ClientesService {
    private readonly prisma;
    private readonly docValidator;
    private readonly unicidadeValidator;
    private readonly auditoriaService;
    private readonly integridadeService;
    private cacheManager;
    private readonly idempotencyService;
    private readonly tenantContext;
    private readonly logger;
    private readonly ORDENACAO_PERMITIDA;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, docValidator: DocumentoValidatorService, unicidadeValidator: UnicidadeValidatorService, auditoriaService: AuditoriaService, integridadeService: IntegridadeService, cacheManager: Cache, idempotencyService: IdempotencyService, tenantContext: TenantContextService);
    criar(dto: CreateClienteDto, idemKey?: string): Promise<ClienteResponseDto>;
    buscarPorId(id: string): Promise<ClienteResponseDto>;
    listar(filtros: ConsultarClienteDto): Promise<{
        dados: any;
        paginacao: {
            total: any;
            pagina: number | undefined;
            itensPorPagina: number | undefined;
            totalPaginas: number;
        };
    }>;
    atualizar(id: string, dto: UpdateClienteDto): Promise<ClienteResponseDto>;
    desativar(id: string): Promise<void>;
    reativar(id: string): Promise<void>;
    private alterarStatusAtividade;
    private montarFiltros;
    private invalidarCacheIndividual;
    private invalidarCacheLista;
    private invalidarCachePatterns;
}
