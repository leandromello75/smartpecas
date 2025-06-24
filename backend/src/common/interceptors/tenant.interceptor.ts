// =============================================================================
// SmartPeças ERP - TenantInterceptor (VERSÃO FINAL)
// =============================================================================
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id']; // Pega o ID do tenant do header

    if (!tenantId) {
      // Se não houver tenant, apenas continua a requisição.
      // Rotas públicas (como /auth/login/admin) funcionarão.
      return next.handle();
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${tenantId} não encontrado ou inativo.`);
    }

    // A mágica do AsyncLocalStorage acontece aqui!
    // Executamos o resto da requisição DENTRO do contexto do tenant encontrado.
    return this.tenantContextService.run(tenant, () => next.handle());
  }
}
