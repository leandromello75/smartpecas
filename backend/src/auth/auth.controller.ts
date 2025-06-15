// =============================================================================
// SmartPeças ERP - AuthController (AdminUser)
// =============================================================================
// Arquivo: backend/src/auth/auth.controller.ts
//
// Descrição: Controlador responsável pela autenticação de administradores
// globais. Usa guarda local personalizado para validar credenciais e emitir JWT.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Controller, Post, Body, HttpCode, HttpStatus, Request, UseGuards, Res, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginAdminDto } from './dto/login-admin.dto'; // Iremos criar este DTO
import { Response } from 'express'; // Para usar o tipo Response do Express
import { LocalAuthGuard } from './guards/local-auth.guard'; // Iremos criar este guarda

@ApiTags('Auth - Admin Global')
@Controller('auth') // As rotas serão prefixadas com /auth
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login/admin')
  @HttpCode(HttpStatus.OK) // O login bem-sucedido retorna 200 OK
  @UseGuards(LocalAuthGuard) // Usa o guarda local para autenticar email/senha
  @ApiOperation({ summary: 'Login de administrador global do sistema' })
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
  @ApiBody({ type: LoginAdminDto, description: 'Credenciais de login do administrador' })
  async loginAdmin(@Request() req, @Res({ passthrough: true }) res: Response) {
    this.logger.log(`Tentativa de login de administrador para: ${req.user.email}`);
    // req.user é populado pelo LocalAuthGuard com o AdminUser validado
    const result = await this.authService.loginAdmin(req.user);

    // Opcional: Definir o token como um cookie HTTP-only (mais seguro para navegadores)
    // res.cookie('jwt', result.access_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return result; // Retorna o token no corpo da resposta
  }
}
