// backend/src/modules/clientes/validacoes/pipes/validar-documento.pipe.ts
// Versão: 1.0.0
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isCPF, isCNPJ } from 'brazilian-documents'; // Ou 'cpf-cnpj-validator'

@Injectable()
export class ValidarDocumentoPipe implements PipeTransform {
  transform(value: any) {
    if (!value) {
      throw new BadRequestException('Documento é obrigatório.');
    }
    const documentoLimpo = value.replace(/[^\d]/g, '');
    // Adapte para a biblioteca que você está usando (cpf-cnpj-validator)
    // Ex: if (!cpf.isValid(documentoLimpo) && !cnpj.isValid(documentoLimpo)) {
    // ou use a lógica do seu DocumentoValidatorService
    if (!isCPF(documentoLimpo) && !isCNPJ(documentoLimpo)) { // Exemplo com brazilian-documents
      throw new BadRequestException('Formato de CPF ou CNPJ inválido.');
    }
    return documentoLimpo;
  }
}
