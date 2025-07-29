import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class IdempotencyService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    executeOrRecover<T>(idemKey: string | undefined, tenantId: string, route: string, operation: (tx: Prisma.TransactionClient) => Promise<T>, origin?: string, ttlMs?: number): Promise<T>;
}
