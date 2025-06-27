# =============================================================================
# SmartPeças ERP - Dockerfile do Backend (VERSÃO FINAL LIMPA)
# =============================================================================

# --- Estágio 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
COPY prisma/ ../prisma/

RUN npm run prisma:generate:all
RUN npm run build


# --- Estágio 2: Produção ---
FROM node:20-alpine

WORKDIR /usr/src/app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/src/generated/tenant-client ./node_modules/@prisma/tenant-client

EXPOSE 3000
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]