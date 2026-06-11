# =============================================================================
# SmartPeças ERP - Dockerfile do Backend
# =============================================================================

FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Instalar dependências do sistema
RUN apk add --no-cache openssl

# Copiar package.json raiz e do backend
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Instalar todas as dependências
RUN npm install --legacy-peer-deps

# Copiar o schema Prisma do local correto
COPY packages/backend/prisma ./packages/backend/prisma/

# Gerar o cliente Prisma
RUN cd packages/backend && npx prisma generate

# Copiar código-fonte do backend
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig*.json ./packages/backend/

# =============================================================================
# Build
# =============================================================================
FROM base AS builder
WORKDIR /usr/src/app

RUN cd packages/backend && npx nest build

# =============================================================================
# Produção
# =============================================================================
FROM node:20-alpine AS production
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
RUN npm install --omit=dev --legacy-peer-deps

# Copiar build e Prisma Client gerado
COPY --from=builder /usr/src/app/packages/backend/dist ./packages/backend/dist

EXPOSE 3000
CMD ["node", "packages/backend/dist/main"]
