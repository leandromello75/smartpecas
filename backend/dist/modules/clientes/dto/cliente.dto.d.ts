import { TipoCliente } from '../../../generated/prisma-client';
export declare class CreateClienteDto {
    tipoCliente: TipoCliente;
    nome: string;
    nomeFantasia?: string;
    documento: string;
    email?: string;
    telefone?: string;
    cep?: string;
    criadoPor?: string;
    criadoPorNome?: string;
    criadoPorIp?: string;
}
declare const UpdateClienteDto_base: import("@nestjs/common").Type<Partial<CreateClienteDto>>;
export declare class UpdateClienteDto extends UpdateClienteDto_base {
    id: string;
}
export declare class ConsultarClienteDto {
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
export declare class ConsultarCnpjDto {
    cnpj: string;
}
export declare class ConsultarCepDto {
    cep: string;
}
export interface EstatisticasResumoDto {
    totalClientes: number;
    clientesAtivos: number;
    clientesInativos: number;
    clientesInadimplentes: number;
    clientesPessoaFisica: number;
    clientesPessoaJuridica: number;
    clientesUltimos30Dias: number;
    percentualInadimplencia: number;
}
export {};
