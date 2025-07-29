import { PrismaService } from '../../../prisma/prisma.service';
export declare class IntegridadeService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    validarExclusaoCliente(tenantId: string, clienteId: string): Promise<void>;
    private verificarOrdensEmAberto;
    private verificarFaturasPendentes;
    private verificarVeiculosAtivos;
}
