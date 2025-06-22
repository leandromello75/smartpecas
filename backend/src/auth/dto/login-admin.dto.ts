// =============================================================================
// SmartPeças ERP - DTO de Login para Administrador Global
// =============================================================================
// Arquivo: backend/src/auth/dto/login-admin.dto.ts
//
// Descrição: Define a estrutura e validações para os dados de entrada
// do endpoint de login de administradores globais do sistema.
// Inclui documentação Swagger.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAdminDto {
  @ApiProperty({ example: 'admin@smartpecas.com', description: 'E-mail do administrador global' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email!: string;

  @ApiProperty({ example: 'senhaSegura123', description: 'Senha de acesso (mínimo 6 caracteres)' })
  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password!: string;
}
