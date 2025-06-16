// =============================================================================
// SmartPeças ERP - Interface Extendida para Request com Tenant
// =============================================================================
// Arquivo: backend/src/common/interfaces/request-with-tenant.interface.ts
//
// Descrição: Estende a interface Request do Express para incluir o contexto do
// inquilino (tenantContext), evitando o uso de 'as any' e promovendo tipagem forte.
//
// Versão: 1.0
//
// Equipe SmartPeças
// Criado em: 15/06/2025
// =============================================================================

import { Request } from 'express';
import { TenantContext } from '../tenant-context/tenant-context.service';

declare module 'express' {
  interface Request {
    tenantContext?: TenantContext;
  }
}
