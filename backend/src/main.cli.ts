
// =============================================================================
// SmartPeças ERP - Ponto de Entrada CLI
// =============================================================================
// Descrição: Inicializa a aplicação NestJS especificamente para comandos de linha
// de comando (CLI), utilizando nest-commander.
//
// backend/src/main.cli.ts
// Versão: 1.0.0
// Equipe SmartPeças
// Criado em: 10/07/2025
// =============================================================================

import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module'; // Importa o módulo raiz da sua aplicação
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CLI_Bootstrap');
  try {
    // CommandFactory.run processa todos os comandos NestJS CLI registrados via @Command()
    await CommandFactory.run(AppModule, {
      logger: ['log', 'error', 'warn'], // Configura o logger para a saída do CLI
      // Outras opções podem ser passadas aqui, se necessário.
      // Por exemplo, passar um contexto para o CLI se ele precisar de variáveis de ambiente específicas.
    });
    logger.log('Comandos CLI executados com sucesso.');
  } catch (error) {
    logger.error('Falha ao executar comandos CLI:', error);
    process.exit(1); // Sai com código de erro em caso de falha
  }
}

bootstrap();