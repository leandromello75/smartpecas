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
var CepApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CepApiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let CepApiService = CepApiService_1 = class CepApiService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(CepApiService_1.name);
        this.API_URL = 'https://viacep.com.br/ws';
    }
    async consultar(cep) {
        this.logger.log(`Consultando CEP na API externa: ${cep}`);
        try {
            const url = `${this.API_URL}/${cep}/json`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            const responseData = response.data;
            if (responseData.erro) {
                this.logger.warn(`CEP não encontrado pela API: ${cep}`);
                throw new common_1.BadRequestException(`CEP inválido ou não encontrado: ${cep}`);
            }
            return responseData;
        }
        catch (e) {
            const error = e;
            if (error.response) {
                const status = error.response.status;
                const msg = (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) ? error.response.data.message : `Erro da API externa (status ${status})`;
                this.logger.error(`Erro HTTP ao consultar CEP ${cep}: ${msg}`);
                if (status >= 400 && status < 500) {
                    throw new common_1.BadRequestException(`Erro da API externa: ${msg}`);
                }
                throw new common_1.InternalServerErrorException('Erro no serviço de CEP. Tente novamente mais tarde.');
            }
            this.logger.error(`Erro de rede/timeout ao consultar CEP ${cep}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Falha na conexão com o serviço de CEP. Verifique sua rede.');
        }
    }
};
exports.CepApiService = CepApiService;
exports.CepApiService = CepApiService = CepApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], CepApiService);
//# sourceMappingURL=cep-api.service.js.map