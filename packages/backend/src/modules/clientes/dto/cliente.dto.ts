import {
  IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum,
  Length, IsBoolean, IsInt, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDocumentoValido } from '../validacoes/decorators/is-documento-valido.decorator';

export enum TipoCliente {
  PESSOA_FISICA   = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}

export enum TipoEndereco {
  COMERCIAL = 'COMERCIAL', RESIDENCIAL = 'RESIDENCIAL',
  ENTREGA = 'ENTREGA', COBRANCA = 'COBRANCA',
}

export class CreateClienteDto {
  @ApiProperty({ enum: TipoCliente }) @IsEnum(TipoCliente) @IsNotEmpty()
  tipoCliente: TipoCliente;
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiPropertyOptional() @IsString() @IsOptional() nomeFantasia?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @IsDocumentoValido() documento: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isAtivo?: boolean;
}

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

export class ConsultarClienteDto {
  @ApiPropertyOptional() @IsString() @IsOptional() nome?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() documento?: string;
  @ApiPropertyOptional({ enum: TipoCliente }) @IsEnum(TipoCliente) @IsOptional() tipoCliente?: TipoCliente;
  @ApiPropertyOptional() @IsBoolean() @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true) isAtivo?: boolean;
  @ApiPropertyOptional({ default: 1 }) @IsInt() @Min(1) @IsOptional()
  @Transform(({ value }) => parseInt(value)) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsInt() @Min(1) @Max(100) @IsOptional()
  @Transform(({ value }) => parseInt(value)) limit?: number = 20;
  @ApiPropertyOptional({ default: 'nome' }) @IsString() @IsOptional() sortBy?: string = 'nome';
  @ApiPropertyOptional({ default: 'asc' }) @IsString() @IsOptional() sortOrder?: string = 'asc';
}

export class ConsultarCnpjDto {
  @ApiProperty() @IsString() @IsNotEmpty() cnpj: string;
}

export class ConsultarCepDto {
  @ApiProperty() @IsString() @IsNotEmpty() cep: string;
}

export class CepResponseDto {
  cep?: string; logradouro?: string; complemento?: string;
  bairro?: string; localidade?: string; uf?: string; erro?: boolean;
}

export class EnderecoResponseDto {
  id: string; tipo?: string; cep: string; logradouro: string;
  numero: string; complemento?: string; bairro: string;
  cidade: string; estado: string; isPrincipal: boolean;
}

export class ContatoResponseDto {
  id: string; nome: string; email?: string;
}

export class ClienteResponseDto {
  id: string; tipoCliente: string; nome: string; nomeFantasia?: string;
  documento: string; email?: string; isAtivo?: boolean;
  enderecos?: EnderecoResponseDto[]; contatos?: ContatoResponseDto[];
}

export class EstatisticasResumoDto {
  totalClientes: number; clientesAtivos: number; clientesInativos: number;
  clientesPessoaFisica: number; clientesPessoaJuridica: number;
  clientesUltimos30Dias: number;
}
