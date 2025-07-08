// =============================================================================
// SmartPeças ERP - Controller - Módulo Clientes (Versão Final v2.3.1)
// =============================================================================
// Arquivo: backend/src/modules/clientes/clientes.controller.ts
//
// Descrição: Controller REST para gerenciamento de clientes com suporte a
// multi-tenancy, validações, auditoria e integração com APIs externas.
//
// Versão: 2.3.1
// Equipe SmartPeças
// Atualizado em: 03/07/2025 - 08:30:00 PM BRT
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ClientesService } from './clientes.service'; // Caminho relativo ajustado para o serviço
import {
  CreateClienteDto,
  UpdateClienteDto,
  ConsultarClienteDto,
  ClienteResponseDto,
  ConsultarCnpjDto,
  ConsultarCepDto,
  EstatisticasResumoDto, // Adicionado para o tipo de resposta da rota de estatísticas
} from './dto/cliente.dto'; // DTOs
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../shared/decorators/current-tenant.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { TransformInterceptor } from '../../shared/interceptors/transform.interceptor';
import { JwtTenantUserPayload } from '../../shared/interfaces/jwt-payload.interface';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ValidarDocumentoPipe } from './validacoes/pipes/validar-documento.pipe'; // Pipe de validação de CPF/CNPJ

@ApiTags('Cadastro de Clientes')
@ApiBearerAuth()
@Controller('api/v1/clientes') // Prefixo de rota padronizado
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard) // Guards globais para o controller
@UseInterceptors(LoggingInterceptor, TransformInterceptor) // Interceptors globais para o controller
export class ClientesController {
  private readonly logger = new Logger(ClientesController.name);

  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'sales') // Controle de acesso por papel
  @ApiOperation({ summary: 'Cria um novo cliente no sistema.' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Chave única para garantir idempotência da requisição.' })
  @ApiBody({ type: CreateClienteDto, description: 'Dados para criação do cliente.' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.', type: ClienteResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou obrigatórios ausentes.' })
  @ApiResponse({ status: 409, description: 'Conflito: cliente com este documento ou e-mail já existe.' })
  async criar(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Body(ValidationPipe) dto: CreateClienteDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<ClienteResponseDto> {
    const payload = {
      ...dto,
      criadoPor: user.id,
      criadoPorNome: user.name,
      criadoPorIp: user.ip,
    };
    this.logger.verbose(`[${tenantId}] Criando cliente por ${user.name} (${user.id}) com chave de idempotência: ${idemKey}`);
    return this.clientesService.criar(tenantId, payload, user, idemKey); // Passa 'user' para auditoria no service
  }

  @Get()
  @Roles('admin', 'manager', 'sales', 'cashier') // Controle de acesso
  @ApiOperation({ summary: 'Lista clientes com filtros e paginação.' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Número da página (padrão: 1).' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Itens por página (padrão: 10, máx: 100).' })
  @ApiQuery({ name: 'sortBy', type: String, required: false, description: 'Campo para ordenação (ex: nome, criadoEm).' })
  @ApiQuery({ name: 'sortOrder', enum: ['ASC', 'DESC'], required: false, description: 'Direção da ordenação (ASC/DESC).' })
  @ApiQuery({ name: 'nome', type: String, required: false, description: 'Filtrar por nome (parcial).' })
  @ApiQuery({ name: 'documento', type: String, required: false, description: 'Filtrar por documento (apenas dígitos).' })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso.', type: [ClienteResponseDto] })
  async listar(
    @CurrentTenant() tenantId: string,
    @Query(ValidationPipe) filtros: ConsultarClienteDto,
  ) {
    return this.clientesService.listar(tenantId, filtros);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca um cliente específico por ID.' })
  @ApiParam({ name: 'id', description: 'ID do cliente (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado com sucesso.', type: ClienteResponseDto })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async buscarPorId(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.buscarPorId(tenantId, id);
  }

  @Put(':id')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Atualiza os dados de um cliente existente.' })
  @ApiParam({ name: 'id', description: 'ID do cliente a ser atualizado (UUID).' })
  @ApiBody({ type: UpdateClienteDto, description: 'Dados para atualização do cliente.' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso.', type: ClienteResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou obrigatórios ausentes.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async atualizar(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    // Certifica-se de que o ID do DTO (se presente) corresponde ao ID do parâmetro de rota.
    if (dto.id && dto.id !== id) {
        throw new BadRequestException('O ID no corpo da requisição não corresponde ao ID da URL.');
    }
    const payload = {
      ...dto,
      atualizadoPor: user.id,
      atualizadoPorNome: user.name,
      atualizadoPorIp: user.ip,
    };
    this.logger.verbose(`[${tenantId}] Atualizando cliente ${id} por ${user.name}`);
    return this.clientesService.atualizar(tenantId, id, payload, user); // Passa 'user' para auditoria no service
  }

  @Get('busca/documento/:documento')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca um cliente por CPF ou CNPJ.' })
  @ApiParam({ name: 'documento', description: 'CPF ou CNPJ (apenas dígitos)', example: '11122233344' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado ou null.', type: ClienteResponseDto })
  @ApiResponse({ status: 400, description: 'Documento inválido.' })
  async buscarPorDocumento(
    @CurrentTenant() tenantId: string,
    @Param('documento', ValidarDocumentoPipe) documento: string,
  ): Promise<ClienteResponseDto | null> {
    return this.clientesService.buscarPorDocumento(tenantId, documento);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Desativa um cliente (exclusão lógica).' })
  @ApiParam({ name: 'id', description: 'ID do cliente a ser desativado (UUID).' })
  @ApiResponse({ status: 204, description: 'Cliente desativado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflito: cliente não pode ser desativado devido a pendências.' })
  async desativar(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.verbose(`[${tenantId}] Desativando cliente ${id} por ${user.name}`);
    return this.clientesService.desativar(tenantId, id, user);
  }

  @Patch(':id/reativar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Reativa um cliente desativado.' })
  @ApiParam({ name: 'id', description: 'ID do cliente a ser reativado (UUID).' })
  @ApiResponse({ status: 204, description: 'Cliente reativado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async reativar(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.verbose(`[${tenantId}] Reativando cliente ${id} por ${user.name}`);
    return this.clientesService.reativar(tenantId, id, user);
  }

  @Patch(':id/inadimplente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager', 'accountant')
  @ApiOperation({ summary: 'Marca um cliente como inadimplente.' })
  @ApiParam({ name: 'id', description: 'ID do cliente (UUID).' })
  @ApiResponse({ status: 204, description: 'Cliente marcado como inadimplente.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async marcarInadimplente(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.verbose(`[${tenantId}] Marcando inadimplência do cliente ${id} por ${user.name}`);
    return this.clientesService.alterarStatusInadimplencia(tenantId, id, true, user);
  }

  @Patch(':id/adimplente')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager', 'accountant')
  @ApiOperation({ summary: 'Desmarca um cliente como inadimplente.' })
  @ApiParam({ name: 'id', description: 'ID do cliente (UUID).' })
  @ApiResponse({ status: 204, description: 'Cliente desmarcado como inadimplente.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async desmarcarInadimplente(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.verbose(`[${tenantId}] Removendo inadimplência do cliente ${id} por ${user.name}`);
    return this.clientesService.alterarStatusInadimplencia(tenantId, id, false, user);
  }

  @Post('consultar-cnpj')
  @UseGuards(ThrottlerGuard)
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Consulta dados de um CNPJ na Receita Federal.' })
  @ApiBody({ type: ConsultarCnpjDto, description: 'CNPJ para consulta.' })
  @ApiResponse({ status: 200, description: 'Dados do CNPJ retornados.' })
  @ApiResponse({ status: 400, description: 'CNPJ inválido ou não encontrado.' })
  async consultarCnpj(
    @CurrentUser() user: JwtTenantUserPayload,
    @Body(ValidationPipe) dto: ConsultarCnpjDto,
  ) {
    this.logger.verbose(`Consulta de CNPJ por ${user.name}: ${dto.cnpj}`);
    return this.clientesService.consultarCnpj(dto, user.tenantId);
  }

  @Post('consultar-cep')
  @UseGuards(ThrottlerGuard)
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Consulta dados de um CEP.' })
  @ApiBody({ type: ConsultarCepDto, description: 'CEP para consulta.' })
  @ApiResponse({ status: 200, description: 'Dados do CEP retornados.' })
  @ApiResponse({ status: 400, description: 'CEP inválido ou não encontrado.' })
  async consultarCep(
    @CurrentUser() user: JwtTenantUserPayload,
    @Body(ValidationPipe) dto: ConsultarCepDto,
  ) {
    this.logger.verbose(`Consulta de CEP por ${user.name}: ${dto.cep}`);
    return this.clientesService.consultarCep(dto, user.tenantId);
  }

  @Post('criar-com-cnpj')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'sales')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Cria novo cliente PJ a partir de um CNPJ.' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiBody({ type: ConsultarCnpjDto, description: 'CNPJ para criação automatizada.' })
  @ApiResponse({ status: 201, description: 'Cliente PJ criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'CNPJ inválido ou falha na consulta externa.' })
  @ApiResponse({ status: 409, description: 'Conflito: cliente com este CNPJ já existe.' })
  async criarComCnpj(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtTenantUserPayload,
    @Body(ValidationPipe) dto: ConsultarCnpjDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<ClienteResponseDto> {
    this.logger.verbose(`[${tenantId}] Criando cliente por CNPJ ${dto.cnpj} (${user.name})`);
    return this.clientesService.criarClienteComCnpj(tenantId, dto.cnpj, {}, user, idemKey);
  }

  @Get('estatisticas/resumo')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Obtém estatísticas de resumo de clientes.' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas.', type: Object })
  async obterEstatisticas(
    @CurrentTenant() tenantId: string,
  ) {
    this.logger.verbose(`[${tenantId}] Obtendo estatísticas de clientes`);
    return this.clientesService.obterEstatisticasResumo(tenantId);
  }
}
