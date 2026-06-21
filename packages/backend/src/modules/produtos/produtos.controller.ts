// =============================================================================
// SmartPeças ERP - Controller - Módulo Produtos
// =============================================================================
// Arquivo: src/modules/produtos/produtos.controller.ts
//
// Descrição: Controller REST refatorado para orquestrar as operações de produtos,
// delegando a lógica para os serviços corretos.
//
// Versão: 1.0
// Equipe SmartPeças
// Atualizado em: 20/06/2026
// =============================================================================
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import {
  BuscarProdutosDto,
  ConsultarAplicacaoVeicularDto,
  ConsultarProdutosDto,
  CreateProductDto,
  CreateVehicleApplicationDto,
  ProductCostDto,
  ProductPriceDto,
  ProductResponseDto,
  ProductTaxProfileDto,
  StockAdjustmentDto,
  UpdateProductDto,
  VehicleApplicationResponseDto,
} from './dto/produto.dto';
import { ProdutosService } from './services/produtos.service';

@ApiTags('Produtos e Catalogo')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post()
  @Roles('admin', 'manager', 'sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um produto com dados comerciais, identificadores e fundacao fiscal/preco/estoque.' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async criar(@Body(ValidationPipe) dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.produtosService.criar(dto);
  }

  @Get()
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Lista produtos com filtros de catalogo.' })
  async listar(@Query(ValidationPipe) filtros: ConsultarProdutosDto) {
    return this.produtosService.listar(filtros);
  }

  @Get('search')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca produtos por descricao, SKU, identificadores, marca, fabricante ou categoria.' })
  async buscar(@Query(ValidationPipe) filtros: BuscarProdutosDto) {
    return this.produtosService.buscar(filtros);
  }

  @Get('by-barcode/:barcode')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca produto por codigo de barras.' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async buscarPorCodigoBarras(@Param('barcode') barcode: string): Promise<ProductResponseDto> {
    return this.produtosService.buscarPorCodigoBarras(barcode);
  }

  @Get('barcode/:barcode')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Alias para busca de produto por codigo de barras.' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async buscarPorBarcodeAlias(@Param('barcode') barcode: string): Promise<ProductResponseDto> {
    return this.produtosService.buscarPorCodigoBarras(barcode);
  }

  @Get('oem/:code')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca produtos por codigo original/OEM.' })
  async buscarPorOem(@Param('code') code: string): Promise<ProductResponseDto[]> {
    return this.produtosService.buscarPorOem(code);
  }

  @Get('vehicle-application')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca produtos por aplicacao veicular.' })
  async buscarAplicacaoVeicular(@Query(ValidationPipe) filtros: ConsultarAplicacaoVeicularDto) {
    return this.produtosService.buscarAplicacaoVeicular(filtros);
  }

  @Get('compatible-vehicles/:productId')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Lista veiculos/aplicacoes compativeis com um produto.' })
  async obterVeiculosCompativeis(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<VehicleApplicationResponseDto[]> {
    return this.produtosService.listarAplicacoes(productId);
  }

  @Get(':id/tax-profile')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Obtem perfil fiscal cadastral do produto.' })
  async obterTaxProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.obterTaxProfile(id);
  }

  @Patch(':id/tax-profile')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Atualiza NCM, CEST, origem e dados fiscais cadastrais do produto.' })
  async atualizarTaxProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: ProductTaxProfileDto,
  ) {
    return this.produtosService.atualizarTaxProfile(id, dto);
  }

  @Get(':id/tax-configuration')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Obtem configuracao tributaria do produto para venda, compra e emissao fiscal.' })
  async obterConfiguracaoTributaria(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.obterTaxProfile(id);
  }

  @Patch(':id/tax-configuration')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Atualiza configuracao tributaria do produto.' })
  async atualizarConfiguracaoTributaria(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: ProductTaxProfileDto,
  ) {
    return this.produtosService.atualizarTaxProfile(id, dto);
  }

  @Get(':id/prices')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Obtem precificacao do produto.' })
  async obterPrecos(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.obterPrecos(id);
  }

  @Patch(':id/prices')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Atualiza preco, margem e limites comerciais do produto.' })
  async atualizarPrecos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: ProductPriceDto,
  ) {
    return this.produtosService.atualizarPrecos(id, dto);
  }

  @Get(':id/costs')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Obtem custos do produto.' })
  async obterCustos(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.obterCustos(id);
  }

  @Patch(':id/costs')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Atualiza custos gerenciais/fiscais do produto.' })
  async atualizarCustos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: ProductCostDto,
  ) {
    return this.produtosService.atualizarCustos(id, dto);
  }

  @Get(':id/stock')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Lista saldos de estoque do produto por deposito/localizacao.' })
  async listarEstoque(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.listarEstoque(id);
  }

  @Post(':id/stock-adjustment')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Registra movimentacao ou ajuste de estoque do produto.' })
  async ajustarEstoque(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: StockAdjustmentDto,
  ) {
    return this.produtosService.ajustarEstoque(id, dto);
  }

  @Get(':id/movements')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Lista ultimas movimentacoes de estoque do produto.' })
  async listarMovimentos(@Param('id', ParseUUIDPipe) id: string) {
    return this.produtosService.listarMovimentos(id);
  }

  @Post(':id/applications')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Adiciona aplicacao veicular ao produto.' })
  async adicionarAplicacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: CreateVehicleApplicationDto,
  ): Promise<VehicleApplicationResponseDto> {
    return this.produtosService.adicionarAplicacao(id, dto);
  }

  @Get(':id/applications')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Lista aplicacoes veiculares do produto.' })
  async listarAplicacoes(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleApplicationResponseDto[]> {
    return this.produtosService.listarAplicacoes(id);
  }

  @Delete(':id/applications/:applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remove uma aplicacao veicular do produto.' })
  async removerAplicacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ): Promise<void> {
    return this.produtosService.removerAplicacao(id, applicationId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales', 'cashier')
  @ApiOperation({ summary: 'Busca um produto por ID.' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    return this.produtosService.buscarPorId(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Atualiza dados cadastrais do produto.' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.produtosService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Inativa produto sem apagar historico operacional.' })
  async remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.produtosService.remover(id);
  }
}