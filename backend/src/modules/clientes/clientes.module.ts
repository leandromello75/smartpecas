// backend/src/modules/clientes/clientes.module.ts
// Versão: 1.0.0
import { Module, forwardRef } from '@nestjs/common';
import { ClientsController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { PrismaModule } from '../../prisma/prisma.module'; // Crie este módulo
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager'; // Importe se estiver configurando cache aqui
// Importar os serviços auxiliares
import { CnpjApiService } from './integracoes/cnpj-api.service';
import { CepApiService } from './integracoes/cep-api.service';
import { DocumentoValidatorService } from './validacoes/documento-validator.service';
import { UnicidadeValidatorService } from './validacoes/unicidade-validator.service';
import { ClienteMapper } from './mappers/cliente.mapper';
import { AuditoriaService } from './auditoria/auditoria.service';
import { IdempotencyService } from './auditoria/idempotency.service';
import { IntegridadeService } from './validacoes/integridade.service'; // Este também é novo, precisa de implementação básica
import { TenantThrottlerService } from './throttling/tenant-throttler.service';
import { ValidarDocumentoPipe } from './validacoes/pipes/validar-documento.pipe'; // O pipe é um provider se injetado

@Module({
  imports: [
    PrismaModule, // Crie um PrismaModule que exporte o PrismaService
    HttpModule,
    // Se o CacheModule for configurado no AppModule, não precisa ser aqui.
    // CacheModule.register({ ttl: 5000 }), // Exemplo, se configurado localmente
  ],
  controllers: [ClientesController],
  providers: [
    ClientesService,
    CnpjApiService,
    CepApiService,
    DocumentoValidatorService,
    UnicidadeValidatorService,
    ClienteMapper,
    AuditoriaService,
    IdempotencyService,
    IntegridadeService,
    TenantThrottlerService,
    // Se ValidarDocumentoPipe for injetado como Provider (e.g. APP_PIPE),
    // ele deve ser listado aqui. Se for instanciado com `new`, não precisa.
    ValidarDocumentoPipe,
  ],
  exports: [ClientesService], // Se outros módulos precisarem usar o ClientesService
})
export class ClientesModule {}
