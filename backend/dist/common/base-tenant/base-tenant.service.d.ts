import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService, TenantContext } from '../tenant-context/tenant-context.service';
export declare abstract class BaseTenantService {
    protected readonly prisma: PrismaService;
    protected readonly tenantContextService: TenantContextService;
    protected readonly logger: Logger;
    constructor(prisma: PrismaService, tenantContextService: TenantContextService);
    protected getTenantPrismaClient(): Promise<PrismaClient>;
    protected getTenantContext(): TenantContext;
    protected get tenantId(): string;
    protected get schemaUrl(): string;
    protected get billingStatus(): 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
    protected logTenantAction(message: string, contextData?: Record<string, any>): void;
    protected errorTenantAction(message: string, error?: unknown): void;
    protected debugTenantConnection(): Promise<void>;
}
