import { Cliente, EnderecoCliente, ContatoCliente } from '../../generated/prisma-client';
import { ClienteResponseDto } from '../dto/cliente.dto';
export declare class ClienteMapper {
    static toResponse(cliente: Cliente & {
        enderecos?: EnderecoCliente[];
        contatos?: ContatoCliente[];
    }): ClienteResponseDto;
    private static mapEndereco;
    private static mapContato;
}
