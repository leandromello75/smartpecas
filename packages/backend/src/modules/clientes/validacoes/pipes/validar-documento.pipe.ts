import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { cpf, cnpj } from 'cpf-cnpj-validator';

@Injectable()
export class ValidarDocumentoPipe implements PipeTransform {
  transform(value: any) {
    if (!value) throw new BadRequestException('Documento é obrigatório.');
    const doc = value.replace(/[^\d]/g, '');
    if (!cpf.isValid(doc) && !cnpj.isValid(doc)) {
      throw new BadRequestException('Formato de CPF ou CNPJ inválido.');
    }
    return doc;
  }
}
