// =============================================================================
// SmartPeças ERP - DTO de Criação de Tenant com Validação
// =============================================================================
// Arquivo: backend/src/tenant/dto/create-tenant.dto.ts
//
// Descrição: Dados necessários para criar um novo inquilino com validações.
// Utiliza decorators do class-validator para garantir entrada consistente.
//
// Versão: 1.1
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Length,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  adminName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, {
    message: 'A senha deve ter pelo menos 6 caracteres',
  })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  favicon?: string;

  @IsOptional()
  theme?: any;

  @IsOptional()
  settings?: any;
}
