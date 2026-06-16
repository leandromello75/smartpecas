import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDocumentoValido } from '../validacoes/decorators/is-documento-valido.decorator';

export enum TipoCliente {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}

export enum TipoEndereco {
  COMERCIAL = 'COMERCIAL',
  RESIDENCIAL = 'RESIDENCIAL',
  ENTREGA = 'ENTREGA',
  COBRANCA = 'COBRANCA',
}

export class CreateEnderecoDto {
  @ApiProperty({ enum: TipoEndereco })
  @IsEnum(TipoEndereco)
  tipo: TipoEndereco;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cep: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logradouro: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bairro: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  estado: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrincipal?: boolean;
}

export class UpdateEnderecoDto extends PartialType(CreateEnderecoDto) {}

export class CreateContatoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateContatoDto extends PartialType(CreateContatoDto) {}

export class CreateClienteDto {
  @ApiProperty({ enum: TipoCliente })
  @IsEnum(TipoCliente)
  @IsNotEmpty()
  tipoCliente: TipoCliente;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDocumentoValido()
  documento: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isAtivo?: boolean;

  @ApiPropertyOptional({ type: [CreateEnderecoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnderecoDto)
  @IsOptional()
  enderecos?: CreateEnderecoDto[];

  @ApiPropertyOptional({ type: [CreateContatoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContatoDto)
  @IsOptional()
  contatos?: CreateContatoDto[];
}

export class UpdateClienteDto {
  @ApiPropertyOptional({ enum: TipoCliente })
  @IsEnum(TipoCliente)
  @IsOptional()
  tipoCliente?: TipoCliente;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsDocumentoValido()
  documento?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAtivo?: boolean;
}

export class ConsultarClienteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documento?: string;

  @ApiPropertyOptional({ enum: TipoCliente })
  @IsEnum(TipoCliente)
  @IsOptional()
  tipoCliente?: TipoCliente;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === 'true' || value === true))
  isAtivo?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'nome', enum: ['nome', 'documento', 'createdAt', 'updatedAt'] })
  @IsIn(['nome', 'documento', 'createdAt', 'updatedAt'])
  @IsOptional()
  sortBy?: string = 'nome';

  @ApiPropertyOptional({ default: 'asc', enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class ConsultarCnpjDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cnpj: string;
}

export class ConsultarCepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cep: string;
}

export class CepResponseDto {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export class EnderecoResponseDto {
  id: string;
  tipo?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  isPrincipal: boolean;
}

export class ContatoResponseDto {
  id: string;
  nome: string;
  email?: string;
}

export class ClienteResponseDto {
  id: string;
  tipoCliente: string;
  nome: string;
  nomeFantasia?: string;
  documento: string;
  email?: string;
  isAtivo?: boolean;
  enderecos?: EnderecoResponseDto[];
  contatos?: ContatoResponseDto[];
}

export class EstatisticasResumoDto {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  clientesPessoaFisica: number;
  clientesPessoaJuridica: number;
  clientesUltimos30Dias: number;
}
