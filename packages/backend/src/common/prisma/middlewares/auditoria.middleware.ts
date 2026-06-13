import { PrismaClient } from '@prisma/client';

export function auditoriaMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params: any, next: any) => {
    const result = await next(params);
    const operacoesAuditar = ['create', 'update', 'delete'];
    if (!operacoesAuditar.includes(params.action)) return result;
    try {
      const { model, action, args } = params;
      const recurso = model ?? 'unknown';
      const recursoId = args.where?.id || result?.id || 'sem-id';
      const dadosAnteriores = action === 'update'
        ? await (prisma as any)[model as string]?.findUnique({ where: args.where })
        : null;
      const payload = args?.context?.usuario || { id: 'sistema', name: 'Sistema', ip: '127.0.0.1' };
      await (prisma as any).auditoriaLog.create({
        data: {
          tenantId: args.context?.tenantId || 'public',
          recurso, recursoId, operacao: action.toUpperCase(),
          dadosAnteriores: dadosAnteriores || {},
          dadosAtuais: result,
          realizadoPor: payload.id,
          realizadoPorNome: payload.name,
          realizadoPorIp: payload.ip,
          userAgent: args.context?.userAgent || 'desconhecido',
        },
      });
    } catch (error) { console.error('[AUDITORIA ERROR]', error); }
    return result;
  });
}
