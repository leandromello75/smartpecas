// =============================================================================
// SmartPeças ERP - Tenant Service
// =============================================================================
// Arquivo: backend/src/tenant/tenant.service.ts
//
// Descrição: Serviço Tenant
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
  const { cnpj, email, name, adminName, password, ...rest } = createTenantDto;
  const schemaUrl = `tenant_${this.generateSlug(name || cnpj)}_${this.generateUniqueSuffix()}`;

  const existingTenant = await this.prisma.tenant.findFirst({
    where: {
      OR: [{ cnpj }, { name }],
    },
  });

  if (existingTenant) {
    if (existingTenant.cnpj === cnpj) {
      throw new ConflictException(`Um inquilino com o CNPJ '${cnpj}' já existe.`);
    }
    if (existingTenant.name === name) {
      throw new ConflictException(`Um inquilino com o nome '${name}' já existe.`);
    }
  }

  // ✅ Verifica se o e-mail já está em uso por outro admin global
  const existingAdminUser = await this.prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingAdminUser) {
    throw new ConflictException(`Um usuário administrador global com o e-mail '${email}' já existe.`);
  }

  try {
    const tenant = await this.prisma.$transaction(async (prismaTx) => {
      const createdTenant = await prismaTx.tenant.create({
        data: {
          name,
          cnpj,
          email,
          schemaUrl,
          isActive: true,
          ...rest,
        },
      });

      this.logger.log(`Tenant '${name}' criado no schema público.`);

      await this.prisma.createTenantSchema(schemaUrl);

      const hashedPassword = await bcrypt.hash(password, 10);

      await prismaTx.adminUser.create({
        data: {
          name: adminName,
          email,
          password: hashedPassword,
          tenantId: createdTenant.id,
          role: 'tenant_admin',
        },
      });

      this.logger.log(`AdminUser criado para tenant '${schemaUrl}'`);

      return createdTenant;
    });

    return tenant;
  } catch (error) {
    this.logger.error(`Erro ao criar tenant '${name}':`, error.stack);
    throw new InternalServerErrorException(
      `Erro ao criar o tenant '${name}': ${error.message}`,
    );
  }
}

  async findOne(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.getTenantById(id);
    if (!tenant) {
      throw new NotFoundException(`Inquilino com ID '${id}' não encontrado.`);
    }
    return tenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.getActiveTenants();
  }

  private generateSlug(text: string): string {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '_');
  }

  private generateUniqueSuffix(): string {
    return `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  }
}
