// =============================================================================
// SmartPeças ERP - AuthController (AdminUser) - VERSÃO CORRIGIDA
// =============================================================================
// Arquivo: backend/src/auth/auth.controller.ts
//
// Descrição: Controlador para autenticação de administradores globais.
//
// Versão: 1.1
// =============================================================================

import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Logger,
  UnauthorizedException,
  // ✅ CORREÇÃO: Renomeamos o decorador para evitar conflito
  Request as NestRequest, 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginAdminDto } from './dto/login-admin.dto';
// ✅ CORREÇÃO: Importamos os tipos necessários
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AdminUser } from '@/public-client';

@ApiTags('Auth - Admin Global')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  // ✅ CORREÇÃO: Usamos o guard 'local-admin' que corresponde à sua LocalAdminStrategy
  @UseGuards(AuthGuard('local-admin'))
  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de administrador global do sistema' })
  @ApiBody({ type: LoginAdminDto }) // O Body da requisição espera este DTO
  @ApiResponse({ status: 200, description: 'Login bem-sucedido. Retorna token JWT.'})
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async loginAdmin(
    // ✅ CORREÇÃO: Usamos o decorador renomeado 'NestRequest' e o tipo 'Request' do Express
    @NestRequest() req: Request, 
    @Res({ passthrough: true }) res: Response
  ) {
    // ✅ CORREÇÃO: Fazemos a asserção de tipo e a verificação de segurança
    const user = req.user as Omit<AdminUser, 'password'>;
    if (!user) {
      throw new UnauthorizedException('Falha no processo de autenticação do guard.');
    }

    this.logger.log(`Login bem-sucedido para administrador: ${user.email}`);

    // A lógica de chamada ao serviço e retorno do token está perfeita.
    const result = await this.authService.loginAdmin(user);

    // Opcional: Definir o token como um cookie
    res.cookie('jwt_admin', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return result;
  }
}
