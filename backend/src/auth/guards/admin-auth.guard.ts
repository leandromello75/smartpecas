// =============================================================================
// SmartPeças ERP - AdminAuthGuard
// =============================================================================
// Arquivo: backend/src/auth/guards/admin-auth.guard.ts
//
// Descrição: Guarda de autenticação para rotas protegidas por JWT de
// administradores globais. Usa a estratégia 'jwt-admin' para validar token.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// O 'jwt-admin' é o nome da estratégia registrada em JwtAdminStrategy
export class AdminAuthGuard extends AuthGuard('jwt-admin') {}
