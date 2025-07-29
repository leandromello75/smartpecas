# =============================================================================
# SmartPeças ERP - Dockerfile do Backend (VERSÃO FINAL)
# =============================================================================
# Arquivo: Dockerfile (na raiz do projeto)
#
# Descrição: Constrói a aplicação NestJS num ambiente Docker, respeitando
# a estrutura com a pasta 'prisma' na raiz e gerando o cliente no local
# personalizado 'src/generated/prisma-client'.
#
# Versão: 3.1.0
# Equipe SmartPeças
# Atualizado em: 24/07/2025
# =============================================================================

# ================================================================
# Etapa 1: Builder - Instala as dependências, gera o Prisma e compila
# ================================================================
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Copia o package.json da raiz E do backend
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Instala TODAS as dependências a partir da raiz
RUN npm install

# Copia o schema do Prisma
COPY prisma ./prisma/

# Gera o cliente Prisma
RUN npx prisma generate

# Copia o código-fonte do backend
COPY packages/backend ./packages/backend

# =============================================================================
# Etapa de Build
# =============================================================================
FROM base AS builder
WORKDIR /usr/src/app

# Executa o build do workspace 'backend'
RUN npm run build:backend

# =============================================================================
# Etapa Final (Produção)
# =============================================================================
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# Instala apenas as dependências de produção de forma otimizada
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
RUN npm install --omit=dev

# Copia o código compilado e o cliente Prisma gerado
COPY --from=builder /usr/src/app/packages/backend/dist ./packages/backend/dist
COPY --from=base /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "packages/backend/dist/main"]
