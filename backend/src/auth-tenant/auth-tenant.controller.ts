// =============================================================================
// SmartPeças ERP - AuthTenantController
// =============================================================================
// Arquivo: backend/src/auth-tenant/auth-tenant.controller.ts
//
// Descrição: Controlador responsável pelo login de usuários vinculados a um
// inquilino (empresa), utilizando autenticação baseada em JWT.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 17/06/2025
// =============================================================================

import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthTenantService } from './services/auth-tenant.service';
import { LoginTenantUserDto } from './dto/login-tenant-user.dto';
import { LocalTenantUserAuthGuard } from './guards/local-tenant-user.guard';

@ApiTags('Auth - Usuários do Tenant')
@Controller('auth/tenant')
export class AuthTenantController {
  private readonly logger = new Logger(AuthTenantController.name);

  constructor(private readonly authTenantService: AuthTenantService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalTenantUserAuthGuard)
  @ApiOperation({ summary: 'Login de usuário de inquilino (empresa)' })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido. Retorna token JWT.',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiBody({ type: LoginTenantUserDto, description: 'Credenciais de login do usuário do inquilino' })
  async login(@Request() req) {
    this.logger.log(`Login efetuado para usuário do tenant: ${req.user.email}`);
    return this.authTenantService.loginTenantUser(req.user);
  }
}
