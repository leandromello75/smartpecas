import { Cliente, EnderecoCliente, ContatoCliente } from '@prisma/client';
import { ClienteResponseDto, EnderecoResponseDto, ContatoResponseDto } from '../dto/cliente.dto';

export class ClienteMapper {
  static toResponse(
    cliente: Cliente & { enderecos?: EnderecoCliente[]; contatos?: ContatoCliente[] },
  ): ClienteResponseDto {
    return {
      id: cliente.id,
      tipoCliente: cliente.tipoCliente as string,
      nome: cliente.nome,
      nomeFantasia: cliente.nomeFantasia ?? undefined,
      documento: cliente.documento,
      email: cliente.email ?? undefined,
      isAtivo: cliente.isAtivo,
      enderecos: cliente.enderecos?.map(ClienteMapper.mapEndereco) ?? [],
      contatos: cliente.contatos?.map(ClienteMapper.mapContato) ?? [],
    };
  }

  private static mapEndereco(e: EnderecoCliente): EnderecoResponseDto {
    return {
      id: e.id,
      tipo: e.tipo as string,
      cep: e.cep,
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento ?? undefined,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
      isPrincipal: e.isPrincipal,
    };
  }

  private static mapContato(c: ContatoCliente): ContatoResponseDto {
    return {
      id: c.id,
      nome: c.nome,
      email: c.email ?? undefined,
    };
  }
}
