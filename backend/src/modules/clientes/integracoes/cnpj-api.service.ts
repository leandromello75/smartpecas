// =============================================================================
// SmartPeças ERP - Serviço de Integração com API de CNPJ
// =============================================================================
// Arquivo: backend/src/modules/clientes/integracoes/cnpj-api.service.ts
//
// Descrição: Serviço responsável por consultar dados de CNPJ na ReceitaWS
// ou outra API externa configurada. Utiliza HttpService (Axios) com tratamento
// de erro e logging para auditoria.
//
// Versão: 1.2.5
// Equipe SmartPeças
// Atualizado em: 28/06/2025
// =============================================================================

import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { CnpjResponseDto } from '../dto/cnpj-response.dto';

// === NOVO TYPE GUARD PARA A RESPOSTA DE ERRO ===
// Verifica se o objeto de dados da resposta tem a propriedade 'message'.
function hasMessageProperty(data: any): data is { message: string } {
    return data && typeof data === 'object' && 'message' in data;
}

@Injectable()
export class CnpjApiService {
  private readonly logger = new Logger(CnpjApiService.name);
  private readonly API_URL = 'https://www.receitaws.com.br/v1';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Consulta dados de um CNPJ usando a API externa e mapeia a resposta para um DTO.
   * @param cnpj - CNPJ numérico (apenas dígitos)
   * @returns Dados da empresa mapeados para CnpjResponseDto
   */
  async consultar(cnpj: string): Promise<CnpjResponseDto> {
    this.logger.log(`Consultando CNPJ na API externa: ${cnpj}`);

    try {
      const url = `${this.API_URL}/cnpj/${cnpj}`;
      const response: AxiosResponse<any> = await firstValueFrom(this.httpService.get(url));

      const responseData = response.data;
      // === CORREÇÃO: Usando o type guard para validar a estrutura da resposta ===
      if (responseData.status === 'ERROR' && hasMessageProperty(responseData)) {
        this.logger.warn(`Erro da API CNPJ: ${responseData.message}`);
        throw new BadRequestException(`Erro ao consultar CNPJ: ${responseData.message}`);
      }

      // Se não for um erro, o código continua a partir daqui, e a tipagem é segura
      const mappedData: CnpjResponseDto = {
        status: responseData.status,
        message: responseData.message,
        abertura: responseData.abertura,
        data_situacao: responseData.data_situacao,
        nome: responseData.nome,
        fantasia: responseData.fantasia,
        cnpj: responseData.cnpj,
        email: responseData.email,
        telefone: responseData.telefone,
        cep: responseData.cep,
        logradouro: responseData.logradouro,
        numero: responseData.numero,
        complemento: responseData.complemento,
        bairro: responseData.bairro,
        municipio: responseData.municipio,
        uf: responseData.uf,
        atividadePrincipal: responseData.atividade_principal,
        payloadOriginal: responseData,
      };

      return mappedData;
    } catch (e: unknown) {
      const error = e as AxiosError;
      
      if (error.response) {
        // CORREÇÃO: Usa o type guard para acessar a mensagem de erro
        const status = error.response.status;
        let message = `Erro na resposta da API externa (${status})`;
        
        if (hasMessageProperty(error.response.data)) {
            message = error.response.data.message;
        }

        this.logger.error(`Falha HTTP ao consultar CNPJ ${cnpj}: Status ${status}, Mensagem: ${message}`, error.stack);
        
        if (status >= 400 && status < 500) {
          throw new BadRequestException(`Erro da API externa: ${message}`);
        }
        throw new InternalServerErrorException('Serviço de CNPJ indisponível. Tente novamente mais tarde.');
      }
      
      this.logger.error(`Falha de rede/timeout ao consultar CNPJ ${cnpj}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Erro de conexão com o serviço externo. Verifique sua conexão ou tente novamente mais tarde.');
    }
  }
}
