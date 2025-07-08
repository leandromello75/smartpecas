// =============================================================================
// SmartPeças ERP - Mapper da Entidade Cliente
// =============================================================================
// Arquivo: backend/src/modules/clientes/mappers/cliente.mapper.ts
//
// Descrição: Classe responsável por mapear entidades do Prisma para DTOs de
// resposta, garantindo um contrato de dados consistente para a API.
//
// Versão: 1.0.5
// Equipe SmartPeças + Refatoração IA
// Atualizado em: 07/07/2025
// =============================================================================

// CORREÇÃO: Importe os tipos do cliente Prisma UNIFICADO
import { Cliente, EnderecoCliente, ContatoCliente } from '../../generated/prisma-client'; 
import { ClienteResponseDto, EnderecoResponseDto, ContatoResponseDto } from '../dto/cliente.dto';

/**
 * Mapeador para converter a entidade Cliente (Prisma) em um DTO de resposta.
 */
export class ClienteMapper {
  /**
   * Converte uma entidade Cliente do Prisma em um ClienteResponseDto.
   * @param cliente A entidade Cliente retornada pelo Prisma.
   * @returns Um DTO de resposta padronizado.
   */
  static toResponse(
    cliente: Cliente & {
      enderecos?: EnderecoCliente[];
      contatos?: ContatoCliente[];
    },
  ): ClienteResponseDto {
    return {
      id: cliente.id,
      tipoCliente: cliente.tipoCliente,
      nome: cliente.nome,
      nomeFantasia: cliente.nomeFantasia,
      documento: cliente.documento,
      email: cliente.email,
      telefone: cliente.telefone,
      celular: cliente.celular,
      website: cliente.website,
      isInadimplente: cliente.isInadimplente,
      isAtivo: cliente.isAtivo,
      criadoEm: cliente.criadoEm,
      atualizadoEm: cliente.atualizadoEm,
      criadoPor: cliente.criadoPor,
      atualizadoPor: cliente.atualizadoPor,
      enderecos: cliente.enderecos?.map(this.mapEndereco) ?? [],
      contatos: cliente.contatos?.map(this.mapContato) ?? [],
    };
  }

  /** @internal */
  private static mapEndereco(endereco: EnderecoCliente): EnderecoResponseDto {
    return {
      id: endereco.id,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      isPrincipal: endereco.isPrincipal,
      isAtivo: endereco.isAtivo,
    };
  }

  /** @internal */
  private static mapContato(contato: ContatoCliente): ContatoResponseDto {
    return {
      id: contato.id,
      nome: contato.nome,
      cargo: contato.cargo,
      email: contato.email,
      telefone: contato.telefone,
      celular: contato.celular,
      isPrincipal: contato.isPrincipal,
      isAtivo: contato.isAtivo,
    };
  }
}