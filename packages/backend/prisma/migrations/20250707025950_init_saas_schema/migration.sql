-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN', 'GUEST');

-- CreateEnum
CREATE TYPE "tipo_cliente" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');

-- CreateEnum
CREATE TYPE "tipo_endereco" AS ENUM ('COMERCIAL', 'RESIDENCIAL', 'ENTREGA', 'COBRANCA');

-- CreateEnum
CREATE TYPE "TipoNegocio" AS ENUM ('OFICINA', 'LOJA', 'DISTRIBUIDOR');

-- CreateEnum
CREATE TYPE "FrequenciaCompra" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "FormaPagamentoPadrao" AS ENUM ('VISTA', 'PRAZO', 'CARTAO');

-- CreateEnum
CREATE TYPE "NivelConfidencialidade" AS ENUM ('PUBLICO', 'INTERNO', 'CONFIDENCIAL');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema_url" TEXT NOT NULL,
    "cnpj" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "billingStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "tipoCliente" "tipo_cliente" NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "documento" TEXT NOT NULL,
    "documentoTipo" TEXT NOT NULL,
    "documentoValido" BOOLEAN NOT NULL DEFAULT false,
    "documentoValidadoEm" TIMESTAMP(3),
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "website" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "pais" TEXT DEFAULT 'Brasil',
    "isInadimplente" BOOLEAN NOT NULL DEFAULT false,
    "limiteCredito" DECIMAL(15,2),
    "limiteCreditoUsado" DECIMAL(15,2),
    "diasPagamento" INTEGER DEFAULT 30,
    "formaPagamentoPadrao" TEXT,
    "descontoMaximo" DECIMAL(5,2),
    "comissaoVendedor" DECIMAL(5,2),
    "observacoes" TEXT,
    "tipoNegocio" TEXT,
    "especialidades" TEXT[],
    "marcasAtendidas" TEXT[],
    "certificacoes" TEXT[],
    "temOficina" BOOLEAN NOT NULL DEFAULT false,
    "temBalcao" BOOLEAN NOT NULL DEFAULT true,
    "totalPedidos" INTEGER NOT NULL DEFAULT 0,
    "valorTotalCompras" DECIMAL(15,2),
    "ultimaCompra" TIMESTAMP(3),
    "frequenciaCompra" TEXT,
    "scoreCliente" INTEGER,
    "acessoRestrito" BOOLEAN NOT NULL DEFAULT false,
    "gruposAcesso" TEXT[],
    "nivelConfidencialidade" TEXT DEFAULT 'INTERNO',
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deleteReason" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPor" TEXT,
    "criadoPorNome" TEXT,
    "criadoPorIp" TEXT,
    "atualizadoPor" TEXT,
    "atualizadoPorNome" TEXT,
    "atualizadoPorIp" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "anoMes" TEXT NOT NULL,
    "trimestre" TEXT NOT NULL,
    "dadosCnpjApi" JSONB,
    "dadosCepApi" JSONB,
    "ultimaConsultaCnpj" TIMESTAMP(3),
    "ultimaConsultaCep" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos_clientes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "tipo_endereco" NOT NULL,
    "descricao" TEXT,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'Brasil',
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contatos_clientes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "observacoes" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contatos_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos_clientes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoGlobalId" TEXT NOT NULL,
    "placa" TEXT,
    "cor" TEXT,
    "anoFabricacao" INTEGER,
    "anoModelo" INTEGER,
    "quilometragem" INTEGER,
    "observacoes" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_clientes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(15,2),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPor" TEXT,

    CONSTRAINT "historico_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "origin" TEXT,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key","tenantId")
);

-- CreateTable
CREATE TABLE "auditoria_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "dadosAnteriores" JSONB NOT NULL,
    "dadosAtuais" JSONB NOT NULL,
    "realizadoPor" TEXT NOT NULL,
    "realizadoPorNome" TEXT NOT NULL,
    "realizadoPorIp" TEXT,
    "userAgent" TEXT,
    "realizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_schema_url_key" ON "tenants"("schema_url");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE INDEX "clientes_tenantId_isAtivo_idx" ON "clientes"("tenantId", "isAtivo");

-- CreateIndex
CREATE INDEX "clientes_tenantId_isInadimplente_idx" ON "clientes"("tenantId", "isInadimplente");

-- CreateIndex
CREATE INDEX "clientes_tenantId_documento_idx" ON "clientes"("tenantId", "documento");

-- CreateIndex
CREATE INDEX "clientes_tenantId_email_idx" ON "clientes"("tenantId", "email");

-- CreateIndex
CREATE INDEX "clientes_tenantId_nome_idx" ON "clientes"("tenantId", "nome");

-- CreateIndex
CREATE INDEX "clientes_tenantId_criadoEm_idx" ON "clientes"("tenantId", "criadoEm");

-- CreateIndex
CREATE INDEX "clientes_tenantId_atualizadoEm_idx" ON "clientes"("tenantId", "atualizadoEm");

-- CreateIndex
CREATE INDEX "clientes_tenantId_ultimaCompra_idx" ON "clientes"("tenantId", "ultimaCompra");

-- CreateIndex
CREATE INDEX "clientes_tenantId_scoreCliente_idx" ON "clientes"("tenantId", "scoreCliente");

-- CreateIndex
CREATE INDEX "clientes_anoMes_idx" ON "clientes"("anoMes");

-- CreateIndex
CREATE INDEX "clientes_trimestre_idx" ON "clientes"("trimestre");

-- CreateIndex
CREATE INDEX "clientes_documentoTipo_documentoValido_idx" ON "clientes"("documentoTipo", "documentoValido");

-- CreateIndex
CREATE INDEX "enderecos_clientes_clienteId_idx" ON "enderecos_clientes"("clienteId");

-- CreateIndex
CREATE INDEX "enderecos_clientes_isPrincipal_idx" ON "enderecos_clientes"("isPrincipal");

-- CreateIndex
CREATE INDEX "contatos_clientes_clienteId_idx" ON "contatos_clientes"("clienteId");

-- CreateIndex
CREATE INDEX "contatos_clientes_email_idx" ON "contatos_clientes"("email");

-- CreateIndex
CREATE INDEX "veiculos_clientes_clienteId_idx" ON "veiculos_clientes"("clienteId");

-- CreateIndex
CREATE INDEX "veiculos_clientes_veiculoGlobalId_idx" ON "veiculos_clientes"("veiculoGlobalId");

-- CreateIndex
CREATE INDEX "veiculos_clientes_placa_idx" ON "veiculos_clientes"("placa");

-- CreateIndex
CREATE INDEX "historico_clientes_clienteId_tipo_idx" ON "historico_clientes"("clienteId", "tipo");

-- CreateIndex
CREATE INDEX "historico_clientes_clienteId_criadoEm_idx" ON "historico_clientes"("clienteId", "criadoEm");

-- CreateIndex
CREATE INDEX "orders_tenantId_idx" ON "orders"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_orderId_productId_key" ON "order_items"("orderId", "productId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_tenantId_idx" ON "IdempotencyKey"("tenantId");

-- CreateIndex
CREATE INDEX "auditoria_log_tenantId_recurso_recursoId_idx" ON "auditoria_log"("tenantId", "recurso", "recursoId");

-- CreateIndex
CREATE INDEX "auditoria_log_realizadoPor_idx" ON "auditoria_log"("realizadoPor");

-- CreateIndex
CREATE INDEX "auditoria_log_realizadoEm_idx" ON "auditoria_log"("realizadoEm");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos_clientes" ADD CONSTRAINT "enderecos_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contatos_clientes" ADD CONSTRAINT "contatos_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos_clientes" ADD CONSTRAINT "veiculos_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_clientes" ADD CONSTRAINT "historico_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_log" ADD CONSTRAINT "auditoria_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
