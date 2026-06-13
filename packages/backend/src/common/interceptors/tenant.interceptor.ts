import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { TenantContextService, TenantContext } from '../tenant-context/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();
    const tenantIdFromHeader = request.headers['x-tenant-id'] as string;

    if (!tenantIdFromHeader) return next.handle();

    let tenantDb: any | null = null;
    try {
      tenantDb = await this.prisma.tenant.findUnique({
        where: { id: tenantIdFromHeader },
        select: { id: true, isActive: true, billingStatus: true },
      });
    } catch {
      return next.handle();
    }

    if (!tenantDb || !tenantDb.isActive || tenantDb.billingStatus !== 'ACTIVE') {
      return next.handle();
    }

    const tenantContext: TenantContext = {
      tenantId: tenantDb.id,
      user: (request as any).user,
    };

    this.logger.debug(`Tenant ${tenantContext.tenantId} definido para a requisição.`);
    return this.tenantContextService.runWithContext(tenantContext, () => next.handle());
  }
}
