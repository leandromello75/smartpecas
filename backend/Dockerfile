# =============================================================================
# SmartPeças ERP - Dockerfile do Backend (NestJS)
# =============================================================================
# Arquivo: /smartpecas/backend/Dockerfile
#
# Descrição: Constrói e executa a aplicação NestJS em produção,
# incluindo Prisma Client gerado e buildado em etapa isolada.
#
# Versão: 1.1
#
# Equipe SmartPeças
# Criado em: 19/06/2025
# =============================================================================

# ================================================================
# Etapa 1: Builder - compila o projeto e gera o Prisma Client
# ================================================================
FROM node:20-alpine AS builder # Atualizei para node:20, como a equipe prefere

WORKDIR /usr/src/app

# Copia os arquivos de dependências do backend
COPY backend/package*.json ./

# Instala TODAS as dependências
RUN npm install

# Copia o código-fonte do backend
COPY backend/ .

# Copia o schema do Prisma a partir da raiz do contexto
COPY prisma ./prisma/

# Gera o Prisma Client com base no schema
RUN npx prisma generate

# Executa o build da aplicação NestJS
RUN npm run build

# =================================================================
# Estágio 2: Production - Cria a imagem final e leve
# =================================================================
FROM node:20-alpine # Mantendo node:20

WORKDIR /usr/src/app

# Copia o package.json para poder instalar apenas as dependências de produção
COPY backend/package*.json ./

# Instala APENAS as dependências de produção de forma limpa
RUN npm ci --omit=dev

# Copia os artefatos do build do estágio 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Copia o Prisma Client já gerado do estágio 'builder'
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Expõe a porta que a aplicação NestJS escuta
EXPOSE 3000

# Comando para iniciar a aplicação em produção
CMD ["node", "dist/main"]
