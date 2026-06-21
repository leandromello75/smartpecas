import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum ProductStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
  DESCONTINUADO = 'DESCONTINUADO',
}

export enum ProductType {
  MERCADORIA_REVENDA = 'MERCADORIA_REVENDA',
  PECA_OFICINA = 'PECA_OFICINA',
  KIT = 'KIT',
  SERVICO_ASSOCIADO = 'SERVICO_ASSOCIADO',
  CONSUMO_INTERNO = 'CONSUMO_INTERNO',
  BRINDE = 'BRINDE',
  GARANTIA = 'GARANTIA',
  SOB_ENCOMENDA = 'SOB_ENCOMENDA',
}

export enum ProductIdentifierType {
  SKU = 'SKU',
  BARCODE = 'BARCODE',
  GTIN_UNITARIO = 'GTIN_UNITARIO',
  GTIN_CAIXA = 'GTIN_CAIXA',
  CODIGO_FORNECEDOR = 'CODIGO_FORNECEDOR',
  CODIGO_FABRICANTE = 'CODIGO_FABRICANTE',
  CODIGO_OEM = 'CODIGO_OEM',
  CODIGO_ANTIGO = 'CODIGO_ANTIGO',
  CODIGO_SUBSTITUTO = 'CODIGO_SUBSTITUTO',
  CODIGO_EQUIVALENTE = 'CODIGO_EQUIVALENTE',
  CODIGO_CATALOGO = 'CODIGO_CATALOGO',
}

export enum ProductQualityStatus {
  COMPLETO = 'COMPLETO',
  INCOMPLETO = 'INCOMPLETO',
  PENDENTE_FISCAL = 'PENDENTE_FISCAL',
  PENDENTE_APLICACAO = 'PENDENTE_APLICACAO',
  PENDENTE_FOTO = 'PENDENTE_FOTO',
  PENDENTE_CUSTO = 'PENDENTE_CUSTO',
  BLOQUEADO_VENDA = 'BLOQUEADO_VENDA',
  BLOQUEADO_COMPRA = 'BLOQUEADO_COMPRA',
}

export enum StockMovementType {
  ENTRADA_COMPRA = 'ENTRADA_COMPRA',
  ENTRADA_MANUAL = 'ENTRADA_MANUAL',
  SAIDA_VENDA = 'SAIDA_VENDA',
  SAIDA_OS = 'SAIDA_OS',
  TRANSFERENCIA = 'TRANSFERENCIA',
  AJUSTE_POSITIVO = 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO = 'AJUSTE_NEGATIVO',
  DEVOLUCAO_CLIENTE = 'DEVOLUCAO_CLIENTE',
  DEVOLUCAO_FORNECEDOR = 'DEVOLUCAO_FORNECEDOR',
  GARANTIA = 'GARANTIA',
  PERDA = 'PERDA',
  AVARIA = 'AVARIA',
  CONSUMO_INTERNO = 'CONSUMO_INTERNO',
  BONIFICACAO = 'BONIFICACAO',
  INVENTARIO = 'INVENTARIO',
}

export enum ProductAttachmentType {
  FOTO_PRINCIPAL = 'FOTO_PRINCIPAL',
  FOTO_ADICIONAL = 'FOTO_ADICIONAL',
  FICHA_TECNICA = 'FICHA_TECNICA',
  MANUAL_INSTALACAO = 'MANUAL_INSTALACAO',
  CERTIFICADO = 'CERTIFICADO',
  TABELA_APLICACAO = 'TABELA_APLICACAO',
  LAUDO = 'LAUDO',
  PDF_FORNECEDOR = 'PDF_FORNECEDOR',
  IMAGEM_EMBALAGEM = 'IMAGEM_EMBALAGEM',
  IMAGEM_CODIGO_BARRAS = 'IMAGEM_CODIGO_BARRAS',
}

const toNumber = ({ value }: { value: unknown }) => (
  value === undefined || value === null || value === '' ? undefined : Number(value)
);

const toBoolean = ({ value }: { value: unknown }) => (
  value === undefined ? undefined : value === true || value === 'true'
);

export class CreateProductIdentifierDto {
  @ApiProperty({ enum: ProductIdentifierType })
  @IsEnum(ProductIdentifierType)
  type: ProductIdentifierType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class ProductTaxProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ncm?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ncmDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cest?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  commercialUnit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taxableUnit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  commercialGtin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taxableGtin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  exTipi?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fiscalItemType?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasSubstitutionTax?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMonophasic?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isImported?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isUsed?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  officialFiscalDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultFiscalProfile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  classificationSource?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  classificationReviewedAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  classificationValidFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  classificationValidTo?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresFiscalReview?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  blocksInvoiceWhenIncomplete?: boolean;
}

export class ProductPriceDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  salePrice: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  promotionalPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  minSalePrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  desiredMargin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Transform(toNumber)
  maxDiscountPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Transform(toNumber)
  commissionPercent?: number;
}

export class ProductCostDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  lastPurchaseCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  averageCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  fiscalAverageCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  managerialCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  replacementCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  freightCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  nonRecoverableTaxCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  extraCost?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  lastCostAt?: string;
}

export class InitialProductStockDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  currentStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(toNumber)
  maximumStock?: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fiscalDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  complementaryDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Codigo de barras principal do produto.' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Transform(toNumber)
  price: number;

  @ApiPropertyOptional({ default: 'UN' })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  manufacturerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  manufacturerName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  familyName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional({ type: [CreateProductIdentifierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductIdentifierDto)
  @IsOptional()
  identifiers?: CreateProductIdentifierDto[];

  @ApiPropertyOptional({ type: ProductTaxProfileDto })
  @ValidateNested()
  @Type(() => ProductTaxProfileDto)
  @IsOptional()
  taxProfile?: ProductTaxProfileDto;

  @ApiPropertyOptional({ type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  @IsOptional()
  pricing?: ProductPriceDto;

  @ApiPropertyOptional({ type: ProductCostDto })
  @ValidateNested()
  @Type(() => ProductCostDto)
  @IsOptional()
  cost?: ProductCostDto;

  @ApiPropertyOptional({ type: InitialProductStockDto })
  @ValidateNested()
  @Type(() => InitialProductStockDto)
  @IsOptional()
  initialStock?: InitialProductStockDto;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ConsultarProdutosDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  includeInactive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'name', enum: ['name', 'sku', 'price', 'createdAt', 'updatedAt'] })
  @IsIn(['name', 'sku', 'price', 'createdAt', 'updatedAt'])
  @IsOptional()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ default: 'asc', enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class BuscarProdutosDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  limit?: number = 20;
}

export class StockAdjustmentDto {
  @ApiProperty({ enum: StockMovementType })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  @Transform(toNumber)
  quantity: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warehouseName?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateVehicleApplicationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  vehicleMakeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  vehicleModelId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  vehicleVersionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  makeName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  modelName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  versionName?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  yearStart?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  yearEnd?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  engine?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  side?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  axle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  technicalNote?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  restriction?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  relatedOemCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  source?: string;
}

export class ConsultarAplicacaoVeicularDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  make?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  year?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  engine?: string;
}

export class ProductIdentifierResponseDto {
  id: string;
  type: string;
  code: string;
  description?: string;
  source?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export class ProductResponseDto {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  fiscalDescription?: string;
  complementaryDescription?: string;
  sku?: string;
  primaryBarcode?: string;
  price: number;
  unitOfMeasure: string;
  status: string;
  type: string;
  qualityStatus: string;
  brand?: { id: string; name: string };
  manufacturer?: { id: string; name: string };
  group?: { id: string; name: string };
  family?: { id: string; name: string };
  category?: { id: string; name: string };
  identifiers?: ProductIdentifierResponseDto[];
  taxProfile?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  cost?: Record<string, unknown>;
  stockSummary?: {
    currentStock: number;
    availableStock: number;
    reservedStock: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleApplicationResponseDto {
  id: string;
  productId: string;
  makeName?: string;
  modelName?: string;
  versionName?: string;
  yearStart?: number;
  yearEnd?: number;
  engine?: string;
  position?: string;
  side?: string;
  axle?: string;
  technicalNote?: string;
  restriction?: string;
  relatedOemCode?: string;
  source?: string;
}
