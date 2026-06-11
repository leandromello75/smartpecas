FROM node:20-alpine AS base
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

# Copiar e instalar dependências do backend
COPY packages/backend/package*.json ./
RUN npm install --legacy-peer-deps

# Copiar schema Prisma e gerar client (usando versão instalada pelo npm)
COPY packages/backend/prisma ./prisma/
RUN ./node_modules/.bin/prisma generate

# Copiar código fonte e tsconfig
COPY packages/backend/src ./src
COPY packages/backend/tsconfig*.json ./

# =============================================================================
# Build
# =============================================================================
FROM base AS builder
WORKDIR /usr/src/app
RUN ./node_modules/.bin/nest build

# =============================================================================
# Produção
# =============================================================================
FROM node:20-alpine AS production
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY packages/backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "dist/main"]
