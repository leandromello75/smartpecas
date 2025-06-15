// =============================================================================
// SmartPeças ERP - Tenant Controller
// =============================================================================
// Arquivo: backend/src/tenant/tenant.controller.ts
//
// Descrição: Controlador responsável por rotas de criação e consulta de tenants
// (empresas) e seus ambientes multi-schema no banco de dados.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
// import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Cria um novo inquilino e seu usuário administrador global',
  })
  @ApiResponse({
  status: 201,
  description: 'Inquilino e administrador criados com sucesso.',
  schema: { // Adicionar o schema de retorno para documentação Swagger
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Tenant e administrador criados com sucesso.' },
      tenant: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-tenant' },
          name: { type: 'string', example: 'Nome da Loja X' },
          schemaUrl: { type: 'string', example: 'tenant_nomedaloja_12345' }, // Se for retornar
        },
      },
    },
  },
})
@ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
@ApiResponse({ status: 409, description: 'Conflito: nome, CNPJ ou e-mail do administrador já existe.' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor ao criar o inquilino.' })
