import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, ConsultarClienteDto, ClienteResponseDto, ConsultarCnpjDto, ConsultarCepDto, EstatisticasResumoDto } from './dto/cliente.dto';
import { JwtTenantUserPayload } from '../../shared/interfaces/jwt-payload.interface';
export declare class ClientesController {
    private readonly clientesService;
    private readonly logger;
    constructor(clientesService: ClientesService);
    criar(tenantId: string, user: JwtTenantUserPayload, dto: CreateClienteDto, idemKey?: string): Promise<ClienteResponseDto>;
    listar(tenantId: string, filtros: ConsultarClienteDto): Promise<{}>;
    buscarPorId(tenantId: string, id: string): Promise<ClienteResponseDto>;
    atualizar(tenantId: string, user: JwtTenantUserPayload, id: string, dto: UpdateClienteDto): Promise<ClienteResponseDto>;
    buscarPorDocumento(tenantId: string, documento: string): Promise<ClienteResponseDto | null>;
    desativar(tenantId: string, user: JwtTenantUserPayload, id: string): Promise<void>;
    reativar(tenantId: string, user: JwtTenantUserPayload, id: string): Promise<void>;
    marcarInadimplente(tenantId: string, user: JwtTenantUserPayload, id: string): Promise<void>;
    desmarcarInadimplente(tenantId: string, user: JwtTenantUserPayload, id: string): Promise<void>;
    consultarCnpj(user: JwtTenantUserPayload, dto: ConsultarCnpjDto): Promise<{} | undefined>;
    consultarCep(user: JwtTenantUserPayload, dto: ConsultarCepDto): Promise<{} | undefined>;
    criarComCnpj(tenantId: string, user: JwtTenantUserPayload, dto: ConsultarCnpjDto, idemKey?: string): Promise<ClienteResponseDto>;
    obterEstatisticas(tenantId: string): Promise<EstatisticasResumoDto>;
}
