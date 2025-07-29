// =============================================================================
// SmartPeças ERP - DTO de Resposta da API de CEP (ViaCEP)
// =============================================================================
// Arquivo: backend/src/modules/clientes/dto/cep-response.dto.ts
//
// Descrição: Define o formato da resposta retornada pela API pública ViaCEP
// para garantir segurança de tipo e facilitar o mapeamento de dados.
//
// Versão: 1.0.1
// Equipe SmartPeças
// Atualizado em: 28/06/2025
// =============================================================================

export interface CepResponseDto {
  cep: string;         // Ex: "01001-000"
  logradouro: string;  // Ex: "Praça da Sé"
  complemento?: string;  // Opcional, Ex: "lado ímpar"
  bairro: string;      // Ex: "Sé"
  localidade: string;  // Ex: "São Paulo"
  uf: string;          // Ex: "SP"
  ibge: string;        // Ex: "3550308"
  gia?: string;          // Opcional, Ex: "1004"
  ddd: string;         // Ex: "11"
  siafi: string;       // Ex: "7107"
  erro?: boolean; // Opcional, `true` quando CEP não é encontrado. O retorno da API ViaCEP para CEPs inválidos é um JSON com {"erro": true}, sem a propriedade `message`.
}
