import { Cache } from 'cache-manager';
import { CnpjApiService } from '../integracoes/cnpj-api.service';
import { CepApiService } from '../integracoes/cep-api.service';
import { TenantThrottlerService } from '../throttling/tenant-throttler.service';
import { CreateClienteDto, ConsultarCnpjDto, ConsultarCepDto, CepResponseDto } from '../dto/cliente.dto';
import { CnpjResponseDto } from '../dto/cnpj-response.dto';
import { ClientesService } from './clientes.service';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';
export declare class ClientesIntegrationService {
    private readonly cnpjApi;
    private readonly cepApi;
    private readonly tenantThrottler;
    private cacheManager;
    private readonly clientesService;
    private readonly tenantContext;
    private readonly logger;
    private readonly CACHE_TTL_LONGO;
    constructor(cnpjApi: CnpjApiService, cepApi: CepApiService, tenantThrottler: TenantThrottlerService, cacheManager: Cache, clientesService: ClientesService, tenantContext: TenantContextService);
    consultarCnpj(dto: ConsultarCnpjDto): Promise<CnpjResponseDto>;
    consultarCep(dto: ConsultarCepDto): Promise<CepResponseDto>;
    criarClienteComCnpj(cnpj: string, meta: Partial<CreateClienteDto>, idemKey?: string): Promise<import("../dto/cliente.dto").ClienteResponseDto>;
}
