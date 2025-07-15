"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsDocumentoValidoConstraint = void 0;
exports.IsDocumentoValido = IsDocumentoValido;
const class_validator_1 = require("class-validator");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator");
let IsDocumentoValidoConstraint = class IsDocumentoValidoConstraint {
    validate(documento, args) {
        const tipoCliente = args.object.tipoCliente;
        if (!documento) {
            return false;
        }
        if (tipoCliente === 'PESSOA_FISICA') {
            return cpf_cnpj_validator_1.cpf.isValid(documento);
        }
        if (tipoCliente === 'PESSOA_JURIDICA') {
            return cpf_cnpj_validator_1.cnpj.isValid(documento);
        }
        return false;
    }
    defaultMessage(args) {
        const tipoCliente = args.object.tipoCliente;
        if (tipoCliente === 'PESSOA_FISICA') {
            return 'O CPF informado não é válido.';
        }
        if (tipoCliente === 'PESSOA_JURIDICA') {
            return 'O CNPJ informado não é válido.';
        }
        return 'O documento informado não é válido para o tipo de cliente especificado.';
    }
};
exports.IsDocumentoValidoConstraint = IsDocumentoValidoConstraint;
exports.IsDocumentoValidoConstraint = IsDocumentoValidoConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsDocumentoValidoConstraint);
function IsDocumentoValido(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsDocumentoValidoConstraint,
        });
    };
}
//# sourceMappingURL=is-documento-valido.decorator.js.map