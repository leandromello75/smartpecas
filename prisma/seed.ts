// prisma/seed.ts
// =============================================================================
// SmartPeças ERP - Script de Seed de Dados
// =============================================================================
// Descrição: Popula o banco de dados com dados iniciais, como um AdminUser.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Criado em: 10/07/2025
// =============================================================================

import { PrismaClient } from './../backend/src/generated/prisma-client'; // Importe o PrismaClient gerado
import * as bcrypt from 'bcrypt'; // npm install bcrypt

const prisma = new PrismaClient();

async function main() {
  // Criptografar a senha do admin
  const hashedPassword = await bcrypt.hash('q1w2e3r4t5', 10); // USE UMA SENHA FORTE

  // Criar um Tenant padrão (se ainda não existir um com esse ID)
  const defaultTenant = await prisma.tenant.upsert({
    where: { id: 'default-smartpecas-tenant-id' }, // ID padrão para o tenant
    update: {},
    create: {
      id: 'default-smartpecas-tenant-id',
      name: 'SmartPeças Global',
      schemaUrl: 'public', // Para o schema 'public' do DB
      cnpj: '00000000000100',
      isActive: true,
      billingStatus: 'ACTIVE',
    },
  });

  // Criar o AdminUser global
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@smartpecas.com' },
    update: {},
    create: {
      email: 'admin@smartpecas.com',
      password: hashedPassword,
      name: 'Administrador Global',
      role: 'ADMIN', // Certifique-se de que este 'role' é um valor válido do seu enum Role
      isActive: true,
      tenantId: defaultTenant.id, // Associar ao tenant padrão
    },
  });

  console.log(`Seed concluído. AdminUser criado: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });