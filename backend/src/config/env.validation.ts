// =============================================================================
// SmartPeças ERP - Validação das Variáveis de Ambiente (VERSÃO REFINADA)
// =============================================================================
// Arquivo: backend/src/config/env.validation.ts
//
// Versão: 2.1
// =============================================================================

import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  // ✅ SUGESTÃO: Validação mais estrita para garantir que é uma URI do PostgreSQL.
  DATABASE_URL: Joi.string().uri({
    scheme: /postgresql/,
  }).required(),

  // ✅ SUGESTÃO DE SEGURANÇA: Força um segredo JWT com no mínimo 32 caracteres.
  JWT_SECRET: Joi.string().min(32).required(),
  
  // ✅ SUGESTÃO: Garante que o formato de tempo de expiração seja válido (ex: '60s', '15m', '2h', '7d').
  JWT_EXPIRES_IN: Joi.string().pattern(/^(\d+)(s|m|h|d)$/).default('3600s'),

  FRONTEND_URL: Joi.string().uri().optional(),
});