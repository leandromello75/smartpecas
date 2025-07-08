// =============================================================================
// SmartPeças ERP - Service - Módulo Clientes (Versão Otimizada v4.2)
// =============================================================================
// Arquivo: backend/src/modules/clientes/clientes.service.ts
//
// Descrição: Service completo para gestão de clientes com suporte a multi-tenancy,
// idempotência transacional, cache inteligente, retry pattern, métricas,
// rate limiting por tenant, auditoria avançada e full-text search.
//
// Versão: 4.2.0
// Equipe SmartPeças + Otimizações IA
// Atualizado em: 03/07/2025
// =============================================================================

// ... (imports existentes)

// NOVO: Importar 'Prisma' para tipagem de transação, se já não estiver
import { Prisma } from '@prisma/client'; 
// NOVO: Importar o IdempotencyService (se você já o refatorou para usar)
import { IdempotencyService } from '../auditoria/idempotency.service'; // Caminho de acordo com a estrutura

@Injectable()
export class ClientesService {
  // ... (propriedades e construtor existentes)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cnpjApi: CnpjApiService,
    private readonly cepApi: CepApiService,
    private readonly docValidator: DocumentoValidatorService,
    private readonly unicidadeValidator: UnicidadeValidatorService,
    private readonly auditoriaService: AuditoriaService,
    private readonly integridadeService: IntegridadeService,
    private readonly tenantThrottler: TenantThrottlerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // NOVO: Injetar IdempotencyService
    private readonly idempotencyService: IdempotencyService, 
  ) {
    // ... (registro de métricas)
  }

  /**
   * Criar novo cliente com idempotência, cache e auditoria
   */
  async criar(
    tenantId: string,
    dto: CreateClienteDto,
    usuario?: any, // Adicionado como parâmetro opcional para auditoria
    idemKey?: string
  ): Promise<ClienteResponseDto> {
    // ... (lógica de criar, conforme o ClientesService v4.2 que eu já forneci com IdempotencyService)
    // A lógica de idempotência aqui deve ser encapsulada pelo idempotencyService.executeOrRecover
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'criar' });

    try {
      await this.tenantThrottler.checkLimit(tenantId, 'criar');

      const result = await this.idempotencyService.executeOrRecover(
        idemKey,
        tenantId,
        'clientes.criar',
        async (tx: Prisma.TransactionClient) => { // Tipagem explícita para 'tx'
          const documentoLimpo = dto.documento?.replace(/[^\d]/g, '');
          if (!documentoLimpo) throw new BadRequestException('Documento (CPF/CNPJ) é obrigatório.');

          await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
          await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo);
          if (dto.email) await this.unicidadeValidator.validarEmail(tenantId, dto.email);

          const cliente = await tx.cliente.create({
            data: {
              ...dto,
              documento: documentoLimpo,
              tenantId,
              criadoPor: usuario?.id,
              criadoPorNome: usuario?.name,
              criadoPorIp: usuario?.ip,
              versao: 1,
            },
            include: { enderecos: true, contatos: true },
          });

          const responseDto = ClienteMapper.toResponse(cliente);

          await this.auditoriaService.registrarOperacao(
            tenantId,
            'CRIAR',
            cliente.id,
            null,
            responseDto,
            usuario,
          );

          this.logger.verbose(`[${tenantId}] Cliente criado: ${cliente.id}`);
          return responseDto;
        },
        'ClientesService.criar',
      );

      await this.invalidarCacheCliente(tenantId);
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar', status: 'success' });
      return result;

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar', status: 'error' });
      this.logger.error(`[${tenantId}] Erro ao criar cliente: ${error.message}`, error.stack);
      throw error;
    } finally {
      timer();
    }
  }


  /**
   * Atualizar cliente com auditoria e cache
   */
  async atualizar(
    tenantId: string,
    id: string,
    dto: UpdateClienteDto,
    usuario?: any // Adicionado como parâmetro opcional para auditoria
  ): Promise<ClienteResponseDto> {
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'atualizar' });
    
    try {
      const clienteAnterior = await this.buscarPorId(tenantId, id);
      
      const prisma = await this.prisma.getTenantClient(tenantId);
      const documentoLimpo = dto.documento ? dto.documento.replace(/[^\d]/g, '') : undefined;

      if (documentoLimpo) {
        await this.docValidator.validar(dto.tipoCliente, documentoLimpo);
        await this.unicidadeValidator.validarDocumento(tenantId, documentoLimpo, id);
      }
      if (dto.email) {
        await this.unicidadeValidator.validarEmail(tenantId, dto.email, id);
      }

      const cliente = await prisma.cliente.update({
        where: { id, tenantId },
        data: {
          ...dto,
          documento: documentoLimpo,
          atualizadoPor: usuario?.id,
          atualizadoPorNome: usuario?.name,
          atualizadoPorIp: usuario?.ip,
          versao: { increment: 1 },
        },
        include: { enderecos: true, contatos: true },
      });

      const response = ClienteMapper.toResponse(cliente);

      await this.auditoriaService.registrarOperacao(
        tenantId,
        'ATUALIZAR',
        id,
        clienteAnterior,
        response,
        usuario,
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Cliente atualizado: ${id}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'atualizar', status: 'success' });
      return response;

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'atualizar', status: 'error' });
      if (error.code === 'P2025') {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
      }
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Desativar cliente com validação de integridade
   */
  async desativar(tenantId: string, id: string, usuario?: any): Promise<void> { // Adicionado usuario
    // ... (lógica existente)
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'desativar' });
    
    try {
      await this.integridadeService.validarExclusaoCliente(tenantId, id);

      const prisma = await this.prisma.getTenantClient(tenantId);
      const result = await prisma.cliente.updateMany({
        where: { id, tenantId },
        data: {
          isAtivo: false,
          deletedAt: new Date(),
          deletedBy: usuario?.id, // Usa o usuario
          deleteReason: 'Desativação manual',
        }
      });

      if (result.count === 0) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado para desativação.`);
      }

      await this.auditoriaService.registrarOperacao(
        tenantId,
        'DESATIVAR',
        id,
        null,
        { isAtivo: false },
        usuario,
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Cliente desativado: ${id}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'desativar', status: 'success' });

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'desativar', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Reativar cliente
   */
  async reativar(tenantId: string, id: string, usuario?: any): Promise<void> { // Adicionado usuario
    // ... (lógica existente)
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'reativar' });
    
    try {
      const prisma = await this.prisma.getTenantClient(tenantId);
      const result = await prisma.cliente.updateMany({
        where: { id, tenantId },
        data: {
          isAtivo: true,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
        }
      });

      if (result.count === 0) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado para reativação.`);
      }

      await this.auditoriaService.registrarOperacao(
        tenantId,
        'REATIVAR',
        id,
        null,
        { isAtivo: true },
        usuario,
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Cliente reativado: ${id}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'reativar', status: 'success' });

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'reativar', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Alterar status de inadimplência
   */
  async alterarStatusInadimplencia(
    tenantId: string,
    id: string,
    inadimplente: boolean,
    usuario?: any // Adicionado usuario
  ): Promise<void> {
    // ... (lógica existente)
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'alterar_inadimplencia' });
    
    try {
      const prisma = await this.prisma.getTenantClient(tenantId);
      const result = await prisma.cliente.updateMany({
        where: { id, tenantId },
        data: { isInadimplente: inadimplente }
      });

      if (result.count === 0) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
      }

      await this.auditoriaService.registrarOperacao(
        tenantId,
        inadimplente ? 'MARCAR_INADIMPLENTE' : 'DESMARCAR_INADIMPLENTE',
        id,
        null,
        { isInadimplente: inadimplente },
        usuario,
      );

      await this.invalidarCacheCliente(tenantId, id);
      
      this.logger.verbose(`[${tenantId}] Status inadimplência do cliente ${id}: ${inadimplente}`);
      this.operationCounter.inc({ tenant: tenantId, operation: 'alterar_inadimplencia', status: 'success' });

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'alterar_inadimplencia', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Consultar CNPJ com retry pattern e rate limiting
   */
  async consultarCnpj(dto: ConsultarCnpjDto, tenantId?: string) { // Adicionado tenantId para o rate limiting
    // ... (lógica existente)
    const timer = this.operationDuration.startTimer({ tenant: tenantId || 'global', operation: 'consultar_cnpj' });
    
    try {
      if (tenantId) {
        await this.tenantThrottler.checkLimit(tenantId, 'consultar-cnpj');
      }

      const cacheKey = `cnpj:${dto.cnpj}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj' });
        return cached;
      }

      const result = await from(this.cnpjApi.consultar(dto.cnpj))
        .pipe(
          retry({
            count: 3,
            delay: (error, retryCount) => {
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(`[${tenantId}] Tentativa ${retryCount + 1} de consulta CNPJ ${dto.cnpj} em ${delay}ms`);
              return timer(delay);
            },
          })
        )
        .toPromise();

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
      
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj', status: 'success' });
      return result;

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cnpj', status: 'error' });
      this.logger.error(`Erro ao consultar CNPJ ${dto.cnpj} após 3 tentativas: ${error.message}`);
      
      if (error.response?.status === 400) {
        throw new BadRequestException(`CNPJ inválido ou não encontrado: ${dto.cnpj}`);
      }
      throw new InternalServerErrorException('Serviço de CNPJ temporariamente indisponível.');
    } finally {
      timer();
    }
  }

  /**
   * Consultar CEP com retry pattern e cache
   */
  async consultarCep(dto: ConsultarCepDto, tenantId?: string) { // Adicionado tenantId para o rate limiting
    // ... (lógica existente)
    const timer = this.operationDuration.startTimer({ tenant: tenantId || 'global', operation: 'consultar_cep' });
    
    try {
      if (tenantId) {
        await this.tenantThrottler.checkLimit(tenantId, 'consultar-cep');
      }

      const cacheKey = `cep:${dto.cep}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep' });
        return cached;
      }

      const result = await from(this.cepApi.consultar(dto.cep))
        .pipe(
          retry({
            count: 3,
            delay: (error, retryCount) => {
              const delay = Math.pow(2, retryCount) * 1000;
              this.logger.warn(`[${tenantId}] Tentativa ${retryCount + 1} de consulta CEP ${dto.cep} em ${delay}ms`);
              return timer(delay);
            },
          })
        )
        .toPromise();

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_LONGO);
      
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep', status: 'success' });
      return result;

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId || 'global', operation: 'consultar_cep', status: 'error' });
      this.logger.error(`Erro ao consultar CEP ${dto.cep} após 3 tentativas: ${error.message}`);
      
      if (error.response?.status === 400 || error.response?.data?.erro) {
        throw new BadRequestException(`CEP inválido ou não encontrado: ${dto.cep}`);
      }
      throw new InternalServerErrorException('Serviço de CEP temporariamente indisponível.');
    } finally {
      timer();
    }
  }

  /**
   * Criar cliente com CNPJ automaticamente
   */
  async criarClienteComCnpj(
    tenantId: string,
    cnpj: string,
    meta: Partial<CreateClienteDto>,
    usuario?: any,
    idemKey?: string
  ) {
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'criar_com_cnpj' });
    
    try {
      let dadosCnpj;
      try {
        dadosCnpj = await this.consultarCnpj({ cnpj }, tenantId);
      } catch (error) {
        this.logger.error(`Erro ao consultar CNPJ para criação de cliente ${cnpj}: ${error.message}`);
        if (error.response?.status === 400) {
          throw new BadRequestException(`Não foi possível obter dados para o CNPJ fornecido: ${cnpj}`);
        }
        throw new InternalServerErrorException('Erro ao criar cliente com CNPJ. Falha na consulta externa.');
      }

      const dto: CreateClienteDto = {
        tipoCliente: 'PESSOA_JURIDICA',
        nome: dadosCnpj.nome,
        nomeFantasia: dadosCnpj.fantasia,
        documento: dadosCnpj.cnpj,
        email: dadosCnpj.email,
        telefone: dadosCnpj.telefone,
        cep: dadosCnpj.cep,
        logradouro: dadosCnpj.logradouro,
        numero: dadosCnpj.numero,
        complemento: dadosCnpj.complemento,
        bairro: dadosCnpj.bairro,
        cidade: dadosCnpj.municipio,
        estado: dadosCnpj.uf,
        dadosCnpjApi: dadosCnpj,
        ultimaConsultaCnpj: new Date(),
        ...meta,
      };

      const result = await this.criar(tenantId, dto, usuario, idemKey);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar_com_cnpj', status: 'success' });
      return result;

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'criar_com_cnpj', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Obter estatísticas resumo com cache
   */
  async obterEstatisticasResumo(tenantId: string): Promise<EstatisticasResumoDto> {
    const timer = this.operationDuration.startTimer({ tenant: tenantId, operation: 'estatisticas' });
    
    try {
      const cacheKey = `estatisticas:${tenantId}`;
      
      // Verificar cache (5 minutos)
      const cached = await this.cacheManager.get<EstatisticasResumoDto>(cacheKey);
      if (cached) {
        this.cacheHitCounter.inc({ tenant: tenantId, operation: 'estatisticas' });
        return cached;
      }

      const prisma = await this.prisma.getTenantClient(tenantId);
      
      const [
        totalClientes,
        clientesAtivos,
        clientesInadimplentes,
        clientesPF,
        clientesPJ,
        clientesUltimos30Dias,
      ] = await Promise.all([
        prisma.cliente.count({ where: { tenantId } }),
        prisma.cliente.count({ where: { tenantId, isAtivo: true } }),
        prisma.cliente.count({ where: { tenantId, isInadimplente: true } }),
        prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_FISICA' } }),
        prisma.cliente.count({ where: { tenantId, tipoCliente: 'PESSOA_JURIDICA' } }),
        prisma.cliente.count({
          where: {
            tenantId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }),
      ]);

      const estatisticas: EstatisticasResumoDto = {
        totalClientes,
        clientesAtivos,
        clientesInativos: totalClientes - clientesAtivos,
        clientesInadimplentes,
        clientesPessoaFisica: clientesPF,
        clientesPessoaJuridica: clientesPJ,
        clientesUltimos30Dias,
        percentualInadimplencia: totalClientes > 0 ? (clientesInadimplentes / totalClientes) * 100 : 0,
      };

      // Cachear por 5 minutos
      await this.cacheManager.set(cacheKey, estatisticas, this.CACHE_TTL);
      
      this.operationCounter.inc({ tenant: tenantId, operation: 'estatisticas', status: 'success' });
      return estatisticas;

    } catch (error) {
      this.operationCounter.inc({ tenant: tenantId, operation: 'estatisticas', status: 'error' });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Métodos privados auxiliares
   */
  private montarFiltros(f: ConsultarClienteDto) {
    const where: any = {};
    if (f.apenasAtivos !== false) where.isAtivo = true;
    if (f.tipoCliente) where.tipoCliente = f.tipoCliente;
    if (f.apenasInadimplentes) where.isInadimplente = true;
    if (f.busca) {
      where.OR = [
        { nome: { contains: f.busca, mode: 'insensitive' } },
        { nomeFantasia: { contains: f.busca, mode: 'insensitive' } },
        { documento: { contains: f.busca.replace(/[^\d]/g, '') } },
        { email: { contains: f.busca, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private async invalidarCacheCliente(tenantId: string, clienteId?: string): Promise<void> {
    const patterns = [
      `clientes_lista:${tenantId}:*`,
      `estatisticas:${tenantId}`,
    ];

    if (clienteId) {
      patterns.push(`cliente:${tenantId}:${clienteId}`);
      patterns.push(`cliente_doc:${tenantId}:*`); // Adicionado para invalidar cache de busca por documento
    }

    // Invalidar cache por padrões de forma assíncrona
    await Promise.all(patterns.map(async (pattern) => {
        try {
            // Verifica se o cacheManager suporta wildcards (Redis, por exemplo)
            if (this.cacheManager.store.keys) {
                const keys = await this.cacheManager.store.keys(pattern);
                await Promise.all(keys.map(key => this.cacheManager.del(key)));
            } else {
                // Para caches que não suportam wildcards (ex: memory), deleta a chave exata
                await this.cacheManager.del(pattern);
            }
        } catch (error) {
            this.logger.warn(`Erro ao invalidar cache para o padrão ${pattern}: ${error.message}`);
        }
    }));
  }
}