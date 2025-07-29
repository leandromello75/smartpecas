// =============================================================================
// SmartPeças ERP - Tenant Service (VERSÃO FINAL REATORADA)
// =============================================================================
// Arquivo: backend/src/tenant/tenant.service.ts
// Versão: 3.3
// =============================================================================

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
// ✅ CORREÇÃO: Importando Tenant, AdminUser e Prisma do cliente público correto.
import { Tenant } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const { cnpj, email, name, adminName, password } = createTenantDto;

    // A lógica de verificação de conflitos está ótima.
    const existingTenant = await this.prisma.tenant.findFirst({
      where: { OR: [{ cnpj: cnpj }, { name }] },
    });
    if (existingTenant) {
      const field = existingTenant.cnpj === cnpj ? 'CNPJ' : 'nome';
      throw new ConflictException(`Um inquilino com este ${field} já existe.`);
    }

    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      throw new ConflictException(
        `Um usuário administrador com o e-mail '${email}' já existe.`,
      );
    }

    const schemaUrl = `tenant_${this.generateSlug(name)}_${this.generateUniqueSuffix()}`;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ SEGURANÇA E EFICIÊNCIA: Usando transação e 'nested write'
      // para criar o Tenant e o AdminUser em uma única operação atômica.
      const newTenant = await this.prisma.tenant.create({
        data: {
          name,
          cnpj,
          schemaUrl,
          adminUsers: {
            create: {
              email,
              password: hashedPassword,
              name: adminName,
            },
          },
        },
      });

      this.logger.log(`Tenant '${newTenant.name}' e Admin User criados no banco.`);

      // ✅ ARQUITETURA: Após o sucesso, chamamos a função para criar o schema físico.
      // Isso assume que seu PrismaService tem o método que implementamos antes.
      await this.prisma.createTenantSchema(schemaUrl);

      return newTenant;
    } catch (error: any) {
      this.logger.error(`Erro ao criar tenant '${name}':`, error.stack);
      throw new InternalServerErrorException('Não foi possível criar o tenant.');
    }
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Inquilino com ID '${id}' não encontrado.`);
    }
    return tenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  private generateSlug(text: string): string {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
  }

  private generateUniqueSuffix(): string {
    return `${Date.now()}`.slice(-6);
  }
}
