import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { from, retry, timer as rxjsTimer } from 'rxjs';
import { CnpjApiService } from '../integracoes/cnpj-api.service';
import { CepApiService } from '../integracoes/cep-api.service';
import { TenantThrottlerService } from '../throttling/tenant-throttler.service';
import {
  CepResponseDto,
  ConsultarCepDto,
  ConsultarCnpjDto,
  CreateClienteDto,
  CreateEnderecoDto,
  TipoCliente,
  TipoEndereco,
} from '../dto/cliente.dto';
import { CnpjResponseDto } from '../dto/cnpj-response.dto';
import { ClientesService } from './clientes.service';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

@Injectable()
export class ClientesIntegrationService {
  private readonly logger = new Logger(ClientesIntegrationService.name);
  private readonly CACHE_TTL_MS = 3600000;

  constructor(
    private readonly cnpjApi: CnpjApiService,
    private readonly cepApi: CepApiService,
    private readonly tenantThrottler: TenantThrottlerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly clientesService: ClientesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async consultarCnpj(dto: ConsultarCnpjDto): Promise<CnpjResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (tenantId) await this.tenantThrottler.checkLimit(tenantId, 'consultar-cnpj');

    const cnpj = this.limparDocumento(dto.cnpj);
    const cacheKey = `cnpj:${cnpj}`;
    const cached = await this.cacheManager.get(cacheKey) as CnpjResponseDto | undefined;
    if (cached) {
      this.logger.debug(`[${tenantId || 'global'}] CNPJ encontrado no cache: ${cnpj}`);
      return cached;
    }

    try {
      const result = await from(this.cnpjApi.consultar(cnpj))
        .pipe(
          retry({
            count: 3,
            delay: (_, retryCount) => {
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(
                `[${tenantId || 'global'}] Tentativa ${retryCount + 1} de consulta CNPJ ${cnpj} em ${delay}ms`,
              );
              return rxjsTimer(delay);
            },
          }),
        )
        .toPromise();

      if (!result?.cnpj) {
        throw new NotFoundException(`Dados para o CNPJ ${cnpj} nao foram encontrados na API externa.`);
      }

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_MS);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro final ao consultar CNPJ ${cnpj}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Servico de consulta de CNPJ indisponivel no momento.');
    }
  }

  async consultarCep(dto: ConsultarCepDto): Promise<CepResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (tenantId) await this.tenantThrottler.checkLimit(tenantId, 'consultar-cep');

    const cep = this.limparCep(dto.cep);
    const cacheKey = `cep:${cep}`;
    const cached = await this.cacheManager.get(cacheKey) as CepResponseDto | undefined;
    if (cached) {
      this.logger.debug(`[${tenantId || 'global'}] CEP encontrado no cache: ${cep}`);
      return cached;
    }

    try {
      const result = await from(this.cepApi.consultar(cep))
        .pipe(retry({ count: 3, delay: 1000 }))
        .toPromise();

      if (!result?.cep) {
        throw new NotFoundException(`Dados para o CEP ${cep} nao foram encontrados.`);
      }

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_MS);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro final ao consultar CEP ${cep}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Servico de consulta de CEP indisponivel no momento.');
    }
  }

  async criarClienteComCnpj(cnpj: string, meta: Partial<CreateClienteDto>, idemKey?: string) {
    let dadosCnpj: CnpjResponseDto;
    try {
      dadosCnpj = await this.consultarCnpj({ cnpj });
    } catch (error) {
      throw new BadRequestException(
        `Nao foi possivel obter dados para o CNPJ ${cnpj}. Motivo: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      );
    }

    const endereco = this.montarEnderecoAPartirDoCnpj(dadosCnpj);
    const dto = {
      tipoCliente: TipoCliente.PESSOA_JURIDICA,
      nome: dadosCnpj.nome,
      nomeFantasia: dadosCnpj.fantasia,
      documento: dadosCnpj.cnpj,
      email: dadosCnpj.email,
      ...(endereco && { enderecos: [endereco] }),
      ...meta,
    } as CreateClienteDto;

    return this.clientesService.criar(dto, idemKey);
  }

  private montarEnderecoAPartirDoCnpj(dadosCnpj: CnpjResponseDto): CreateEnderecoDto | undefined {
    if (!dadosCnpj.cep || !dadosCnpj.logradouro || !dadosCnpj.bairro || !dadosCnpj.municipio || !dadosCnpj.uf) {
      return undefined;
    }

    return {
      tipo: TipoEndereco.COMERCIAL,
      cep: dadosCnpj.cep,
      logradouro: dadosCnpj.logradouro,
      numero: dadosCnpj.numero || 'S/N',
      complemento: dadosCnpj.complemento,
      bairro: dadosCnpj.bairro,
      cidade: dadosCnpj.municipio,
      estado: dadosCnpj.uf,
      isPrincipal: true,
    };
  }

  private limparDocumento(documento: string): string {
    const limpo = documento.replace(/[^\d]/g, '');
    if (limpo.length !== 14) throw new BadRequestException('CNPJ deve conter 14 digitos.');
    return limpo;
  }

  private limparCep(cep: string): string {
    const limpo = cep.replace(/[^\d]/g, '');
    if (limpo.length !== 8) throw new BadRequestException('CEP deve conter 8 digitos.');
    return limpo;
  }
}
