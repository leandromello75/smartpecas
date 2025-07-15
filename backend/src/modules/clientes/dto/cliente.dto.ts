// =============================================================================
// SmartPeças ERP - DTOs do Módulo de Clientes
// =============================================================================
// Arquivo: backend/src/modules/clientes/dto/cliente.dto.ts
//
// Descrição: Define os DTOs de requisição (Create/Update/Consultar) e a
// interface de entrada para queries no Prisma (BuscarClientesParams).
//
// Versão: 1.3.4
// Equipe SmartPeças
// Atualizado em: 09/07/2025
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  Length,
  Matches,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TipoCliente } from '../../../generated/prisma-client';
import { IsDocumentoValido } from '../validacoes/decorators/is-documento-valido.decorator';

// =============================================================================
// CREATE
// =============================================================================
export class CreateClienteDto {
  @ApiProperty({ description: 'Tipo de cliente (Pessoa Física ou Jurídica)' })
  @IsEnum(TipoCliente)
  @IsNotEmpty()
  tipoCliente: TipoCliente;

  @ApiProperty({ description: 'Nome ou Razão Social do cliente' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({ description: 'Nome fantasia do cliente' })
  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @ApiProperty({
    description: 'CPF ou CNPJ (somente dígitos)',
    example: '12345678901',
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 14)
  @Matches(/^[0-9]+$/, { message: 'O documento deve conter apenas números.' })
  @IsDocumentoValido()
  documento: string;

  @ApiPropertyOptional({ description: 'E-mail principal', format: 'email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone (apenas dígitos)', example: '11987654321' })
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve conter 10 ou 11 dígitos numéricos.',
  })
  @IsOptional()
  telefone?: string;

  @ApiPropertyOptional({ description: 'CEP principal do cliente', example: '01001000' })
  @IsString()
  @IsOptional()
  cep?: string;

  // Auditoria (preenchido no controller/interceptor)
  @ApiPropertyOptional({ readOnly: true })
  @IsOptional()
  criadoPor?: string;

  @ApiPropertyOptional({ readOnly: true })
  @IsOptional()
  criadoPorNome?: string;

  @ApiPropertyOptional({ readOnly: true })
  @IsOptional()
  criadoPorIp?: string;
}

// ========== DTO DE ATUALIZAÇÃO ==========
export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  @ApiProperty({ description: 'ID do cliente a ser atualizado' })
  @IsString()
  @IsNotEmpty()
  id: string; // O ID é requerido no DTO para requisições PUT, mesmo se for em param.
}

// ========== DTO DE CONSULTA COM PAGINAÇÃO ==========
export class ConsultarClienteDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou razão social (parcial)' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtro por CPF ou CNPJ (apenas dígitos)' })
  @IsString()
  @IsOptional()
  documento?: string;

  @ApiPropertyOptional({ enum: TipoCliente, description: 'Filtrar por tipo: PF ou PJ' })
  @IsEnum(TipoCliente)
  @IsOptional()
  tipoCliente?: TipoCliente;

  @ApiPropertyOptional({ type: Boolean, description: 'Clientes ativos? true/false' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  isAtivo?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Clientes inadimplentes? true/false' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  isInadimplente?: boolean;

  @ApiPropertyOptional({ default: 1, description: 'Número da página' })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Limite por página', maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Ordenar por campo (ex: nome, criadoEm)' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ default: 'ASC', description: 'Direção da ordenação: ASC ou DESC' })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

// ========== INTERFACE PARA BUSCA COM PRISMA ==========
export interface BuscarClientesParams {
  nome?: string;
  documento?: string;
  tipoCliente?: TipoCliente;
  isAtivo?: boolean;
  isInadimplente?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ========== DTOs DE RESPOSTA ==========
export interface EnderecoResponseDto {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  isPrincipal: boolean;
  isAtivo: boolean;
}

export interface ContatoResponseDto {
  id: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  isPrincipal: boolean;
  isAtivo: boolean;
}

export interface ClienteResponseDto {
  id: string;
  tipoCliente: string;
  nome: string;
  nomeFantasia: string | null;
  documento: string;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  website: string | null;
  isInadimplente: boolean;
  isAtivo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor: string | null;
  atualizadoPor: string | null;
  enderecos?: EnderecoResponseDto[];
  contatos?: ContatoResponseDto[];
}

// ========== OUTROS DTOs DE INTEGRAÇÃO (AGORA INCLUÍDOS AQUI) ==========
export class ConsultarCnpjDto { // INCLUÍDO E EXPORTADO AQUI
  @ApiProperty({ description: 'CNPJ para consulta', example: '00000000000100' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'O CNPJ deve conter apenas números.' })
  @Length(14, 14, { message: 'O CNPJ deve ter 14 dígitos.' })
  cnpj: string;
}

export class ConsultarCepDto { // INCLUÍDO E EXPORTADO AQUI
  @ApiProperty({ description: 'CEP para consulta', example: '01001000' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8}$/, { message: 'O CEP deve conter 8 dígitos numéricos.' })
  cep: string;
}

export interface EstatisticasResumoDto { // INCLUÍDO E EXPORTADO AQUI
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  clientesInadimplentes: number;
  clientesPessoaFisica: number;
  clientesPessoaJuridica: number;
  clientesUltimos30Dias: number;
  percentualInadimplencia: number;
}