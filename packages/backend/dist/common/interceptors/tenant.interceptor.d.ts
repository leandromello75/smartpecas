import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class TenantInterceptor implements NestInterceptor {
    private readonly tenantContextService;
    private readonly prisma;
    private readonly logger;
    constructor(tenantContextService: TenantContextService, prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
