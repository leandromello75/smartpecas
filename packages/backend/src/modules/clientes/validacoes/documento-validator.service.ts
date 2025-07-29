// =============================================================================
// SmartPeças ERP - DocumentoValidatorService
// =============================================================================
// Arquivo: backend/src/modules/clientes/validacoes/documento-validator.service.ts
//
// Descrição: Serviço para validar a sintaxe de documentos CPF e CNPJ, com base
// no tipo do cliente (Pessoa Física ou Jurídica). Utiliza a biblioteca
// cpf-cnpj-validator para garantir precisão nas validações.
//
// Versão: 1.0.1
// Equipe SmartPeças
// Atualizado em: 09/07/2025
// =============================================================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { TipoCliente } from '@prisma/client';
@Injectable()
export class DocumentoValidatorService {
  /**
   * Valida o documento fornecido com base no tipo do cliente.
   * Remove caracteres não numéricos antes da validação.
   * @param tipoCliente Tipo do cliente (Pessoa Física ou Jurídica)
   * @param documento CPF ou CNPJ
   * @throws BadRequestException se o documento for inválido
   */
  validar(tipoCliente: TipoCliente, documento: string): void {
    if (!documento) {
      throw new BadRequestException('Documento não informado.');
    }

    const documentoLimpo = documento.replace(/[^\d]/g, '');

    switch (tipoCliente) {
      case TipoCliente.PESSOA_FISICA:
        if (!cpf.isValid(documentoLimpo)) {
          throw new BadRequestException('O CPF informado não é válido.');
        }
        break;

      case TipoCliente.PESSOA_JURIDICA:
        if (!cnpj.isValid(documentoLimpo)) {
          throw new BadRequestException('O CNPJ informado não é válido.');
        }
        break;

      default:
        throw new BadRequestException('Tipo de cliente inválido para validação de documento.');
    }
  }
}
