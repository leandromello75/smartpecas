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
const clientes_service_1 = require("./clientes.service");
const cliente_dto_1 = require("./dto/cliente.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_tenant_decorator_1 = require("../../shared/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const logging_interceptor_1 = require("../../shared/interceptors/logging.interceptor");
const transform_interceptor_1 = require("../../shared/interceptors/transform.interceptor");
const throttler_1 = require("@nestjs/throttler");
const validar_documento_pipe_1 = require("./validacoes/pipes/validar-documento.pipe");
let ClientesController = ClientesController_1 = class ClientesController {
    constructor(clientesService) {
        this.clientesService = clientesService;
        this.logger = new common_1.Logger(ClientesController_1.name);
    }
    async criar(tenantId, user, dto, idemKey) {
        const payload = {
            ...dto,
            criadoPor: user.id,
            criadoPorNome: user.name,
            criadoPorIp: user.ip,
        };
        this.logger.verbose(`[${tenantId}] Criando cliente por ${user.name} (${user.id}) com chave de idempotência: ${idemKey}`);
        return this.clientesService.criar(tenantId, payload, user, idemKey);
    }
    async listar(tenantId, filtros) {
        return this.clientesService.listar(tenantId, filtros);
    }
    async buscarPorId(tenantId, id) {
        return this.clientesService.buscarPorId(tenantId, id);
    }
    async atualizar(tenantId, user, id, dto) {
        if (dto.id && dto.id !== id) {
            throw new common_1.BadRequestException('O ID no corpo da requisição não corresponde ao ID da URL.');
        }
        const payload = {
            ...dto,
            atualizadoPor: user.id,
            atualizadoPorNome: user.name,
            atualizadoPorIp: user.ip,
        };
        this.logger.verbose(`[${tenantId}] Atualizando cliente ${id} por ${user.name}`);
        return this.clientesService.atualizar(tenantId, id, payload, user);
    }
    async buscarPorDocumento(tenantId, documento) {
        return this.clientesService.buscarPorDocumento(tenantId, documento);
    }
    async desativar(tenantId, user, id) {
        this.logger.verbose(`[${tenantId}] Desativando cliente ${id} por ${user.name}`);
        return this.clientesService.desativar(tenantId, id, user);
    }
    async reativar(tenantId, user, id) {
        this.logger.verbose(`[${tenantId}] Reativando cliente ${id} por ${user.name}`);
        return this.clientesService.reativar(tenantId, id, user);
    }
    async marcarInadimplente(tenantId, user, id) {
        this.logger.verbose(`[${tenantId}] Marcando inadimplência do cliente ${id} por ${user.name}`);
        return this.clientesService.alterarStatusInadimplencia(tenantId, id, true, user);
    }
    async desmarcarInadimplente(tenantId, user, id) {
        this.logger.verbose(`[${tenantId}] Removendo inadimplência do cliente ${id} por ${user.name}`);
        return this.clientesService.alterarStatusInadimplencia(tenantId, id, false, user);
    }
    async consultarCnpj(user, dto) {
        this.logger.verbose(`Consulta de CNPJ por ${user.name}: ${dto.cnpj}`);
        return this.clientesService.consultarCnpj(dto, user.tenantId);
    }
    async consultarCep(user, dto) {
        this.logger.verbose(`Consulta de CEP por ${user.name}: ${dto.cep}`);
        return this.clientesService.consultarCep(dto, user.tenantId);
    }
    async criarComCnpj(tenantId, user, dto, idemKey) {
        this.logger.verbose(`[${tenantId}] Criando cliente por CNPJ ${dto.cnpj} (${user.name})`);
        return this.clientesService.criarClienteComCnpj(tenantId, dto.cnpj, {}, user, idemKey);
    }
    async obterEstatisticas(tenantId) {
        this.logger.verbose(`[${tenantId}] Obtendo estatísticas de clientes`);
        return this.clientesService.obterEstatisticasResumo(tenantId);
    }
};
exports.ClientesController = ClientesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Cria um novo cliente no sistema.' }),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false, description: 'Chave única para garantir idempotência da requisição.' }),
    (0, swagger_1.ApiBody)({ type: cliente_dto_1.CreateClienteDto, description: 'Dados para criação do cliente.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cliente criado com sucesso.', type: cliente_dto_1.ClienteResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou obrigatórios ausentes.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflito: cliente com este documento ou e-mail já existe.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(3, (0, common_1.Headers)('Idempotency-Key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, cliente_dto_1.CreateClienteDto, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "criar", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales', 'cashier'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista clientes com filtros e paginação.' }),
    (0, swagger_1.ApiQuery)({ name: 'page', type: Number, required: false, description: 'Número da página (padrão: 1).' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false, description: 'Itens por página (padrão: 10, máx: 100).' }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', type: String, required: false, description: 'Campo para ordenação (ex: nome, criadoEm).' }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', enum: ['ASC', 'DESC'], required: false, description: 'Direção da ordenação (ASC/DESC).' }),
    (0, swagger_1.ApiQuery)({ name: 'nome', type: String, required: false, description: 'Filtrar por nome (parcial).' }),
    (0, swagger_1.ApiQuery)({ name: 'documento', type: String, required: false, description: 'Filtrar por documento (apenas dígitos).' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de clientes retornada com sucesso.', type: [cliente_dto_1.ClienteResponseDto] }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cliente_dto_1.ConsultarClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales', 'cashier'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca um cliente específico por ID.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do cliente (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente encontrado com sucesso.', type: cliente_dto_1.ClienteResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "buscarPorId", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza os dados de um cliente existente.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do cliente a ser atualizado (UUID).' }),
    (0, swagger_1.ApiBody)({ type: cliente_dto_1.UpdateClienteDto, description: 'Dados para atualização do cliente.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente atualizado com sucesso.', type: cliente_dto_1.ClienteResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou obrigatórios ausentes.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, cliente_dto_1.UpdateClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Get)('busca/documento/:documento'),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales', 'cashier'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca um cliente por CPF ou CNPJ.' }),
    (0, swagger_1.ApiParam)({ name: 'documento', description: 'CPF ou CNPJ (apenas dígitos)', example: '11122233344' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente encontrado ou null.', type: cliente_dto_1.ClienteResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Documento inválido.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('documento', validar_documento_pipe_1.ValidarDocumentoPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "buscarPorDocumento", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('admin', 'manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Desativa um cliente (exclusão lógica).' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do cliente a ser desativado (UUID).' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Cliente desativado com sucesso.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflito: cliente não pode ser desativado devido a pendências.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "desativar", null);
__decorate([
    (0, common_1.Patch)(':id/reativar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('admin', 'manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Reativa um cliente desativado.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do cliente a ser reativado (UUID).' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Cliente reativado com sucesso.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "reativar", null);
__decorate([
    (0, common_1.Patch)(':id/inadimplente'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'accountant'),
    (0, swagger_1.ApiOperation)({ summary: 'Marca um cliente como inadimplente.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do cliente (UUID).' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Cliente marcado como inadimplente.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "marcarInadimplente", null);
__decorate([
    (0, common_1.Patch)(':id/adimplente'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'accountant'),
    (0, swagger_1.ApiOperation)({ summary: 'Desmarca um cliente como inadimplente.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do cliente (UUID).' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Cliente desmarcado como inadimplente.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "desmarcarInadimplente", null);
__decorate([
    (0, common_1.Post)('consultar-cnpj'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Consulta dados de um CNPJ na Receita Federal.' }),
    (0, swagger_1.ApiBody)({ type: cliente_dto_1.ConsultarCnpjDto, description: 'CNPJ para consulta.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados do CNPJ retornados.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'CNPJ inválido ou não encontrado.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cliente_dto_1.ConsultarCnpjDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "consultarCnpj", null);
__decorate([
    (0, common_1.Post)('consultar-cep'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Consulta dados de um CEP.' }),
    (0, swagger_1.ApiBody)({ type: cliente_dto_1.ConsultarCepDto, description: 'CEP para consulta.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados do CEP retornados.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'CEP inválido ou não encontrado.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cliente_dto_1.ConsultarCepDto]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "consultarCep", null);
__decorate([
    (0, common_1.Post)('criar-com-cnpj'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('admin', 'manager', 'sales'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Cria novo cliente PJ a partir de um CNPJ.' }),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    (0, swagger_1.ApiBody)({ type: cliente_dto_1.ConsultarCnpjDto, description: 'CNPJ para criação automatizada.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cliente PJ criado com sucesso.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'CNPJ inválido ou falha na consulta externa.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflito: cliente com este CNPJ já existe.' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(3, (0, common_1.Headers)('Idempotency-Key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, cliente_dto_1.ConsultarCnpjDto, String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "criarComCnpj", null);
__decorate([
    (0, common_1.Get)('estatisticas/resumo'),
    (0, roles_decorator_1.Roles)('admin', 'manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtém estatísticas de resumo de clientes.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas retornadas.', type: Object }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesController.prototype, "obterEstatisticas", null);
exports.ClientesController = ClientesController = ClientesController_1 = __decorate([
    (0, swagger_1.ApiTags)('Cadastro de Clientes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/clientes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(logging_interceptor_1.LoggingInterceptor, transform_interceptor_1.TransformInterceptor),
    __metadata("design:paramtypes", [clientes_service_1.ClientesService])
], ClientesController);
//# sourceMappingURL=clientes.controller.js.map