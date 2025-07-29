// =============================================================================
// SmartPeças ERP - LocalAuthGuard (Otimizado v1.0.4)
// =============================================================================
// Arquivo: backend/src/auth/guards/local-auth.guard.ts
//
// Descrição: Guarda de autenticação local usado para validar o login de
// administradores globais via e-mail e senha. Utiliza a estratégia 'local-admin'.
//
// Versão: 1.0.4
// Equipe SmartPeças
// Atualizado em: 08/07/2025
// =============================================================================

import {
//  ExecutionContext, // Mantido apenas para referência se for necessário, mas não no handleRequest
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminUser } from '@prisma/client'; // Importar o tipo AdminUser

@Injectable()
export class LocalAuthGuard extends AuthGuard('local-admin') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  /**
   * Sobrescreve handleRequest para personalizar o tratamento de erros da autenticação local.
   * Garante que um erro ou uma ausência de usuário lance uma UnauthorizedException.
   *
   * @param err Erro que pode vir da estratégia de autenticação.
   * @param user O objeto de usuário retornado pela estratégia, se a validação for bem-sucedida.
   * @param info Informações adicionais fornecidas pela estratégia do Passport.js.
   * @returns O objeto de usuário validado.
   * @throws UnauthorizedException se a autenticação falhar.
   */
  override handleRequest<TUser = AdminUser>( // ADICIONADO 'override'
    err: any,
    user: TUser,
    info: any,
    // REMOVIDOS 'context' e 'status' pois não são utilizados neste método
  ): TUser { 
    if (err || !user) {
      if (err) {
        this.logger.error(`Erro no LocalAuthGuard: ${err.message || err}`, err.stack);
      } else if (!user) {
        this.logger.warn(`Autenticação local falhou. Info: ${info?.message || 'N/A'}`);
      }
      throw err || new UnauthorizedException(info?.message || 'Credenciais inválidas.');
    }
    return user;
  }
}