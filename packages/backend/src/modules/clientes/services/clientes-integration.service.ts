// =============================================================================
// SmartPeças ERP - Service - Módulo Clientes (Integrações)
// =============================================================================
// Arquivo: backend/src/modules/clientes/services/clientes-integration.service.ts
//
// Descrição: Serviço responsável pela orquestração de lógicas que envolvem
// integrações com APIs externas (CNPJ, CEP), incluindo cache, retry e
// rate limiting. Desacoplado da camada de controller via TenantContext.
//
// Versão: 5.1.0 (Corrigida)
// Equipe SmartPeças
// Atualizado em: 18/07/2025
// =============================================================================

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { from, retry, timer as rxjsTimer } from 'rxjs';
import { CnpjApiService } from '../integracoes/cnpj-api.service';
import { CepApiService } from '../integracoes/cep-api.service';
import { TenantThrottlerService } from '../throttling/tenant-throttler.service';
import { CreateClienteDto, ConsultarCnpjDto, ConsultarCepDto, CepResponseDto } from '../dto/cliente.dto'; // CepResponseDto vem daqui
import { CnpjResponseDto } from '../dto/cnpj-response.dto';
import { ClientesService } from './clientes.service';
import { TenantContextService } from '../../../common/tenant-context/tenant-context.service';

@Injectable()
export class ClientesIntegrationService {
  private readonly logger = new Logger(ClientesIntegrationService.name);
  private readonly CACHE_TTL_LONGO = 3600000; // 1 hora em MS

  constructor(
    private readonly cnpjApi: CnpjApiService,
    private readonly cepApi: CepApiService,
    private readonly tenantThrottler: TenantThrottlerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly clientesService: ClientesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Consulta um CNPJ, com cache e retry.
   * O tenantId é obtido implicitamente do contexto da requisição.
   */
  async consultarCnpj(dto: ConsultarCnpjDto): Promise<CnpjResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (tenantId) {
      await this.tenantThrottler.checkLimit(tenantId, 'consultar-cnpj');
    }

    const cacheKey = `cnpj:${dto.cnpj}`;
    const cached = await this.cacheManager.get<CnpjResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`[${tenantId || 'global'}] CNPJ encontrado no cache: ${dto.cnpj}`);
      return cached;
    }

    try {
      const result = await from(this.cnpjApi.consultar(dto.cnpj))
        .pipe(
          retry({
            count: 3,
            delay: (_, retryCount) => {
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(`[${tenantId || 'global'}] Tentativa ${retryCount + 1} de consulta CNPJ ${dto.cnpj} em ${delay}ms`);
              return rxjsTimer(delay);
            },
          }),
        )
        .toPromise();

      if (!result || !result.cnpj) {
        throw new NotFoundException(`Dados para o CNPJ ${dto.cnpj} não foram encontrados na API externa.`);
      }

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
      return result;
    } catch (error) {
        this.logger.error(`Erro final ao consultar CNPJ ${dto.cnpj}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        if (error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException('Serviço de consulta de CNPJ indisponível no momento.');
    }
  }

  /**
   * Consulta um CEP, com cache e retry.
   * O tenantId é obtido implicitamente do contexto da requisição.
   */
  async consultarCep(dto: ConsultarCepDto): Promise<CepResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (tenantId) {
        await this.tenantThrottler.checkLimit(tenantId, 'consultar-cep');
    }

    const cacheKey = `cep:${dto.cep}`;
    const cached = await this.cacheManager.get<CepResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`[${tenantId || 'global'}] CEP encontrado no cache: ${dto.cep}`);
      return cached;
    }
    
    try {
        const result = await from(this.cepApi.consultar(dto.cep))
        .pipe(
          retry({ count: 3, delay: 1000 })
        )
        .toPromise();

      if (!result || !result.cep) {
        throw new NotFoundException(`Dados para o CEP ${dto.cep} não foram encontrados.`);
      }

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
      return result;
    } catch (error) {
        this.logger.error(`Erro final ao consultar CEP ${dto.cep}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        if (error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException('Serviço de consulta de CEP indisponível no momento.');
    }
  }

  /**
   * Orquestra a criação de um cliente a partir de uma consulta de CNPJ.
   */
  async criarClienteComCnpj(cnpj: string, meta: Partial<CreateClienteDto>, idemKey?: string) {
    let dadosCnpj: CnpjResponseDto;
    try {
      dadosCnpj = await this.consultarCnpj({ cnpj });
    } catch (error) {
      throw new BadRequestException(`Não foi possível obter dados para o CNPJ ${cnpj}. Motivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    const dto: CreateClienteDto = {
      tipoCliente: 'PESSOA_JURIDICA',
      nome: dadosCnpj.nome,
      nomeFantasia: dadosCnpj.fantasia,
      documento: dadosCnpj.cnpj,
      email: dadosCnpj.email,
      telefone: dadosCnpj.telefone,
      cep: dadosCnpj.cep,
      logradouro: dadosCnpj.logradouro,
      numero: dadosCnpj.numero,
      complemento: dadosCnpj.complemento,
      bairro: dadosCnpj.bairro,
      cidade: dadosCnpj.municipio,
      estado: dadosCnpj.uf,
      ...meta,
    };

    return this.clientesService.criar(dto, idemKey);
  }
}