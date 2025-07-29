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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ClientesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const clientes_service_1 = require("./services/clientes.service");
const clientes_integration_service_1 = require("./services/clientes-integration.service");
const clientes_stats_service_1 = require("./services/clientes-stats.service");
const cliente_dto_1 = require("./dto/cliente.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
let ClientesController = ClientesController_1 = class ClientesController {
    constructor(clientesService, integrationService, statsService) {
        this.clientesService = clientesService;
        this.integrationService = integrationService;
        this.statsService = statsService;
        this.logger = new common_1.Logger(ClientesController_1.name);
    }
    async criar(dto, idemKey) {
        this.logger.verbose(`Requisição para criar cliente com documento: ${dto.documento}`);
        return this.clientesService.criar(dto, idemKey);
    }
    async listar(filtros) {
        return this.clientesService.listar(filtros);
    }
    async obterEstatisticas() {
        return this.statsService.obterEstatisticasResumo();
    }
    async buscarPorId(id) {
        return this.clientesService.buscarPorId(id);
    }
    async atualizar(id, dto) {
        return this.clientesService.atualizar(id, dto);
    }
    async consultarCnpj(dto) {
        return this.integrationService.consultarCnpj(dto);
    }
    async criarComCnpj(dto, idemKey) {
        return this.integrationService.criarClienteComCnpj(dto.cnpj, {}, idemKey);
    }
};
exports.ClientesController = ClientesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria um novo cliente.' }),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cliente criado com sucesso.', type: cliente_dto_1.ClienteResponseDto }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Headers)('Idempotency-Key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cliente_dto_1.CreateClienteDto, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "criar", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales', 'cashier'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista clientes com filtros e paginação.' }),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cliente_dto_1.ConsultarClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('estatisticas'),
    (0, roles_decorator_1.Roles)('admin', 'manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém estatísticas de resumo de clientes.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: cliente_dto_1.EstatisticasResumoDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "obterEstatisticas", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales', 'cashier'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca um cliente por ID.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: cliente_dto_1.ClienteResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "buscarPorId", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza um cliente existente.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: cliente_dto_1.ClienteResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cliente_dto_1.UpdateClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Post)('integracao/consultar-cnpj'),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Consulta dados de um CNPJ.' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cliente_dto_1.ConsultarCnpjDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "consultarCnpj", null);
__decorate([
    (0, common_1.Post)('integracao/criar-com-cnpj'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria um cliente a partir de um CNPJ.' }),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    (0, swagger_1.ApiResponse)({ status: 201, type: cliente_dto_1.ClienteResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('Idempotency-Key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cliente_dto_1.ConsultarCnpjDto, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "criarComCnpj", null);
exports.ClientesController = ClientesController = ClientesController_1 = __decorate([
    (0, swagger_1.ApiTags)('Cadastro de Clientes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('clientes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [clientes_service_1.ClientesService,
        clientes_integration_service_1.ClientesIntegrationService,
        clientes_stats_service_1.ClientesStatsService])
], ClientesController);
//# sourceMappingURL=clientes.controller.js.map