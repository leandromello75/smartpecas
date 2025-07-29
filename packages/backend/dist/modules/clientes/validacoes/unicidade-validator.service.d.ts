import { PrismaService } from '../../../prisma/prisma.service';
export declare class UnicidadeValidatorService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private limparDocumento;
    validarDocumento(tenantId: string, documento: string, clienteId?: string, prismaClient?: Prisma.TransactionClient | PrismaService): Promise<void>;
    validarEmail(tenantId: string, email: string, clienteId?: string, prismaClient?: Prisma.TransactionClient | PrismaService): Promise<void>;
}
