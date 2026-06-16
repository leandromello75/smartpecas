import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cnpj, cpf } from 'cpf-cnpj-validator';

@ValidatorConstraint({ async: false })
export class IsDocumentoValidoConstraint implements ValidatorConstraintInterface {
  validate(documento: unknown, args: ValidationArguments): boolean {
    const tipoCliente = (args.object as { tipoCliente?: string }).tipoCliente;
    if (typeof documento !== 'string') return false;

    const documentoLimpo = documento.replace(/[^\d]/g, '');

    if (tipoCliente === 'PESSOA_FISICA') {
      return cpf.isValid(documentoLimpo);
    }

    if (tipoCliente === 'PESSOA_JURIDICA') {
      return cnpj.isValid(documentoLimpo);
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const tipoCliente = (args.object as { tipoCliente?: string }).tipoCliente;
    if (tipoCliente === 'PESSOA_FISICA') {
      return 'O CPF informado nao e valido.';
    }
    if (tipoCliente === 'PESSOA_JURIDICA') {
      return 'O CNPJ informado nao e valido.';
    }
    return 'O documento informado nao e valido para o tipo de cliente especificado.';
  }
}

export function IsDocumentoValido(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDocumentoValidoConstraint,
    });
  };
}
