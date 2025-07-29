"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidarDocumentoPipe = void 0;
const common_1 = require("@nestjs/common");
const brazilian_documents_1 = require("brazilian-documents");
let ValidarDocumentoPipe = class ValidarDocumentoPipe {
    transform(value) {
        if (!value) {
            throw new common_1.BadRequestException('Documento é obrigatório.');
        }
        const documentoLimpo = value.replace(/[^\d]/g, '');
        if (!(0, brazilian_documents_1.isCPF)(documentoLimpo) && !(0, brazilian_documents_1.isCNPJ)(documentoLimpo)) {
            throw new common_1.BadRequestException('Formato de CPF ou CNPJ inválido.');
        }
        return documentoLimpo;
    }
};
exports.ValidarDocumentoPipe = ValidarDocumentoPipe;
exports.ValidarDocumentoPipe = ValidarDocumentoPipe = __decorate([
    (0, common_1.Injectable)()
], ValidarDocumentoPipe);
//# sourceMappingURL=validar-documento.pipe.js.map