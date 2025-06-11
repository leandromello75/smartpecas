# SmartPeças ERP 🚗

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellowgreen)
![Licença](https://img.shields.io/badge/licen%C3%A7a-propriet%C3%A1ria-red)

Um sistema de gestão (ERP) moderno, na nuvem e focado no setor de autopeças. O SmartPeças foi projetado para ser uma plataforma multi-tenant, utilizando inteligência artificial para otimizar processos e impulsionar o crescimento do seu negócio.

## 🚀 Sobre o Projeto

O SmartPeças ERP nasceu da necessidade de uma ferramenta robusta, inteligente e fácil de usar para distribuidores e varejistas de autopeças. A arquitetura moderna e escalável garante performance, enquanto o foco em IA oferece diferenciais competitivos únicos no mercado.

### ✨ Principais Funcionalidades

* **Multi-Tenancy**: Arquitetura preparada para operar com múltiplas empresas de forma segura e isolada.
* **Gestão de Produtos**: Cadastro detalhado de peças, com NCM/CEST e controle de compatibilidade veículo-peça.
* **Controle de Estoque Inteligente**: Previsão de demanda com IA, alertas de reposição e rastreamento completo de movimentações.
* **Frente de Caixa (PDV)**: Módulo de vendas ágil e otimizado para o balcão de autopeças.
* **Financeiro Completo**: Contas a pagar e receber, fluxo de caixa e conciliação bancária.
* **Módulo Fiscal**: Emissão de NF-e/NFC-e e cálculo automático de impostos.
* **Relatórios e Dashboards**: Visualização de dados para tomada de decisões estratégicas.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com as tecnologias mais modernas do ecossistema JavaScript/TypeScript, garantindo uma base sólida e performática.

* **Backend**: Node.js, NestJS, TypeScript
* **Banco de Dados**: PostgreSQL
* **ORM**: Prisma
* **Frontend**: React (Planejado)
* **Ambiente de Desenvolvimento**: Docker

## 🏁 Começando

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento localmente.

### Pré-requisitos

* [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose
* [Git](https://git-scm.com/)
* Um editor de código, como o [VS Code](https://code.visualstudio.com/)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone <URL-DO-SEU-REPOSITORIO>
    cd SmartPecas
    ```

2.  **Crie o arquivo de configuração na raiz:**
    Crie um arquivo chamado `.env` na pasta raiz do projeto (`/SmartPecas/`) com o seguinte conteúdo:
    ```env
    # Variáveis para o Docker Compose usar
    POSTGRES_USER=docker
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=smartpecas_dev
    ```

3.  **Suba os contêineres Docker:**
    Este comando irá construir as imagens e iniciar os serviços da API e do banco de dados.
    ```bash
    docker-compose up --build -d
    ```

4.  **Execute a migração do banco de dados:**
    Este comando cria todas as tabelas no banco de dados.
    ```bash
    docker-compose exec api npx prisma migrate dev
    ```

5.  **Pronto!**
    O servidor da API estará rodando em `http://localhost:3000`.

## 📄 Licença

Este projeto é distribuído sob uma licença proprietária. Veja o arquivo `LICENSE` para mais detalhes.

## 📧 Contato

**SmartPeças Team** - contato@smartpecas.com.br
