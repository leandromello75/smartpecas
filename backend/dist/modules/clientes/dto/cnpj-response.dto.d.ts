export type CnpjStatus = 'OK' | 'ERROR';
export interface CnpjResponseDto {
    status: CnpjStatus;
    message?: string;
    abertura?: string;
    data_situacao?: string;
    nome: string;
    fantasia: string;
    cnpj: string;
    email?: string;
    telefone?: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    atividadePrincipal: {
        text: string;
        code: string;
    }[];
    payloadOriginal?: any;
}
