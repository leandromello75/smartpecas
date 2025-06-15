// =============================================================================
// SmartPeças ERP - LocalAuthGuard
// =============================================================================
// Arquivo: backend/src/auth/guards/local-auth.guard.ts
//
// Descrição: Guarda de autenticação local usado para validar o login de
// administradores globais via e-mail e senha. Utiliza a estratégia 'local-admin'.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// O 'local-admin' é o nome da estratégia definida em LocalAdminStrategy
export class LocalAuthGuard extends AuthGuard('local-admin') {}
