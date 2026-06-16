import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ClienteResponseDto,
  ConsultarClienteDto,
  ConsultarCnpjDto,
  CreateClienteDto,
  EstatisticasResumoDto,
  UpdateClienteDto,
} from './dto/cliente.dto';
import { ClientesService } from './services/clientes.service';
import { ClientesIntegrationService } from './services/clientes-integration.service';
import { ClientesStatsService } from './services/clientes-stats.service';
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
    this.logger.verbose(`Requisicao para criar cliente com documento: ${dto.documento}`);
    return this.clientesService.criar(dto, idemKey);
  }

  @Get()
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Lista clientes com filtros e paginacao.' })
  async listar(@Query(ValidationPipe) filtros: ConsultarClienteDto) {
    return this.clientesService.listar(filtros);
  }

  @Get('estatisticas')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Obtem estatisticas de resumo de clientes.' })
  @ApiResponse({ status: 200, type: EstatisticasResumoDto })
  async obterEstatisticas(): Promise<EstatisticasResumoDto> {
    return this.statsService.obterEstatisticasResumo();
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca um cliente por ID.' })
  @ApiResponse({ status: 200, type: ClienteResponseDto })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string): Promise<ClienteResponseDto> {
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
    return this.clientesService.atualizar(id, dto);
  }

  @Patch(':id/desativar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Desativa um cliente sem remover seu historico.' })
  @ApiResponse({ status: 204, description: 'Cliente desativado com sucesso.' })
  async desativar(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clientesService.desativar(id);
  }

  @Patch(':id/reativar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Reativa um cliente desativado.' })
  @ApiResponse({ status: 204, description: 'Cliente reativado com sucesso.' })
  async reativar(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clientesService.reativar(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @ApiOperation({ summary: 'Remove um cliente quando nao ha historico vinculado.' })
  @ApiResponse({ status: 204, description: 'Cliente removido com sucesso.' })
  async remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clientesService.remover(id);
  }

  @Post('integracao/consultar-cnpj')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Consulta dados de um CNPJ.' })
  async consultarCnpj(@Body(ValidationPipe) dto: ConsultarCnpjDto) {
    return this.integrationService.consultarCnpj(dto);
  }

  @Post('integracao/criar-com-cnpj')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Cria um cliente a partir de um CNPJ.' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, type: ClienteResponseDto })
  async criarComCnpj(
    @Body(ValidationPipe) dto: ConsultarCnpjDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<ClienteResponseDto> {
    return this.integrationService.criarClienteComCnpj(dto.cnpj, {}, idemKey);
  }
}
