// =============================================================================
// SmartPeças ERP - Decorator de Validação de Documento
// =============================================================================
// Arquivo: backend/src/modules/clientes/validacoes/decorators/is-documento-valido.decorator.ts
//
// Descrição: Decorator customizado para validar CPF ou CNPJ com base no
// tipo de cliente (Pessoa Física/Jurídica), usando a lógica de validação
// da biblioteca 'cpf-cnpj-validator'.
//
// Versão: 1.0.2
// Equipe SmartPeças
// Atualizado em: 29/06/2025
// =============================================================================

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cpf, cnpj } from 'cpf-cnpj-validator'; // CORREÇÃO: Importe os objetos 'cpf' e 'cnpj'

@ValidatorConstraint({ async: false })
export class IsDocumentoValidoConstraint implements ValidatorConstraintInterface {
  validate(documento: any, args: ValidationArguments) {
    const tipoCliente = (args.object as any).tipoCliente; // Acessa a propriedade 'tipoCliente' do DTO

    if (!documento) {
      return false; // A validação @IsNotEmpty deve lidar com isso
    }

    if (tipoCliente === 'PESSOA_FISICA') {
      return cpf.isValid(documento); // CORREÇÃO: Use o método 'isValid' do objeto 'cpf'
    }

    if (tipoCliente === 'PESSOA_JURIDICA') {
      return cnpj.isValid(documento); // CORREÇÃO: Use o método 'isValid' do objeto 'cnpj'
    }

    return false; // Retorna falso se o tipo de cliente não for especificado
  }

  defaultMessage(args: ValidationArguments) {
    const tipoCliente = (args.object as any).tipoCliente;
    if (tipoCliente === 'PESSOA_FISICA') {
      return 'O CPF informado não é válido.';
    }
    if (tipoCliente === 'PESSOA_JURIDICA') {
      return 'O CNPJ informado não é válido.';
    }
    return 'O documento informado não é válido para o tipo de cliente especificado.';
  }
}

/**
 * Decorator customizado para validar se um documento (CPF/CNPJ) é válido.
 * Requer que a propriedade 'tipoCliente' esteja presente no objeto.
 * @param validationOptions Opções de validação do class-validator.
 */
export function IsDocumentoValido(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDocumentoValidoConstraint,
    });
  };
}