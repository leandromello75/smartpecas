import { PrismaService } from '../../../prisma/prisma.service';
import { JwtTenantUserPayload } from '../../../shared/interfaces/jwt-payload.interface';
interface DadosAuditoria {
    operacao: 'CRIAR' | 'ATUALIZAR' | 'EXCLUIR' | 'RESTAURAR' | string;
    recurso: string;
    recursoId: string;
    dadosAnteriores?: Record<string, any>;
    dadosAtuais?: Record<string, any>;
    timestamp?: Date;
    ip?: string;
    userAgent?: string;
}
export declare class AuditoriaService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    registrarOperacao(tenantId: string, usuario: JwtTenantUserPayload, dados: DadosAuditoria): Promise<void>;
}
export {};
