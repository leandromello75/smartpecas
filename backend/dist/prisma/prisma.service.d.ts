import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as PublicPrismaClient } from '@prisma/client';
import { PrismaClient as TenantPrismaClient } from '@/tenant-client';
export declare class PrismaService extends PublicPrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly tenantClients;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getTenantClient(schemaUrl: string): Promise<TenantPrismaClient>;
    private buildTenantDatabaseUrl;
    createTenantSchema(schemaUrl: string): Promise<void>;
    private runTenantMigrations;
}
