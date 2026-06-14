// =============================================================================
// SmartPeças ERP - Bootstrap da Aplicação (VERSÃO DE PRODUÇÃO)
// =============================================================================
// Arquivo: backend/src/main.ts
//
// Descrição: Ponto de entrada da aplicação. Configura middlewares globais de
// segurança, performance, validação, CORS e documentação da API.
//
// Versão: 2.2
// =============================================================================

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');
    const port = process.env.PORT || 3000;

  // ======================================================
  // === Middlewares Globais de Segurança e Performance ===
  // ======================================================
  
  // 🛡️ SEGURANÇA: Configuração estrita de CORS para produção.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001', // Use uma variável de ambiente para o domínio do frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 🛡️ SEGURANÇA: Adiciona um conjunto de headers HTTP seguros.
  app.use(helmet());

  // 🚀 PERFORMANCE: Habilita a compressão Gzip para as respostas.
  app.use(compression());

  // ======================================================
  // === Pipes e Hooks Globais ===
  // ======================================================

  // ✅ VALIDAÇÃO: Pipe global que valida e transforma DTOs de entrada.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades não esperadas.
      transform: true, // Transforma os payloads para instâncias das classes DTO.
    }),
  );
  
  // ✅ CONFIABILIDADE: Habilita o encerramento gracioso da aplicação.
  app.enableShutdownHooks();
  
  // ======================================================
  // === Documentação da API (Swagger/OpenAPI) ===
  // ======================================================
  
  // Só gera a documentação em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('SmartPeças ERP API')
      .setDescription('Documentação da API para o sistema de gestão SmartPeças.')
      .setVersion('1.0')
      .addBearerAuth() // Adiciona o campo para o token JWT na interface
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document); // A documentação estará em /api-docs
    logger.log(`📄 Documentação da API disponível em http://localhost:${port}/api-docs`);
  }

  // Inicia o servidor
  await app.listen(port, '0.0.0.0');
    logger.log(`🚀 SmartPeças ERP rodando na porta: ${port}`);
    logger.log(`💡 Ambiente: ${process.env.NODE_ENV || 'production'}`);

  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error('❌ Erro fatal ao iniciar a aplicação:', error);
    process.exit(1); // Força o container a falhar visivelmente
  }
}

bootstrap();