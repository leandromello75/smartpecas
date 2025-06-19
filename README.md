# SmartPeças ERP 🚗

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellowgreen)
![Licença](https://img.shields.io/badge/licen%C3%A7a-propriet%C3%A1ria-red)
![Docker](https://img.shields.io/badge/docker-ready-blue)

Um sistema de gestão (ERP) moderno, na nuvem e focado no setor de autopeças. O SmartPeças foi projetado para ser uma plataforma multi-tenant, utilizando inteligência artificial para otimizar processos e impulsionar o crescimento do seu negócio.

---

## 📋 Tabela de Conteúdos

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Começando (Desenvolvimento Local)](#-começando)
5. [Implantação (Produção)](#-implantação-em-produção)
6. [Comandos Úteis](#-comandos-úteis-admin)
7. [Contato](#-contato)
8. [Licença](#-licença)

---

## 🚀 Sobre o Projeto

O SmartPeças ERP nasceu da necessidade de uma ferramenta robusta, inteligente e fácil de usar para distribuidores e varejistas de autopeças. A arquitetura moderna e escalável garante performance, enquanto o foco em IA oferece diferenciais competitivos únicos no mercado.

### ✨ Principais Funcionalidades

* **Multi-Tenancy**: Operação segura e isolada para múltiplas empresas.
* **Gestão de Produtos**: Cadastro detalhado, NCM/CEST e compatibilidade peça-veículo.
* **Estoque Inteligente**: Previsão de demanda, alertas e rastreamento completo.
* **Frente de Caixa (PDV)**: Vendas otimizadas para balcão.
* **Financeiro**: Contas, fluxo de caixa e conciliação bancária.
* **Fiscal**: Emissão de NF-e/NFC-e e cálculo automático de impostos.
* **Relatórios e Dashboards**: Dados para decisões estratégicas.

---

## 🛠️ Tecnologias Utilizadas

* **Backend**: Node.js, NestJS, TypeScript
* **Banco de Dados**: PostgreSQL (multi-schema)
* **ORM**: Prisma
* **Frontend**: React (Planejado)
* **Infraestrutura / DevOps**: Docker, Docker Compose, Nginx

---

## 📂 Estrutura do Projeto

<pre lang="text"> <code> smartpecas/ ├── backend/ │ ├── Dockerfile │ └── ... ├── prisma/ │ └── schema.prisma ├── frontend/ # (Planejado) ├── .dockerignore ├── .env.example ├── docker-compose.yml ├── setup_server.sh └── README.md </code> </pre>
## 🏁 Começando

### Pré-requisitos

* [Docker + Docker Compose](https://docs.docker.com/engine/install/)
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (v18 ou superior, opcional para dev local)

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone [URL_DO_SEU_REPOSITORIO]
   cd smartpecas
Crie o arquivo .env:
cp .env.example .env

Suba os contêineres:
docker compose up --build -d

Execute a migração inicial:
docker compose exec backend npx prisma migrate dev --name init

Acesse:
http://localhost:3000

🏭 Implantação em Produção
1. Preparação do Servidor (Ubuntu 20.04)
Execute o script setup_server.sh no servidor:
wget https://raw.githubusercontent.com/smartpecas/setup_server.sh
chmod +x setup_server.sh
./setup_server.sh

2. Deploy do Projeto
ssh smartpecas@SEU_IP
cd /var/www/smartpecas
git clone https://github.com/leandromello75/smartpecas

3. Configure o ambiente
cp .env.example .env
nano .env

4. Suba os serviços
docker compose up --build -d
docker compose exec backend npx prisma migrate deploy

🛠️ Comandos Úteis (Admin)
Comando	Função
| Comando                           | Função                                    |
| --------------------------------- | ----------------------------------------- |
| `docker compose ps`               | Verifica os serviços ativos               |
| `docker compose logs -f backend`  | Verifica os logs do backend               |
| `docker compose down`             | Derruba todos os contêineres              |
| `docker compose exec db psql ...` | Abre o terminal SQL no banco (PostgreSQL) |


⚠️ Em produção, não use bind mounts (volumes: ./backend:/app). A imagem já contém todos os artefatos necessários.

📧 Contato
SmartPeças Team – contato@smartpecas.com.br

📄 Licença
Este projeto é distribuído sob uma licença proprietária.
Consulte o arquivo LICENSE para mais detalhes.
