-- Product foundation: catalog, fiscal profile, price/cost, stock and vehicle application.

CREATE TYPE "ProductStatus" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO', 'DESCONTINUADO');
CREATE TYPE "ProductType" AS ENUM ('MERCADORIA_REVENDA', 'PECA_OFICINA', 'KIT', 'SERVICO_ASSOCIADO', 'CONSUMO_INTERNO', 'BRINDE', 'GARANTIA', 'SOB_ENCOMENDA');
CREATE TYPE "ProductIdentifierType" AS ENUM ('SKU', 'BARCODE', 'GTIN_UNITARIO', 'GTIN_CAIXA', 'CODIGO_FORNECEDOR', 'CODIGO_FABRICANTE', 'CODIGO_OEM', 'CODIGO_ANTIGO', 'CODIGO_SUBSTITUTO', 'CODIGO_EQUIVALENTE', 'CODIGO_CATALOGO');
CREATE TYPE "ProductQualityStatus" AS ENUM ('COMPLETO', 'INCOMPLETO', 'PENDENTE_FISCAL', 'PENDENTE_APLICACAO', 'PENDENTE_FOTO', 'PENDENTE_CUSTO', 'BLOQUEADO_VENDA', 'BLOQUEADO_COMPRA');
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA_COMPRA', 'ENTRADA_MANUAL', 'SAIDA_VENDA', 'SAIDA_OS', 'TRANSFERENCIA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCAO_CLIENTE', 'DEVOLUCAO_FORNECEDOR', 'GARANTIA', 'PERDA', 'AVARIA', 'CONSUMO_INTERNO', 'BONIFICACAO', 'INVENTARIO');
CREATE TYPE "ProductAttachmentType" AS ENUM ('FOTO_PRINCIPAL', 'FOTO_ADICIONAL', 'FICHA_TECNICA', 'MANUAL_INSTALACAO', 'CERTIFICADO', 'TABELA_APLICACAO', 'LAUDO', 'PDF_FORNECEDOR', 'IMAGEM_EMBALAGEM', 'IMAGEM_CODIGO_BARRAS');

ALTER TABLE "products"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "fiscalDescription" TEXT,
  ADD COLUMN "complementaryDescription" TEXT,
  ADD COLUMN "unitOfMeasure" TEXT NOT NULL DEFAULT 'UN',
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'ATIVO',
  ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'MERCADORIA_REVENDA',
  ADD COLUMN "qualityStatus" "ProductQualityStatus" NOT NULL DEFAULT 'INCOMPLETO',
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "lastChangedBy" TEXT,
  ADD COLUMN "brandId" TEXT,
  ADD COLUMN "manufacturerId" TEXT,
  ADD COLUMN "groupId" TEXT,
  ADD COLUMN "familyId" TEXT,
  ADD COLUMN "categoryId" TEXT;

CREATE TABLE "product_brands" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_brands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_manufacturers" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_manufacturers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_groups" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_families" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "groupId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_families_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_categories" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_identifiers" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "ProductIdentifierType" NOT NULL,
  "code" TEXT NOT NULL,
  "normalizedCode" TEXT NOT NULL,
  "description" TEXT,
  "source" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_identifiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_tax_profiles" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "ncm" TEXT,
  "ncmDescription" TEXT,
  "cest" TEXT,
  "origin" TEXT,
  "commercialUnit" TEXT,
  "taxableUnit" TEXT,
  "commercialGtin" TEXT,
  "taxableGtin" TEXT,
  "exTipi" TEXT,
  "fiscalItemType" TEXT,
  "cfopSale" TEXT,
  "cfopPurchase" TEXT,
  "icmsCst" TEXT,
  "icmsCsosn" TEXT,
  "icmsAliquot" DECIMAL(7,4),
  "icmsBaseReductionPercent" DECIMAL(7,4),
  "icmsMvaPercent" DECIMAL(7,4),
  "fcpAliquot" DECIMAL(7,4),
  "pisCst" TEXT,
  "pisAliquot" DECIMAL(7,4),
  "cofinsCst" TEXT,
  "cofinsAliquot" DECIMAL(7,4),
  "ipiCst" TEXT,
  "ipiAliquot" DECIMAL(7,4),
  "ipiEnquadramento" TEXT,
  "fiscalBenefitCode" TEXT,
  "taxObservation" TEXT,
  "hasSubstitutionTax" BOOLEAN NOT NULL DEFAULT false,
  "isMonophasic" BOOLEAN NOT NULL DEFAULT false,
  "isImported" BOOLEAN NOT NULL DEFAULT false,
  "isUsed" BOOLEAN NOT NULL DEFAULT false,
  "officialFiscalDescription" TEXT,
  "defaultFiscalProfile" TEXT,
  "classificationSource" TEXT,
  "classificationReviewedAt" TIMESTAMP(3),
  "classificationValidFrom" TIMESTAMP(3),
  "classificationValidTo" TIMESTAMP(3),
  "requiresFiscalReview" BOOLEAN NOT NULL DEFAULT false,
  "blocksInvoiceWhenIncomplete" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_tax_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_prices" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "salePrice" DECIMAL(10,2) NOT NULL,
  "promotionalPrice" DECIMAL(10,2),
  "minSalePrice" DECIMAL(10,2),
  "desiredMargin" DECIMAL(7,4),
  "maxDiscountPercent" DECIMAL(7,4),
  "commissionPercent" DECIMAL(7,4),
  "lastPriceChangedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_costs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "lastPurchaseCost" DECIMAL(10,2),
  "averageCost" DECIMAL(10,2),
  "fiscalAverageCost" DECIMAL(10,2),
  "managerialCost" DECIMAL(10,2),
  "replacementCost" DECIMAL(10,2),
  "freightCost" DECIMAL(10,2),
  "nonRecoverableTaxCost" DECIMAL(10,2),
  "extraCost" DECIMAL(10,2),
  "lastCostAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_costs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_warehouses" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_warehouses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_locations" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT,
  "aisle" TEXT,
  "shelf" TEXT,
  "bin" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_stocks" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "locationId" TEXT,
  "currentStock" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "availableStock" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "reservedStock" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "incomingStock" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "inTransitStock" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "minimumStock" DECIMAL(15,3),
  "maximumStock" DECIMAL(15,3),
  "reorderPoint" DECIMAL(15,3),
  "economicLot" DECIMAL(15,3),
  "purchaseLeadTime" INTEGER,
  "dailyAverageSale" DECIMAL(15,3),
  "coverageDays" INTEGER,
  "lastMovementAt" TIMESTAMP(3),
  "lastSaleAt" TIMESTAMP(3),
  "lastPurchaseAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_stocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_movements" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "fromLocationId" TEXT,
  "toLocationId" TEXT,
  "type" "StockMovementType" NOT NULL,
  "quantity" DECIMAL(15,3) NOT NULL,
  "balanceAfter" DECIMAL(15,3),
  "reference" TEXT,
  "reason" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_makes" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicle_makes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_models" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "makeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_versions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "engine" TEXT,
  "fuel" TEXT,
  "transmission" TEXT,
  "body" TEXT,
  "displacement" TEXT,
  "power" TEXT,
  "startYear" INTEGER,
  "endYear" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicle_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_vehicle_applications" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "vehicleMakeId" TEXT,
  "vehicleModelId" TEXT,
  "vehicleVersionId" TEXT,
  "makeName" TEXT,
  "modelName" TEXT,
  "versionName" TEXT,
  "yearStart" INTEGER,
  "yearEnd" INTEGER,
  "engine" TEXT,
  "position" TEXT,
  "side" TEXT,
  "axle" TEXT,
  "technicalNote" TEXT,
  "restriction" TEXT,
  "relatedOemCode" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_vehicle_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_attachments" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "ProductAttachmentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "uploadedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_search_logs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT,
  "query" TEXT NOT NULL,
  "normalizedQuery" TEXT NOT NULL,
  "searchType" TEXT,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_search_logs_pkey" PRIMARY KEY ("id")
);

DROP INDEX IF EXISTS "products_sku_key";
CREATE UNIQUE INDEX "products_sku_tenantId_key" ON "products"("sku", "tenantId");
CREATE UNIQUE INDEX "products_id_tenantId_key" ON "products"("id", "tenantId");
CREATE INDEX "products_tenantId_status_idx" ON "products"("tenantId", "status");
CREATE INDEX "products_tenantId_name_idx" ON "products"("tenantId", "name");
CREATE INDEX "products_tenantId_qualityStatus_idx" ON "products"("tenantId", "qualityStatus");

CREATE UNIQUE INDEX "product_brands_tenantId_name_key" ON "product_brands"("tenantId", "name");
CREATE INDEX "product_brands_tenantId_isActive_idx" ON "product_brands"("tenantId", "isActive");
CREATE UNIQUE INDEX "product_manufacturers_tenantId_name_key" ON "product_manufacturers"("tenantId", "name");
CREATE INDEX "product_manufacturers_tenantId_isActive_idx" ON "product_manufacturers"("tenantId", "isActive");
CREATE UNIQUE INDEX "product_groups_tenantId_name_key" ON "product_groups"("tenantId", "name");
CREATE INDEX "product_groups_tenantId_isActive_idx" ON "product_groups"("tenantId", "isActive");
CREATE UNIQUE INDEX "product_families_tenantId_name_key" ON "product_families"("tenantId", "name");
CREATE INDEX "product_families_tenantId_groupId_idx" ON "product_families"("tenantId", "groupId");
CREATE INDEX "product_families_tenantId_isActive_idx" ON "product_families"("tenantId", "isActive");
CREATE UNIQUE INDEX "product_categories_tenantId_name_key" ON "product_categories"("tenantId", "name");
CREATE INDEX "product_categories_tenantId_isActive_idx" ON "product_categories"("tenantId", "isActive");
CREATE UNIQUE INDEX "product_identifier_product_code_unique" ON "product_identifiers"("tenantId", "productId", "type", "normalizedCode");
CREATE INDEX "product_identifiers_tenantId_normalizedCode_idx" ON "product_identifiers"("tenantId", "normalizedCode");
CREATE INDEX "product_identifiers_tenantId_productId_idx" ON "product_identifiers"("tenantId", "productId");
CREATE UNIQUE INDEX "product_tax_profiles_productId_key" ON "product_tax_profiles"("productId");
CREATE INDEX "product_tax_profiles_tenantId_ncm_idx" ON "product_tax_profiles"("tenantId", "ncm");
CREATE INDEX "product_tax_profiles_tenantId_cest_idx" ON "product_tax_profiles"("tenantId", "cest");
CREATE INDEX "product_tax_profiles_tenantId_requiresFiscalReview_idx" ON "product_tax_profiles"("tenantId", "requiresFiscalReview");
CREATE UNIQUE INDEX "product_prices_productId_key" ON "product_prices"("productId");
CREATE INDEX "product_prices_tenantId_salePrice_idx" ON "product_prices"("tenantId", "salePrice");
CREATE UNIQUE INDEX "product_costs_productId_key" ON "product_costs"("productId");
CREATE INDEX "product_costs_tenantId_lastCostAt_idx" ON "product_costs"("tenantId", "lastCostAt");
CREATE UNIQUE INDEX "stock_warehouses_tenantId_code_key" ON "stock_warehouses"("tenantId", "code");
CREATE INDEX "stock_warehouses_tenantId_isActive_idx" ON "stock_warehouses"("tenantId", "isActive");
CREATE UNIQUE INDEX "stock_locations_tenantId_warehouseId_code_key" ON "stock_locations"("tenantId", "warehouseId", "code");
CREATE INDEX "stock_locations_tenantId_isActive_idx" ON "stock_locations"("tenantId", "isActive");
CREATE INDEX "product_stocks_tenantId_productId_idx" ON "product_stocks"("tenantId", "productId");
CREATE INDEX "product_stocks_tenantId_warehouseId_idx" ON "product_stocks"("tenantId", "warehouseId");
CREATE INDEX "product_stocks_tenantId_locationId_idx" ON "product_stocks"("tenantId", "locationId");
CREATE INDEX "stock_movements_tenantId_productId_occurredAt_idx" ON "stock_movements"("tenantId", "productId", "occurredAt");
CREATE INDEX "stock_movements_tenantId_type_idx" ON "stock_movements"("tenantId", "type");
CREATE UNIQUE INDEX "vehicle_makes_tenantId_name_key" ON "vehicle_makes"("tenantId", "name");
CREATE INDEX "vehicle_makes_tenantId_isActive_idx" ON "vehicle_makes"("tenantId", "isActive");
CREATE UNIQUE INDEX "vehicle_models_tenantId_makeId_name_key" ON "vehicle_models"("tenantId", "makeId", "name");
CREATE INDEX "vehicle_models_tenantId_isActive_idx" ON "vehicle_models"("tenantId", "isActive");
CREATE UNIQUE INDEX "vehicle_versions_tenantId_modelId_name_engine_key" ON "vehicle_versions"("tenantId", "modelId", "name", "engine");
CREATE INDEX "vehicle_versions_tenantId_isActive_idx" ON "vehicle_versions"("tenantId", "isActive");
CREATE INDEX "product_vehicle_applications_tenantId_productId_idx" ON "product_vehicle_applications"("tenantId", "productId");
CREATE INDEX "product_vehicle_applications_tenantId_vehicleMakeId_vehicleModelId_idx" ON "product_vehicle_applications"("tenantId", "vehicleMakeId", "vehicleModelId");
CREATE INDEX "product_vehicle_applications_tenantId_makeName_modelName_idx" ON "product_vehicle_applications"("tenantId", "makeName", "modelName");
CREATE INDEX "product_attachments_tenantId_productId_idx" ON "product_attachments"("tenantId", "productId");
CREATE INDEX "product_attachments_tenantId_type_idx" ON "product_attachments"("tenantId", "type");
CREATE INDEX "product_search_logs_tenantId_normalizedQuery_idx" ON "product_search_logs"("tenantId", "normalizedQuery");
CREATE INDEX "product_search_logs_tenantId_createdAt_idx" ON "product_search_logs"("tenantId", "createdAt");

ALTER TABLE "product_brands" ADD CONSTRAINT "product_brands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_manufacturers" ADD CONSTRAINT "product_manufacturers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "product_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "product_manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_identifiers" ADD CONSTRAINT "product_identifiers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_identifiers" ADD CONSTRAINT "product_identifiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_tax_profiles" ADD CONSTRAINT "product_tax_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_tax_profiles" ADD CONSTRAINT "product_tax_profiles_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_warehouses" ADD CONSTRAINT "stock_warehouses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "stock_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vehicle_makes" ADD CONSTRAINT "vehicle_makes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "vehicle_makes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_vehicleMakeId_fkey" FOREIGN KEY ("vehicleMakeId") REFERENCES "vehicle_makes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_vehicleModelId_fkey" FOREIGN KEY ("vehicleModelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_vehicleVersionId_fkey" FOREIGN KEY ("vehicleVersionId") REFERENCES "vehicle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_search_logs" ADD CONSTRAINT "product_search_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_search_logs" ADD CONSTRAINT "product_search_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
