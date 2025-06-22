import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import '../../interfaces/request-with-tenant.interface';
export declare class TenantResolverGuard implements CanActivate {
    private readonly prisma;
    private readonly tenantContext;
    private readonly logger;
    constructor(prisma: PrismaService, tenantContext: TenantContextService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
