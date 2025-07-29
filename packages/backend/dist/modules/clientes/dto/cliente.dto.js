"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CepResponseDto = exports.EstatisticasResumoDto = exports.ConsultarCepDto = exports.ConsultarCnpjDto = exports.ClienteResponseDto = exports.ConsultarClienteDto = exports.UpdateClienteDto = exports.CreateClienteDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const is_documento_valido_decorator_1 = require("../validacoes/decorators/is-documento-valido.decorator");
class CreateClienteDto {
}
exports.CreateClienteDto = CreateClienteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipo de cliente (Pessoa Física ou Jurídica)' }),
    (0, class_validator_1.IsEnum)(client_1.TipoCliente),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_a = typeof client_1.TipoCliente !== "undefined" && client_1.TipoCliente) === "function" ? _a : Object)
], CreateClienteDto.prototype, "tipoCliente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome ou Razão Social do cliente' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome fantasia do cliente' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "nomeFantasia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF ou CNPJ (somente dígitos)',
        example: '12345678901',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(11, 14),
    (0, class_validator_1.Matches)(/^[0-9]+$/, { message: 'O documento deve conter apenas números.' }),
    (0, is_documento_valido_decorator_1.IsDocumentoValido)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "documento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'E-mail principal', format: 'email' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Telefone (apenas dígitos)', example: '11987654321' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{10,11}$/, {
        message: 'Telefone deve conter 10 ou 11 dígitos numéricos.',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Logradouro (rua, avenida) do endereço' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número do endereço' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Complemento do endereço' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "complemento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bairro do endereço' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cidade do endereço' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "cidade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estado (UF) do endereço', example: 'SP' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'CEP principal do cliente', example: '01001000' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "cep", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateClienteDto.prototype, "dadosCnpjApi", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateClienteDto.prototype, "ultimaConsultaCnpj", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ readOnly: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "criadoPor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ readOnly: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "criadoPorNome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ readOnly: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "criadoPorIp", void 0);
class UpdateClienteDto extends (0, swagger_1.PartialType)(CreateClienteDto) {
}
exports.UpdateClienteDto = UpdateClienteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do cliente a ser atualizado' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateClienteDto.prototype, "id", void 0);
class ConsultarClienteDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
        this.sortOrder = 'ASC';
    }
}
exports.ConsultarClienteDto = ConsultarClienteDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Busca por nome ou razão social (parcial)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConsultarClienteDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtro por CPF ou CNPJ (apenas dígitos)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConsultarClienteDto.prototype, "documento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.TipoCliente, description: 'Filtrar por tipo: PF ou PJ' }),
    (0, class_validator_1.IsEnum)(client_1.TipoCliente),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof client_1.TipoCliente !== "undefined" && client_1.TipoCliente) === "function" ? _b : Object)
], ConsultarClienteDto.prototype, "tipoCliente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Boolean, description: 'Clientes ativos? true/false' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === 'true' ? true : value === 'false' ? false : value)),
    __metadata("design:type", Boolean)
], ConsultarClienteDto.prototype, "isAtivo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Boolean, description: 'Clientes inadimplentes? true/false' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === 'true' ? true : value === 'false' ? false : value)),
    __metadata("design:type", Boolean)
], ConsultarClienteDto.prototype, "isInadimplente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1, description: 'Número da página' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], ConsultarClienteDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10, description: 'Limite por página', maximum: 100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], ConsultarClienteDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ordenar por campo (ex: nome, criadoEm)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConsultarClienteDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'ASC', description: 'Direção da ordenação: ASC ou DESC' }),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConsultarClienteDto.prototype, "sortOrder", void 0);
class ClienteResponseDto {
}
exports.ClienteResponseDto = ClienteResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "tipoCliente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "nomeFantasia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "documento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "celular", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "website", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ClienteResponseDto.prototype, "isInadimplente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ClienteResponseDto.prototype, "isAtivo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ClienteResponseDto.prototype, "criadoEm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ClienteResponseDto.prototype, "atualizadoEm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "criadoPor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ClienteResponseDto.prototype, "atualizadoPor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], ClienteResponseDto.prototype, "enderecos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], ClienteResponseDto.prototype, "contatos", void 0);
class ConsultarCnpjDto {
}
exports.ConsultarCnpjDto = ConsultarCnpjDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CNPJ para consulta', example: '00000000000100' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[0-9]+$/, { message: 'O CNPJ deve conter apenas números.' }),
    (0, class_validator_1.Length)(14, 14, { message: 'O CNPJ deve ter 14 dígitos.' }),
    __metadata("design:type", String)
], ConsultarCnpjDto.prototype, "cnpj", void 0);
class ConsultarCepDto {
}
exports.ConsultarCepDto = ConsultarCepDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CEP para consulta', example: '01001000' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[0-9]{8}$/, { message: 'O CEP deve conter 8 dígitos numéricos.' }),
    __metadata("design:type", String)
], ConsultarCepDto.prototype, "cep", void 0);
class EstatisticasResumoDto {
}
exports.EstatisticasResumoDto = EstatisticasResumoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número total de clientes cadastrados.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "totalClientes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número de clientes com status ativo.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "clientesAtivos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número de clientes com status inativo.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "clientesInativos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número de clientes marcados como inadimplentes.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "clientesInadimplentes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número de clientes pessoa física.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "clientesPessoaFisica", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número de clientes pessoa jurídica.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "clientesPessoaJuridica", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número de clientes nos últimos 30 dias' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "clientesUltimos30Dias", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Percentual de Inadimplentes.' }),
    __metadata("design:type", Number)
], EstatisticasResumoDto.prototype, "percentualInadimplencia", void 0);
class CepResponseDto {
}
exports.CepResponseDto = CepResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '01001-000' }),
    __metadata("design:type", String)
], CepResponseDto.prototype, "cep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Praça da Sé' }),
    __metadata("design:type", String)
], CepResponseDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sé' }),
    __metadata("design:type", String)
], CepResponseDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'São Paulo' }),
    __metadata("design:type", String)
], CepResponseDto.prototype, "localidade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SP' }),
    __metadata("design:type", String)
], CepResponseDto.prototype, "uf", void 0);
//# sourceMappingURL=cliente.dto.js.map