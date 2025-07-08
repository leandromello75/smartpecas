// =============================================================================
// SmartPeças ERP - TransformInterceptor (Versão Refatorada v1.1)
// =============================================================================
// Arquivo: backend/src/shared/interceptors/transform.interceptor.ts
//
// Descrição: Interceptor global que transforma todas as respostas da API
// para um formato padronizado com campos: data, timestamp, path, e opcionalmente método.
//
// Versão: 1.1.0
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 09/07/2025
// =============================================================================

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  timestamp: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | string; // Mais preciso
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => ({
        data,
        timestamp: new Date().toISOString(), // ISO 8601
        path: req.url,
        method: req.method, // Opcional: para logs e rastreabilidade
      })),
    );
  }
}
