import { ClientesService } from './services/clientes.service';
import { ClientesIntegrationService } from './services/clientes-integration.service';
import { ClientesStatsService } from './services/clientes-stats.service';
import { CreateClienteDto, UpdateClienteDto, ConsultarClienteDto, ClienteResponseDto, ConsultarCnpjDto, EstatisticasResumoDto } from './dto/cliente.dto';
export declare class ClientesController {
    private readonly clientesService;
    private readonly integrationService;
    private readonly statsService;
    private readonly logger;
    constructor(clientesService: ClientesService, integrationService: ClientesIntegrationService, statsService: ClientesStatsService);
    criar(dto: CreateClienteDto, idemKey?: string): Promise<ClienteResponseDto>;
    listar(filtros: ConsultarClienteDto): Promise<{
        dados: any;
        paginacao: {
            total: any;
            pagina: number | undefined;
            itensPorPagina: number | undefined;
            totalPaginas: number;
        };
    }>;
    obterEstatisticas(): Promise<EstatisticasResumoDto>;
    buscarPorId(id: string): Promise<ClienteResponseDto>;
    atualizar(id: string, dto: UpdateClienteDto): Promise<ClienteResponseDto>;
    consultarCnpj(dto: ConsultarCnpjDto): Promise<import("./dto/cnpj-response.dto").CnpjResponseDto>;
    criarComCnpj(dto: ConsultarCnpjDto, idemKey?: string): Promise<ClienteResponseDto>;
}
