// =============================================================================
// SmartPeças ERP - Serviço de Limite de Tentativas de Login
// =============================================================================
// Arquivo: backend/src/auth/login-rate-limiter.service.ts
//
// Descrição: Serviço para controlar tentativas de login falhas por usuário/IP
// e implementar bloqueios temporários para prevenir ataques de força bruta.
//
// Versão: 1.0.0
// Equipe SmartPeças
// Atualizado em: 07/07/2025
// =============================================================================

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ThrottlerException } from '@nestjs/throttler'; // Pode usar ou criar sua própria exceção

@Injectable()
export class LoginRateLimiterService {
  private readonly logger = new Logger(LoginRateLimiterService.name);
  private readonly MAX_ATTEMPTS = 5; // Número máximo de tentativas falhas
  private readonly LOCK_TIME_SECONDS = 300; // Tempo de bloqueio (5 minutos)
  private readonly ATTEMPT_WINDOW_SECONDS = 600; // Janela para contar tentativas (10 minutos)

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Verifica e registra tentativas de login. Lança exceção se o usuário/IP estiver bloqueado.
   * @param email Email do usuário tentando logar
   * @param ip IP de origem da requisição
   */
  async checkAttempts(email: string, ip: string): Promise<void> {
    const emailKey = `login_failed:${email}`;
    const ipKey = `login_failed_ip:${ip}`;
    const emailLockedKey = `login_locked:${email}`;
    const ipLockedKey = `login_locked_ip:${ip}`;

    // 1. Verificar se o e-mail ou IP já está bloqueado
    const isEmailLocked = await this.cacheManager.get<boolean>(emailLockedKey);
    const isIpLocked = await this.cacheManager.get<boolean>(ipLockedKey);

    if (isEmailLocked || isIpLocked) {
      this.logger.warn(`Tentativa de login bloqueada para email: ${email}, IP: ${ip} (bloqueado por ${isEmailLocked ? 'email' : 'IP'})`);
      throw new ThrottlerException('Muitas tentativas de login. Tente novamente mais tarde.');
    }

    // 2. Contar tentativas falhas (serão incrementadas por recordFailedAttempt)
    const emailAttempts = (await this.cacheManager.get<number>(emailKey)) ?? 0;
    const ipAttempts = (await this.cacheManager.get<number>(ipKey)) ?? 0;

    if (emailAttempts >= this.MAX_ATTEMPTS || ipAttempts >= this.MAX_ATTEMPTS) {
      // Bloquear email e IP
      await this.cacheManager.set(emailLockedKey, true, this.LOCK_TIME_SECONDS);
      await this.cacheManager.set(ipLockedKey, true, this.LOCK_TIME_SECONDS);
      this.logger.error(`Bloqueio de login ativado para email: ${email}, IP: ${ip}.`);
      throw new ThrottlerException('Muitas tentativas de login. Sua conta foi temporariamente bloqueada.');
    }
  }

  /**
   * Registra uma tentativa de login falha.
   * @param email Email do usuário tentando logar
   * @param ip IP de origem da requisição
   */
  async recordFailedAttempt(email: string, ip: string): Promise<void> {
    const emailKey = `login_failed:${email}`;
    const ipKey = `login_failed_ip:${ip}`;

    // Incrementar tentativas para o e-mail
    const currentEmailAttempts = (await this.cacheManager.get<number>(emailKey)) ?? 0;
    await this.cacheManager.set(emailKey, currentEmailAttempts + 1, this.ATTEMPT_WINDOW_SECONDS);

    // Incrementar tentativas para o IP
    const currentIpAttempts = (await this.cacheManager.get<number>(ipKey)) ?? 0;
    await this.cacheManager.set(ipKey, currentIpAttempts + 1, this.ATTEMPT_WINDOW_SECONDS);

    this.logger.warn(`Tentativa falha registrada para email: ${email}, IP: ${ip}. E-mail tentativas: ${currentEmailAttempts + 1}, IP tentativas: ${currentIpAttempts + 1}`);
  }

  /**
   * Reseta o contador de tentativas falhas após um login bem-sucedido.
   * @param email Email do usuário
   * @param ip IP de origem
   */
  async resetAttempts(email: string, ip: string): Promise<void> {
    const emailKey = `login_failed:${email}`;
    const ipKey = `login_failed_ip:${ip}`;
    await this.cacheManager.del(emailKey);
    await this.cacheManager.del(ipKey);
    // Também remova bloqueios, caso existam (se o usuário for desbloqueado manualmente ou após um período)
    await this.cacheManager.del(`login_locked:${email}`);
    await this.cacheManager.del(`login_locked_ip:${ip}`);
    this.logger.verbose(`Contadores de login resetados para email: ${email}, IP: ${ip}.`);
  }
}