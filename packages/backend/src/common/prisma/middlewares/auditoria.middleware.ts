// =============================================================================
// SmartPeças ERP - Middleware Prisma para Auditoria de Operações
// =============================================================================
// Arquivo: backend/src/common/prisma/middlewares/auditoria.middleware.ts
//
// Descrição: Middleware Prisma para interceptar operações de escrita e registrar
// logs no modelo AuditoriaLog automaticamente.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Criado em: 05/07/2025
// =============================================================================

import { Prisma } from '@prisma/client';
import { PrismaClient } from '@/generated/prisma-client';

export function auditoriaMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    const result = await next(params);

    const operacoesAuditar = ['create', 'update', 'delete'];
    if (!operacoesAuditar.includes(params.action)) return result;

    try {
      const { model, action, args } = params;
      const recurso = model;
      const operacao = action.toUpperCase();
      const recursoId = args.where?.id || result?.id || 'sem-id';

      const dadosAnteriores = action === 'update' ? await prisma[model].findUnique({ where: args.where }) : null;
      const dadosAtuais = result;

      const payload = args?.context?.usuario || {
        id: 'sistema',
        name: 'Sistema',
        ip: '127.0.0.1',
      };

      await prisma.auditoriaLog.create({
        data: {
          tenantId: args.context?.tenantId || 'public',
          recurso,
          recursoId,
          operacao,
          dadosAnteriores: dadosAnteriores || {},
          dadosAtuais,
          realizadoPor: payload.id,
          realizadoPorNome: payload.name,
          realizadoPorIp: payload.ip,
          userAgent: args.context?.userAgent || 'desconhecido',
        },
      });
    } catch (error) {
      console.error('[AUDITORIA ERROR]', error);
    }

    return result;
  });
}
