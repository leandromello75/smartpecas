"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditoriaMiddleware = auditoriaMiddleware;
function auditoriaMiddleware(prisma) {
    prisma.$use(async (params, next) => {
        const result = await next(params);
        const operacoesAuditar = ['create', 'update', 'delete'];
        if (!operacoesAuditar.includes(params.action))
            return result;
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
        }
        catch (error) {
            console.error('[AUDITORIA ERROR]', error);
        }
        return result;
    });
}
//# sourceMappingURL=auditoria.middleware.js.map