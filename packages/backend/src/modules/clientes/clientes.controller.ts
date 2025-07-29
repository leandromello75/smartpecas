// =============================================================================
// SmartPeças ERP - Controller - Módulo Clientes (REFATORADO)
// =============================================================================
// Arquivo: src/modules/clientes/clientes.controller.ts
//
// Descrição: Controller REST refatorado para orquestrar as operações de clientes,
// delegando a lógica para os serviços corretos.
//
// Versão: 3.1.0
// Equipe SmartPeças
// Atualizado em: 22/07/2025
// =============================================================================

import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe, Logger, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

// ✅ CORREÇÃO: Importa os 3 serviços
import { ClientesService } from './services/clientes.service';
import { ClientesIntegrationService } from './services/clientes-integration.service';
import { ClientesStatsService } from './services/clientes-stats.service';

import { CreateClienteDto, UpdateClienteDto, ConsultarClienteDto, ClienteResponseDto, ConsultarCnpjDto, /*ConsultarCepDto,*/ EstatisticasResumoDto } from './dto/cliente.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Cadastro de Clientes')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  private readonly logger = new Logger(ClientesController.name);

  constructor(
    private readonly clientesService: ClientesService,
    private readonly integrationService: ClientesIntegrationService,
    private readonly statsService: ClientesStatsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Cria um novo cliente.' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.', type: ClienteResponseDto })
  async criar(
    @Body(ValidationPipe) dto: CreateClienteDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<ClienteResponseDto> {
    this.logger.verbose(`Requisição para criar cliente com documento: ${dto.documento}`);
    // ✅ CORREÇÃO: Chama o serviço com a assinatura correta
    return this.clientesService.criar(dto, idemKey);
  }

  @Get()
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Lista clientes com filtros e paginação.' })
  async listar(@Query(ValidationPipe) filtros: ConsultarClienteDto) {
    // ✅ CORREÇÃO: Chama o serviço com a assinatura correta
    return this.clientesService.listar(filtros);
  }

  @Get('estatisticas')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Obtém estatísticas de resumo de clientes.' })
  @ApiResponse({ status: 200, type: EstatisticasResumoDto })
  async obterEstatisticas(): Promise<EstatisticasResumoDto> {
    // ✅ CORREÇÃO: Chama o serviço de estatísticas
    return this.statsService.obterEstatisticasResumo();
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca um cliente por ID.' })
  @ApiResponse({ status: 200, type: ClienteResponseDto })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string): Promise<ClienteResponseDto> {
    // ✅ CORREÇÃO: Chama o serviço com a assinatura correta
    return this.clientesService.buscarPorId(id);
  }

  @Put(':id')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Atualiza um cliente existente.' })
  @ApiResponse({ status: 200, type: ClienteResponseDto })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    // ✅ CORREÇÃO: Chama o serviço com a assinatura correta
    return this.clientesService.atualizar(id, dto);
  }

  // ... (outros endpoints como delete, patch, etc. devem seguir o mesmo padrão)

  // --- ROTAS DE INTEGRAÇÃO ---

  @Post('integracao/consultar-cnpj')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Consulta dados de um CNPJ.' })
  async consultarCnpj(@Body(ValidationPipe) dto: ConsultarCnpjDto) {
    // ✅ CORREÇÃO: Chama o serviço de integração
    return this.integrationService.consultarCnpj(dto);
  }

  @Post('integracao/criar-com-cnpj')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Cria um cliente a partir de um CNPJ.' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, type: ClienteResponseDto })
  async criarComCnpj(
    @Body() dto: ConsultarCnpjDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<ClienteResponseDto> {
    // ✅ CORREÇÃO: Chama o serviço de integração
    return this.integrationService.criarClienteComCnpj(dto.cnpj, {}, idemKey);
  }
}
