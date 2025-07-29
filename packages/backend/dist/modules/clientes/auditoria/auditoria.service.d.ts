import { PrismaService } from '../../../prisma/prisma.service';
import { JwtTenantUserPayload, JwtAdminPayload } from '../../../shared/interfaces/jwt-payload.interface';
import { OperacaoAuditoria } from '@prisma/client';
type AuditUserPayload = JwtTenantUserPayload | JwtAdminPayload;
interface DadosAuditoria {
    operacao: OperacaoAuditoria;
    recurso: string;
    recursoId: string;
    dadosAnteriores?: Record<string, any> | null;
    dadosAtuais?: Record<string, any> | null;
    ip?: string | null;
    userAgent?: string | null;
}
export declare class AuditoriaService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    registrarOperacao(tenantId: string, usuario: AuditUserPayload, dados: DadosAuditoria): Promise<void>;
}
export {};
