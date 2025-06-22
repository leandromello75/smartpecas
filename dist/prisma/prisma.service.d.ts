import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly tenantClients;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enableShutdownHooks(app: any): Promise<void>;
    getTenantById(tenantId: string): Promise<{
        schema: string;
        id: string;
        name!: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getTenantByschema(schema: string): Promise<{
        schema: string;
        id: string;
        name!: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getActiveTenants(): Promise<{
        schema: string;
        id: string;
        name!: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTenantClient(schema: string): Promise<PrismaClient>;
    private buildTenantDatabaseUrl;
    getConnectionStats(): {
        total: number;
        schemas: string[];
    };
    cleanupInactiveConnections(): Promise<void>;
    createTenantSchema(schema: string): Promise<void>;
    dropTenantSchema(schema: string): Promise<void>;
    private runTenantMigrations;
    executeOnAllTenants<T>(operation: (client: PrismaClient, tenant: any) => Promise<T>): Promise<Array<{
        tenant: any;
        result: T;
        error?: any;
    }>>;
}
