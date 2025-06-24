// =============================================================================
// SmartPeças ERP - AuthTenantController (VERSÃO FINAL CORRIGIDA)
// =============================================================================
// Arquivo: backend/src/auth-tenant/auth-tenant.controller.ts
//
// Descrição: Controlador responsável pelo login de usuários vinculados a um
// inquilino (empresa), utilizando autenticação baseada em JWT.
//
// Versão: 2.1
// =============================================================================

import {
  Controller,
  Post,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthTenantService } from './auth-tenant.service';

// Importando o tipo 'User' do cliente tenant via alias.
import { User } from '@/tenant-client';

// Importando o tipo 'Request' do Express para tipagem correta.
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Authentication (Tenant)')
@Controller('auth/tenant')
export class AuthTenantController {
  private readonly logger = new Logger(AuthTenantController.name);

  constructor(private readonly authTenantService: AuthTenantService) {}

  @UseGuards(AuthGuard('local-tenant'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza o login de um usuário de tenant' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Request() req: ExpressRequest) {
    // ✅ CORREÇÃO: A tipagem de 'user' agora funciona pois 'User' foi importado corretamente.
    const user = req.user as Omit<User, 'password'>;

    if (!user) {
      this.logger.error('AuthGuard falhou em anexar o usuário à requisição.');
      throw new UnauthorizedException('Erro de autenticação.');
    }

    this.logger.log(`Login efetuado para usuário do tenant: ${user.email}`);
    return this.authTenantService.loginTenantUser(user);
  }
}
