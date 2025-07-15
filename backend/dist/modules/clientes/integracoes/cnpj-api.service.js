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
var CnpjApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CnpjApiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
function hasMessageProperty(data) {
    return data && typeof data === 'object' && 'message' in data;
}
let CnpjApiService = CnpjApiService_1 = class CnpjApiService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(CnpjApiService_1.name);
        this.API_URL = 'https://www.receitaws.com.br/v1';
    }
    async consultar(cnpj) {
        this.logger.log(`Consultando CNPJ na API externa: ${cnpj}`);
        try {
            const url = `${this.API_URL}/cnpj/${cnpj}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            const responseData = response.data;
            if (responseData.status === 'ERROR' && hasMessageProperty(responseData)) {
                this.logger.warn(`Erro da API CNPJ: ${responseData.message}`);
                throw new common_1.BadRequestException(`Erro ao consultar CNPJ: ${responseData.message}`);
            }
            const mappedData = {
                status: responseData.status,
                message: responseData.message,
                abertura: responseData.abertura,
                data_situacao: responseData.data_situacao,
                nome: responseData.nome,
                fantasia: responseData.fantasia,
                cnpj: responseData.cnpj,
                email: responseData.email,
                telefone: responseData.telefone,
                cep: responseData.cep,
                logradouro: responseData.logradouro,
                numero: responseData.numero,
                complemento: responseData.complemento,
                bairro: responseData.bairro,
                municipio: responseData.municipio,
                uf: responseData.uf,
                atividadePrincipal: responseData.atividade_principal,
                payloadOriginal: responseData,
            };
            return mappedData;
        }
        catch (e) {
            const error = e;
            if (error.response) {
                const status = error.response.status;
                let message = `Erro na resposta da API externa (${status})`;
                if (hasMessageProperty(error.response.data)) {
                    message = error.response.data.message;
                }
                this.logger.error(`Falha HTTP ao consultar CNPJ ${cnpj}: Status ${status}, Mensagem: ${message}`, error.stack);
                if (status >= 400 && status < 500) {
                    throw new common_1.BadRequestException(`Erro da API externa: ${message}`);
                }
                throw new common_1.InternalServerErrorException('Serviço de CNPJ indisponível. Tente novamente mais tarde.');
            }
            this.logger.error(`Falha de rede/timeout ao consultar CNPJ ${cnpj}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Erro de conexão com o serviço externo. Verifique sua conexão ou tente novamente mais tarde.');
        }
    }
};
exports.CnpjApiService = CnpjApiService;
exports.CnpjApiService = CnpjApiService = CnpjApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], CnpjApiService);
//# sourceMappingURL=cnpj-api.service.js.map