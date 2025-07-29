import { ValidationOptions, ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
export declare class IsDocumentoValidoConstraint implements ValidatorConstraintInterface {
    validate(documento: any, args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): "O CPF informado não é válido." | "O CNPJ informado não é válido." | "O documento informado não é válido para o tipo de cliente especificado.";
}
export declare function IsDocumentoValido(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
