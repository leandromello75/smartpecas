"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentoValidatorService = void 0;
const common_1 = require("@nestjs/common");
const cpf_cnpj_validator_1 = require("cpf-cnpj-validator");
const client_1 = require("@prisma/client");
let DocumentoValidatorService = class DocumentoValidatorService {
    validar(tipoCliente, documento) {
        if (!documento) {
            throw new common_1.BadRequestException('Documento não informado.');
        }
        const documentoLimpo = documento.replace(/[^\d]/g, '');
        switch (tipoCliente) {
            case client_1.TipoCliente.PESSOA_FISICA:
                if (!cpf_cnpj_validator_1.cpf.isValid(documentoLimpo)) {
                    throw new common_1.BadRequestException('O CPF informado não é válido.');
                }
                break;
            case client_1.TipoCliente.PESSOA_JURIDICA:
                if (!cpf_cnpj_validator_1.cnpj.isValid(documentoLimpo)) {
                    throw new common_1.BadRequestException('O CNPJ informado não é válido.');
                }
                break;
            default:
                throw new common_1.BadRequestException('Tipo de cliente inválido para validação de documento.');
        }
    }
};
exports.DocumentoValidatorService = DocumentoValidatorService;
exports.DocumentoValidatorService = DocumentoValidatorService = __decorate([
    (0, common_1.Injectable)()
], DocumentoValidatorService);
//# sourceMappingURL=documento-validator.service.js.map