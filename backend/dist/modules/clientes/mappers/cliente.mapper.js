"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteMapper = void 0;
class ClienteMapper {
    static toResponse(cliente) {
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
    static mapEndereco(endereco) {
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
    static mapContato(contato) {
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
exports.ClienteMapper = ClienteMapper;
//# sourceMappingURL=cliente.mapper.js.map