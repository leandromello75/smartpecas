// =============================================================================
// SmartPeças ERP - LoggingInterceptor (Versão Refatorada e Detalhada v1.1.1)
// =============================================================================
// Arquivo: backend/src/shared/interceptors/logging.interceptor.ts
//
// Descrição: Interceptor global para logar requisições HTTP. Registra método,
// URL, status, tempo de resposta, IP e User-Agent.
//
// Versão: 1.1.1
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 09/07/2025
// =============================================================================

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express'; // Importar tipos de express

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // CORREÇÃO: Tipagem explícita para Request e Response do Express
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    const method = req.method;
    const url = req.url;
    // Captura IP e User-Agent de forma robusta
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'N/A';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = res.statusCode;
        const responseTime = Date.now() - now;

        this.logger.log(
          `[${method}] ${url} ${statusCode} - ${responseTime}ms | IP: ${ip} | UA: ${userAgent}`,
        );
      }),
    );
  }
}