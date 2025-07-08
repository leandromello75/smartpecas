// =============================================================================
// SmartPeças ERP - AuthController (Versão Final Otimizada e Segura v1.2.3)
// =============================================================================
// Arquivo: backend/src/auth/auth.controller.ts
//
// Descrição: Controlador para autenticação de administradores globais.
// Utiliza Guard, DTOs e injeta IP/User-Agent para auditoria.
//
// Versão: 1.2.3
// Equipe SmartPeças
// Atualizado em: 08/07/2025
// =============================================================================

import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
  Req,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginAdminDto } from './dto/login-admin.dto';
import { Request, Response } from 'express';
import { LoginRateLimiterService } from './login-rate-limiter.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private loginRateLimiterService: LoginRateLimiterService,
  ) {}

  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de administrador global e retorno de token JWT.' })
  @ApiBody({ type: LoginAdminDto, description: 'Credenciais de login do administrador.' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido. Retorna o token JWT e metadados.', schema: {
    example: {
      access_token: 'eyJhbGciOiJIUzI1Ni...',
      expires_in: 3600,
      token_type: 'Bearer',
      user: { id: 'uuid', email: 'admin@example.com', name: 'Admin Name' }
    }
  }})
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 403, description: 'Acesso à conta suspenso.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas de login. Conta temporariamente bloqueada.' })
  async loginAdmin(
    @Body() loginAdminDto: LoginAdminDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ access_token: string; expires_in: number; token_type: string; user: { id: string; email: string; name: string | null } }> { // CORREÇÃO: Tipo de retorno completo
    const userIp = req.ip || req.connection?.remoteAddress || 'unknown'; 
    const userAgent = req.headers['user-agent'] || 'unknown'; // CORREÇÃO: UserAgent agora é usado

    this.logger.log(`Tentativa de login para admin: ${loginAdminDto.email} do IP: ${userIp}`);

    await this.loginRateLimiterService.checkAttempts(loginAdminDto.email, userIp);

    const authResult = await this.authService.validateAndLoginAdmin(
      loginAdminDto.email,
      loginAdminDto.password,
      userIp,
      userAgent // NOVO: Passa userAgent para o AuthService
    );

    res.cookie('jwt_admin', authResult.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: authResult.expires_in * 1000 // Usa expiresIn do resultado (já em segundos) para maxAge do cookie (em ms)
    });

    return {
      access_token: authResult.access_token,
      expires_in: authResult.expires_in,
      token_type: 'Bearer',
      user: authResult.user, // Agora o objeto 'user' completo vem do serviço
    };
  }
}