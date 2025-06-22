// backend/src/auth-tenant/dto/login-tenant-user.dto.ts
// =============================================================================
// SmartPeças ERP - DTO de Login para Usuário do Inquilino
// =============================================================================
// Arquivo: backend/src/auth-tenant/dto/login-tenant-user.dto.ts
//
// Descrição: Define a estrutura e validações para os dados de entrada
// do endpoint de login de usuários específicos de um inquilino.
// Inclui documentação Swagger.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 16/06/2025
// =============================================================================

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginTenantUserDto {
  @ApiProperty({ example: 'usuario@empresa.com', description: 'E-mail do usuário do inquilino' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email!: string;

  @ApiProperty({ example: 'minhaSenhaSegura', description: 'Senha de acesso (mínimo 6 caracteres)' })
  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password!: string;
}
