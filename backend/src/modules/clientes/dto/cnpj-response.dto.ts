// =============================================================================
// SmartPeças ERP - DTO - Resposta da API de CNPJ
// =============================================================================
// Arquivo: backend/src/modules/clientes/dto/cnpj-response.dto.ts
//
// Descrição: DTO que define a estrutura de dados da resposta da API de CNPJ.
//
// Versão: 1.2.1
// Equipe SmartPeças
// Atualizado em: 28/06/2025
// =============================================================================

/**
 * Define os possíveis status da resposta da API de CNPJ.
 * Garante segurança de tipos para o campo 'status'.
 */
export type CnpjStatus = 'OK' | 'ERROR';

/**
 * DTO que representa a resposta de dados de um CNPJ da API externa.
 * Define um contrato de dados claro para a integração.
 */
export interface CnpjResponseDto {
  status: CnpjStatus;
  message?: string; // Mensagem de erro, se houver

  // Adição da equipe: Data de fundação e situação cadastral
  abertura?: string;
  data_situacao?: string;

  // Dados básicos da empresa
  nome: string; // Razão Social
  fantasia: string; // Nome Fantasia
  cnpj: string; // CNPJ limpo

  // Contato
  email?: string;
  telefone?: string;

  // Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string; // Cidade
  uf: string; // Estado
  
  // Padronização para camelCase com mapeamento na camada de serviço
  atividadePrincipal: {
    text: string;
    code: string;
  }[];

  // Opcional: Persistir o payload completo da API para auditoria
  payloadOriginal?: any;
}
