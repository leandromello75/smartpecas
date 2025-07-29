// =============================================================================
// SmartPeças ERP - Serviço de Integração com API de CEP
// =============================================================================
// Arquivo: backend/src/modules/clientes/integracoes/cep-api.service.ts
//
// Descrição: Serviço responsável por consultar dados de endereço a partir de um CEP
// na API pública ViaCEP. Utiliza HttpService (Axios) com tratamento de erro e logging.
//
// Versão: 1.1.1
// Equipe SmartPeças
// Atualizado em: 28/06/2025
// =============================================================================

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { CepResponseDto } from '../dto/cep-response.dto'; // Importa o novo DTO

@Injectable()
export class CepApiService {
  private readonly logger = new Logger(CepApiService.name);
  private readonly API_URL = 'https://viacep.com.br/ws';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Consulta um CEP e retorna os dados do endereço.
   * @param cep - CEP no formato numérico (sem traços ou pontos)
   * @returns Objeto com os dados do endereço
   */
  async consultar(cep: string): Promise<CepResponseDto> {
    this.logger.log(`Consultando CEP na API externa: ${cep}`);

    try {
      const url = `${this.API_URL}/${cep}/json`;
      // Define a resposta como o DTO para segurança de tipos
      const response: AxiosResponse<CepResponseDto> = await firstValueFrom(this.httpService.get(url));
      
      const responseData = response.data;

      if (responseData.erro) { // Verifica o erro de negócio da API
        this.logger.warn(`CEP não encontrado pela API: ${cep}`);
        throw new BadRequestException(`CEP inválido ou não encontrado: ${cep}`);
      }
      
      // O TypeScript agora garante que o retorno está no formato CepResponseDto
      return responseData;

    } catch (e: unknown) {
      const error = e as AxiosError;
      
      // Verificação defensiva no tratamento de erro HTTP
      if (error.response) {
        const status = error.response.status;
        const msg = (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) ? error.response.data.message : `Erro da API externa (status ${status})`;
        
        this.logger.error(`Erro HTTP ao consultar CEP ${cep}: ${msg}`);
        
        if (status >= 400 && status < 500) {
          throw new BadRequestException(`Erro da API externa: ${msg}`);
        }

        throw new InternalServerErrorException('Erro no serviço de CEP. Tente novamente mais tarde.');
      }
      
      this.logger.error(`Erro de rede/timeout ao consultar CEP ${cep}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha na conexão com o serviço de CEP. Verifique sua rede.');
    }
  }
}