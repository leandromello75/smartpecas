import { BadRequestException, Injectable } from '@nestjs/common';
import { TipoCliente } from '@prisma/client';
import { cnpj, cpf } from 'cpf-cnpj-validator';

@Injectable()
export class DocumentoValidatorService {
  validar(tipoCliente: TipoCliente, documento: string): string {
    const documentoLimpo = this.limpar(documento);

    switch (tipoCliente) {
      case TipoCliente.PESSOA_FISICA:
        if (!cpf.isValid(documentoLimpo)) {
          throw new BadRequestException('O CPF informado nao e valido.');
        }
        break;

      case TipoCliente.PESSOA_JURIDICA:
        if (!cnpj.isValid(documentoLimpo)) {
          throw new BadRequestException('O CNPJ informado nao e valido.');
        }
        break;

      default:
        throw new BadRequestException('Tipo de cliente invalido para validacao de documento.');
    }

    return documentoLimpo;
  }

  limpar(documento: string): string {
    if (!documento) {
      throw new BadRequestException('Documento nao informado.');
    }

    const documentoLimpo = documento.replace(/[^\d]/g, '');
    if (!documentoLimpo) {
      throw new BadRequestException('Documento nao informado.');
    }

    return documentoLimpo;
  }
}
