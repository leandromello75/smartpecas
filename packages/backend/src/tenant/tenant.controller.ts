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

// =============================================================================
// Arquivo: backend/src/tenant/tenant.controller.ts (CORRIGIDO)
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
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
// ✅ CORREÇÃO: Tenant vem do cliente público
import { Tenant } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Cria um novo inquilino e seu usuário administrador' })
  @ApiResponse({ status: 201, description: 'Inquilino criado com sucesso.'})
  // ... outros @ApiResponse ...
  // ✅ CORREÇÃO: Método 'create' adicionado
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(createTenantDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um inquilino pelo seu ID' })
  @ApiResponse({ status: 200, description: 'Inquilino encontrado.' })
  @ApiResponse({ status: 404, description: 'Inquilino não encontrado.' })
  // ✅ CORREÇÃO: Método 'findOne' adicionado
  async findOne(@Param('id') id: string): Promise<Tenant | null> {
    return this.tenantService.findOne(id);
  }
}
