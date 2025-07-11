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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginAdminDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class LoginAdminDto {
}
exports.LoginAdminDto = LoginAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@smartpecas.com', description: 'E-mail do administrador global' }),
    (0, class_validator_1.IsEmail)({}, { message: 'E-mail inválido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'E-mail é obrigatório.' }),
    __metadata("design:type", String)
], LoginAdminDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'senhaSegura123', description: 'Senha de acesso (mínimo 6 caracteres)' }),
    (0, class_validator_1.IsString)({ message: 'A senha deve ser uma string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'A senha é obrigatória.' }),
    (0, class_validator_1.MinLength)(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    __metadata("design:type", String)
], LoginAdminDto.prototype, "password", void 0);
//# sourceMappingURL=login-admin.dto.js.map