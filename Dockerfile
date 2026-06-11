FROM node:20-alpine AS base
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY packages/backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY packages/backend/prisma ./prisma/
RUN npm exec prisma generate

COPY packages/backend/src ./src
COPY packages/backend/tsconfig*.json ./

FROM base AS builder
WORKDIR /usr/src/app
RUN npm exec nest build

FROM node:20-alpine AS production
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY packages/backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "dist/main"]
