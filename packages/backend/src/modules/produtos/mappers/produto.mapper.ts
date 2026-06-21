
import {
  ProductIdentifierResponseDto,
  ProductResponseDto,
  VehicleApplicationResponseDto,
} from '../dto/produto.dto';

export class ProdutoMapper {
  static toResponse(product: any): ProductResponseDto {
    const identifiers: ProductIdentifierResponseDto[] = product.identifiers
      ?.map((identifier: any) => ProdutoMapper.mapIdentifier(identifier)) ?? [];

    const primaryBarcode = identifiers.find((identifier) => (
      identifier.isPrimary && ['BARCODE', 'GTIN_UNITARIO', 'GTIN_CAIXA'].includes(identifier.type)
    )) ?? identifiers.find((identifier) => ['BARCODE', 'GTIN_UNITARIO', 'GTIN_CAIXA'].includes(identifier.type));

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      shortDescription: product.shortDescription ?? undefined,
      fiscalDescription: product.fiscalDescription ?? undefined,
      complementaryDescription: product.complementaryDescription ?? undefined,
      sku: product.sku ?? undefined,
      primaryBarcode: primaryBarcode?.code,
      price: ProdutoMapper.toNumber(product.price),
      unitOfMeasure: product.unitOfMeasure,
      status: product.status,
      type: product.type,
      qualityStatus: product.qualityStatus,
      brand: ProdutoMapper.mapNamedRef(product.brand),
      manufacturer: ProdutoMapper.mapNamedRef(product.manufacturer),
      group: ProdutoMapper.mapNamedRef(product.group),
      family: ProdutoMapper.mapNamedRef(product.family),
      category: ProdutoMapper.mapNamedRef(product.category),
      identifiers,
      taxProfile: ProdutoMapper.mapOptionalObject(product.taxProfile),
      pricing: ProdutoMapper.mapOptionalObject(product.pricing),
      cost: ProdutoMapper.mapOptionalObject(product.cost),
      stockSummary: ProdutoMapper.mapStockSummary(product.stocks),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toApplicationResponse(application: any): VehicleApplicationResponseDto {
    return {
      id: application.id,
      productId: application.productId,
      makeName: application.makeName ?? application.vehicleMake?.name ?? undefined,
      modelName: application.modelName ?? application.vehicleModel?.name ?? undefined,
      versionName: application.versionName ?? application.vehicleVersion?.name ?? undefined,
      yearStart: application.yearStart ?? undefined,
      yearEnd: application.yearEnd ?? undefined,
      engine: application.engine ?? application.vehicleVersion?.engine ?? undefined,
      position: application.position ?? undefined,
      side: application.side ?? undefined,
      axle: application.axle ?? undefined,
      technicalNote: application.technicalNote ?? undefined,
      restriction: application.restriction ?? undefined,
      relatedOemCode: application.relatedOemCode ?? undefined,
      source: application.source ?? undefined,
    };
  }

  private static mapIdentifier(identifier: any): ProductIdentifierResponseDto {
    return {
      id: identifier.id,
      type: identifier.type,
      code: identifier.code,
      description: identifier.description ?? undefined,
      source: identifier.source ?? undefined,
      isPrimary: identifier.isPrimary,
      isActive: identifier.isActive,
    };
  }

  private static mapNamedRef(value: any): { id: string; name: string } | undefined {
    if (!value) return undefined;
    return { id: value.id, name: value.name };
  }

  private static mapOptionalObject(value: any): Record<string, unknown> | undefined {
    if (!value) return undefined;

    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (['id', 'tenantId', 'productId', 'createdAt', 'updatedAt'].includes(key)) continue;
      result[key] = ProdutoMapper.mapValue(raw);
    }
    return result;
  }

  private static mapStockSummary(stocks: any[] | undefined) {
    if (!stocks?.length) {
      return {
        currentStock: 0,
        availableStock: 0,
        reservedStock: 0,
      };
    }

    return stocks.reduce(
      (acc, stock) => ({
        currentStock: acc.currentStock + ProdutoMapper.toNumber(stock.currentStock),
        availableStock: acc.availableStock + ProdutoMapper.toNumber(stock.availableStock),
        reservedStock: acc.reservedStock + ProdutoMapper.toNumber(stock.reservedStock),
      }),
      { currentStock: 0, availableStock: 0, reservedStock: 0 },
    );
  }

  private static mapValue(value: unknown): unknown {
    if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    if (value instanceof Date) return value;
    return value ?? undefined;
  }

  private static toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    if (typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    return Number(value);
  }
}