# 📘 Documentação Mestre Oficial — Leve Mobilidade ERP (v3.0)

> **Versão:** 3.0 | **Gerado em:** 2026-03-26 | **Fonte:** Auditoria técnica completa do código-fonte real
> **Status:** ✅ Validado contra o repositório `c:\VibeCoding\leve-erp`

> ⚠️ Este documento substitui `documentacao_mestre_leve_mobilidade.md` (v2) como fonte da verdade.
> Marcadores de confiança: ✅ Confirmado no código | ⚠️ Inferência provável | 🔄 Precisa validação manual

---

## 📑 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Mapa Completo de Módulos](#3-mapa-completo-de-módulos)
4. [Estrutura de Navegação e Rotas](#4-estrutura-de-navegação-e-rotas)
5. [Banco de Dados](#5-banco-de-dados)
6. [APIs e Endpoints](#6-apis-e-endpoints)
7. [Autenticação, Autorização e Perfis](#7-autenticação-autorização-e-perfis)
8. [Fluxos Funcionais](#8-fluxos-funcionais)
9. [Integrações e Serviços Externos](#9-integrações-e-serviços-externos)
10. [Interface, UX e Design System](#10-interface-ux-e-design-system)
11. [Auditoria e Rastreabilidade](#11-auditoria-e-rastreabilidade)
12. [Regras de Negócio](#12-regras-de-negócio)
13. [Segurança e Riscos](#13-segurança-e-riscos)
14. [Dívida Técnica e Backlog](#14-dívida-técnica-e-backlog)
15. [Configurações e Ambiente](#15-configurações-e-ambiente)
16. [Glossário](#16-glossário)
17. [Guia de Continuidade](#17-guia-de-continuidade)

---

## 1. VISÃO GERAL DO SISTEMA

- **Nome:** Leve Mobilidade ERP Corporativo ✅
- **Propósito:** Gestão centralizada de operações de estacionamento terceirizado, sinistros, faturamento, metas e processos internos. ✅
- **Tipo:** Web Application B2B Admin (App Router SPA-like) ✅
- **Público-Alvo:** Equipes internas — supervisores de campo, analistas, gerentes de operações, financeiro, auditoria, diretoria e TI. ✅
- **Contexto de Negócio:** A empresa atende grandes varejistas (GPA, Assaí, Carrefour, etc.) em operações de estacionamento e facility management. O sistema centraliza sinistros, faturamento operacional, metas e processos administrativos. ✅

### Escopo Atual (13 Módulos) ✅

| # | Módulo | Status | Complexidade |
|--|--|--|--|
| 1 | Dashboard | ✅ Produção | Baixa |
| 2 | Sinistros | ✅ Produção | Alta |
| 3 | Operações | ✅ Produção | Média |
| 4 | Tarifários e Convênios | ✅ Produção | Média |
| 5 | Faturamento | ✅ Produção | Muito Alta |
| 6 | Metas de Faturamento | ✅ Produção | Alta |
| 7 | Alertas de Faturamento | ✅ Produção | Alta |
| 8 | Auditoria de Metas | ✅ Produção | Média |
| 9 | Central de Solicitações | ✅ Produção | Alta |
| 10 | Administração (Usuários/Supervisores/Gerentes) | ✅ Produção | Média |
| 11 | Permissões e Governança | ✅ Produção | Média |
| 12 | Configurações do Sistema | ✅ Produção | Baixa |
| 13 | Log de Auditoria | ✅ Produção | Baixa |

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Stack Tecnológica ✅

| Camada | Tecnologia | Versão | Fonte |
|--|--|--|--|
| Framework | Next.js (App Router) | 16.1.6 | `package.json` |
| Linguagem | TypeScript | ^5 | `package.json` |
| UI | React | 19.2.3 | `package.json` |
| Estilização | CSS puro (Vanilla) | `globals.css` (1553 linhas) | Sem Tailwind |
| Ícones | lucide-react | 0.577.0 | `package.json` |
| Gráficos | Recharts | 3.8.0 | `package.json` |
| Autenticação | NextAuth v5 (beta) | 5.0.0-beta.30 | `package.json` |
| Banco de Dados | Supabase PostgreSQL | @supabase/supabase-js 2.99.1 | `package.json` |
| SSR Supabase | @supabase/ssr | 0.9.0 | `package.json` |
| Hashing | bcryptjs | 3.0.3 | `package.json` |
| Data Fetching | SWR (módulos novos) | 2.4.1 | `package.json` |
| Virtualização | react-window | 2.2.7 | Tabelas pesadas |
| Integração Externa | googleapis (Google Drive) | 171.4.0 | `package.json` |
| Tipografia | Inter (texto) + Outfit (títulos) | Google Fonts | `globals.css` L6 |
| Deploy | Standalone build | `output: 'standalone'` | `next.config.ts` |

### 2.2 Arquitetura de Camadas ✅

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js App Router (Route Groups)                   │
│  React 19 Client Components + CSS Vanilla            │
│  SWR (faturamento/metas) | fetch (sinistros/ops)     │
│  ThemeProvider (Light/Dark)                           │
├─────────────────────────────────────────────────────┤
│                    BACKEND                           │
│  Next.js API Route Handlers (/api/*)                 │
│  Middleware de Auth (JWT 8h)                          │
│  withAudit() wrapper | getAuditedClient()            │
├─────────────────────────────────────────────────────┤
│                    BANCO DE DADOS                    │
│  Supabase PostgreSQL                                 │
│  ~40 tabelas | 10+ triggers | 3+ RPCs               │
│  Auditoria Global Automática (fn_auditoria_global)   │
│  RLS em sinistros                                    │
├─────────────────────────────────────────────────────┤
│                    INTEGRAÇÕES                       │
│  Google Drive API v3 (Sinistros/Tarifários)          │
│  Agentes Locais PowerShell (Faturamento)             │
│  Sistemas: PRESCON, PARCO, PERSONAL, etc.            │
└─────────────────────────────────────────────────────┘
```

### 2.3 Estrutura de Diretórios ✅

```
/src
 ├─ /app
 │  ├─ (dashboard)/              # Layout mestre autenticado
 │  │   ├─ dashboard/            # Painel geral
 │  │   ├─ admin/                # Administração
 │  │   │   ├─ usuarios/         # Gestão de usuários
 │  │   │   ├─ supervisores/     # Vínculos de supervisores
 │  │   │   ├─ gerentes/         # Vínculos de gerentes
 │  │   │   ├─ operacoes/        # Gerenciar operações
 │  │   │   ├─ faturamento/      # Dashboard de faturamento
 │  │   │   │   └─ metas/        # Metas de faturamento
 │  │   │   ├─ auditoria/        # Log de auditoria
 │  │   │   │   └─ metas/        # Auditoria de metas
 │  │   │   ├─ permissoes/       # Matriz de permissões
 │  │   │   └─ configuracoes/    # Configurações do sistema
 │  │   ├─ operacoes/            # Listagem de operações
 │  │   ├─ sinistros/            # Módulo de sinistros
 │  │   │   ├─ novo/             # Formulário de abertura
 │  │   │   ├─ [id]/             # Detalhe (68KB, ~1800 linhas)
 │  │   │   └─ relatorios/       # Relatórios
 │  │   ├─ tarifarios/           # Módulo de tarifários
 │  │   │   ├─ novo/
 │  │   │   └─ [id]/
 │  │   └─ central-solicitacoes/ # Central de solicitações (layout próprio)
 │  │       ├─ nova/
 │  │       ├─ [id]/
 │  │       ├─ todas/
 │  │       ├─ configuracoes/
 │  │       └─ relatorios/
 │  ├─ api/                      # ~35 endpoints REST
 │  └─ login/                    # Página pública
 ├─ /components                  # Sidebar, TopBar, componentes de faturamento
 ├─ /constants                   # Veículos (marcas/modelos)
 ├─ /lib                         # Negócio: auth, audit, permissions, drive, utils
 │  ├─ supabase/                 # Clientes server/client
 │  └─ contexts/                 # ThemeContext (light/dark)
 └─ /types                       # TypeScript types e enums
/supabase
 └─ ~34 arquivos SQL              # Schema base + evoluções
```

---

## 3. MAPA COMPLETO DE MÓDULOS

### 3.1 Dashboard ✅
- **Rota:** `/dashboard`
- **Objetivo:** Visão geral com indicadores e sinistros recentes
- **Perfis:** Todos (com filtro de escopo por perfil)

### 3.2 Sinistros ✅
- **Rotas:** `/sinistros`, `/sinistros/novo`, `/sinistros/[id]`, `/sinistros/relatorios`
- **APIs:** `GET/POST /api/sinistros`, `GET/PATCH /api/sinistros/[id]`, sub-rotas: anexos, inconsistencias, historico
- **Tabelas:** `sinistros`, `inconsistencias`, `anexos`, `historico_sinistros`
- **Regras de Negócio:**
  - SLA: 12 dias úteis a partir da ocorrência ✅
  - Detecção automática de fora-do-prazo (>48h úteis entre ocorrência e registro) ✅
  - Inconsistência automática se ausência de imagens CFTV ✅
  - Protocolo automático `LEVE-TIMESTAMP-RANDOM` ✅
  - PR automático `PR-ANO-SEQNUM` via sequence PostgreSQL ✅
  - Ciclo: Aberto → Em Análise → Aguardando Documentos → Aprovado → Reprovado → Encerrado ✅
  - Upload de anexos via Google Drive (12 categorias) ✅
  - RLS implementada (`evolution_sinistros_rls_v1.sql`) ✅

### 3.3 Operações ✅
- **Rotas:** `/operacoes` (listagem), `/admin/operacoes` (gerenciamento)
- **APIs:** `GET/POST /api/operacoes`, `GET/PATCH /api/operacoes/[id]`
- **Tabelas:** `operacoes` (30+ campos), `operacoes_automacao`, `automacoes_catalogo`
- **Regras de Negócio:**
  - Eixo central do sistema — toda FK transacional referencia `operacoes.id` ✅
  - Token de integração UUID auto gerado ✅
  - Herança automática de gerente via supervisor ✅
  - 30+ campos estruturais (vagas, CFTV, cancelas, funcionários, benefícios) ✅

### 3.4 Tarifários e Convênios ✅
- **Rotas:** `/tarifarios`, `/tarifarios/novo`, `/tarifarios/[id]`
- **APIs:** `GET/POST /api/tarifarios`, `GET/PATCH /api/tarifarios/[id]`, sub-rota: anexos
- **Tabelas:** `solicitacoes_tarifario`, `tarifarios_anexos`, `tarifarios_historico`
- **Fluxo:** Criação → Aprovação (diretoria) → Execução (TI) → Conclusão ✅
- **Upload:** Anexos via Google Drive ✅

### 3.5 Faturamento ✅
- **Rota:** `/admin/faturamento`
- **APIs:** `GET /api/faturamento` (modes: `all_data`, `details`), `POST /api/faturamento/importar-movimentos`, `POST /api/faturamento/report-execucao`, CRUD ajustes, GET templates, GET calendario
- **Tabelas:** `faturamento_movimentos`, `faturamento_resumo_diario`, `faturamento_ajustes`, `faturamento_importacao_logs`, `faturamento_sincronizacoes`, `faturamento_query_templates`
- **Arquitetura:**
  - Agentes locais (PowerShell) coletam dados de PRESCON/PARCO/PERSONAL ✅
  - Enviam via API REST com token de integração ✅
  - UPSERT com deduplicação por `(operacao_id, ticket_id)` ✅
  - Trigger statement-level consolida em `faturamento_resumo_diario` ✅
  - Ajustes manuais com trigger de re-consolidação ✅
  - Purga automática de dados antigos (buffer 8 dias) ✅
  - Templates SQL configuráveis por sistema ✅

### 3.6 Metas de Faturamento ✅
- **Rota:** `/admin/faturamento/metas`
- **APIs:** `GET/POST /api/metas-faturamento`, `GET/PATCH /api/metas-faturamento/[id]`, `GET /api/metas-faturamento/alertas`
- **Tabelas:** `metas_faturamento`, `metas_faturamento_apuracoes`, `metas_faturamento_alertas`, `metas_faturamento_tratativas`
- **Regras:**
  - Meta única por operação/período (UNIQUE constraint) ✅
  - Apuração via RPC `reprocessar_metas_diarias` 🔄
  - Geração automática de alertas por desvio de ritmo ✅
  - Geração automática de tratativas para criticidade ≥ média ✅

### 3.7 Motor de Alertas de Faturamento ✅
- **Engine:** `src/lib/faturamento-alertas.ts` → `FaturamentoAlertEngine`
- **APIs:** `GET/POST/PATCH/DELETE /api/faturamento/alertas`, `GET /api/faturamento/alertas/processar`
- **Tabelas:** `faturamento_regras_alerta`, `faturamento_alertas`, `faturamento_alertas_feedback`, `faturamento_alertas_v2_status`, `faturamento_operacao_calendario`, `faturamento_feriados`
- **Regras implementadas:**

| Código | Nome | Critério | Severidade | Score |
|--|--|--|--|--|
| `DIA_ZERADO` | Faturamento Zerado | Valor = 0 em dia operacional | Crítico | 50 |
| `SEQUENCIA_ABAIXO_META` | Sequência Abaixo Meta | 3 dias consecutivos < Meta Diária | Alerta | 30 |
| `QUEDA_BRUSCA_HISTORICA` | Queda Brusca | Queda > 35% vs média histórica | Alerta | 25 |
| `DESVIO_META_DIARIA` | Desvio Significativo | Desvio > 25% da Meta Diária | Insight | 15 |

- **Supressão:** Feriados, dias não operacionais, descarte manual ✅
- **Processamento:** Job agendado (NÃO roda em tempo real na tela) ✅

### 3.8 Auditoria de Metas ✅
- **Rota:** `/admin/auditoria/metas`
- **Perfis:** administrador, auditoria, diretoria
- **Função:** Interface de tratativa de alertas com split-screen e modal de análise

### 3.9 Central de Solicitações ✅
- **Rotas:** `/central-solicitacoes`, `/central-solicitacoes/nova`, `/central-solicitacoes/[id]`, `/central-solicitacoes/todas`, `/central-solicitacoes/configuracoes`, `/central-solicitacoes/relatorios`
- **APIs:** `GET/POST /api/central-solicitacoes`, `GET/PATCH /api/central-solicitacoes/[id]`, sub-rotas: config, interacoes
- **Tabelas:** 11 tabelas (`central_*`)
- **Regras:**
  - Protocolo auto `SOL-ANO-SEQ` ✅
  - Campos dinâmicos por departamento/categoria ✅
  - Interações tipadas (mensagem, status_change, upload, etc.) ✅
  - SLA configurável por categoria ✅
  - 4 departamentos seed (TI, RH, Financeiro, Operações) ✅

### 3.10 Administração ✅
- **Rotas:** `/admin/usuarios`, `/admin/supervisores`, `/admin/gerentes`, `/admin/operacoes`
- **APIs:** `GET/POST /api/usuarios`, admin sub-routes (modulos, perfis, etc.)
- **Função:** CRUD de hierarquia organizacional

### 3.11 Permissões e Governança ✅
- **Rota:** `/admin/permissoes`
- **APIs:** `GET/POST/PUT /api/permissoes`
- **Tabelas:** `perfis_permissoes`, `perfis_sistema`, `modulos_sistema`
- **Recursos:** Upsert em massa, clonagem de perfil, 7 níveis de acesso, escopo global/restrito

### 3.12 Configurações do Sistema ✅
- **Rota:** `/admin/configuracoes`
- **APIs:** `GET/PATCH /api/configuracoes`, `GET /api/configuracoes/test-connection`
- **Função:** Gestão de chaves de API, integração Drive, configs Supabase
- **Recurso:** Fallback para variáveis de ambiente

### 3.13 Log de Auditoria ✅
- **Rota:** `/admin/auditoria`
- **APIs:** `GET /api/auditoria` (modes: list, stats)
- **Função:** Consulta centralizada com filtros avançados e dashboard de contagens

---

## 4. ESTRUTURA DE NAVEGAÇÃO E ROTAS

### 4.1 Rotas Públicas ✅
| Rota | Função |
|--|--|
| `/login` | Formulário de acesso |
| `/api/auth/[...nextauth]` | Handlers NextAuth |
| `/api/faturamento/importar-movimentos` | API de importação (auth por token) |
| `/api/faturamento/report-execucao` | Report de agente (sem auth) |

### 4.2 Rotas Autenticadas ✅

| Rota | Tela | Perfis Permitidos (Sidebar) |
|--|--|--|
| `/dashboard` | Dashboard Geral | Todos |
| `/sinistros` | Controle de Sinistros | Todos (filtro RLS) |
| `/sinistros/novo` | Abertura de Sinistro | Supervisores, Gerentes, Admins |
| `/sinistros/[id]` | Tratativa de Sinistro (8 abas) | Envolvidos/Gestão |
| `/sinistros/relatorios` | Relatórios de Sinistros | ⚠️ Verificar |
| `/operacoes` | Lista de Operações | admin, diretoria, ger_ops, admin. |
| `/tarifarios` | Tarifários e Convênios | admin, diretoria, supervisor, ti |
| `/tarifarios/novo` | Nova Solicitação | Idem |
| `/tarifarios/[id]` | Detalhe da Solicitação | Idem |
| `/central-solicitacoes` | Central de Solicitações | Todos os 11 perfis |
| `/central-solicitacoes/nova` | Nova Solicitação | Todos |
| `/central-solicitacoes/[id]` | Detalhe da Solicitação | Todos |
| `/central-solicitacoes/todas` | Todas as Solicitações | admin, diretoria, admin., auditoria |
| `/central-solicitacoes/configuracoes` | Config da Central | admin, ti, admin. |
| `/central-solicitacoes/relatorios` | Relatórios | admin, diretoria, ger_ops, admin. |
| `/admin/faturamento` | Dashboard de Faturamento | admin, diretoria, financeiro, ger_ops |
| `/admin/faturamento/metas` | Metas e Alertas | admin, diretoria, financeiro, auditoria |
| `/admin/auditoria/metas` | Auditoria de Faturamentos | admin, auditoria, diretoria |
| `/admin/usuarios` | Gestão de Usuários | admin, admin., diretoria |
| `/admin/supervisores` | Supervisores | admin, admin., diretoria, ger_ops |
| `/admin/gerentes` | Gerentes | admin, admin., diretoria |
| `/admin/operacoes` | Gerenciar Operações | admin, admin., diretoria |
| `/admin/permissoes` | Perfis e Permissões | admin, ti |
| `/admin/configuracoes` | Configurações do Sistema | admin, ti |
| `/admin/auditoria` | Log de Auditoria | admin, ti |

---

## 5. BANCO DE DADOS

> Detalhamento completo em `docs/leve_erp_estrutura_dados.md`

### 5.1 Resumo ✅
- **SGBD:** PostgreSQL (Supabase) ✅
- **Total de tabelas:** ~40 ✅
- **Scripts SQL:** 34 arquivos em `/supabase/` ✅
- **Schema base:** `supabase/schema.sql` ✅
- **Convenção de nomes:** snake_case, timestamps em `criado_em`/`atualizado_em` (exceto faturamento alertas que usa `_at`) ⚠️

### 5.2 Tabelas por Módulo ✅

| Módulo | Tabelas | Qt |
|--|--|--|
| Core | `usuarios`, `operacoes`, `sinistros`, `inconsistencias`, `anexos`, `historico_sinistros` | 6 |
| Faturamento | `faturamento_movimentos`, `faturamento_resumo_diario`, `faturamento_ajustes`, `faturamento_importacao_logs`, `faturamento_sincronizacoes`, `faturamento_query_templates` | 6 |
| Alertas | `faturamento_operacao_calendario`, `faturamento_feriados`, `faturamento_regras_alerta`, `faturamento_alertas`, `faturamento_alertas_feedback`, `faturamento_alertas_v2_status` | 6 |
| Metas | `metas_faturamento`, `metas_faturamento_apuracoes`, `metas_faturamento_alertas`, `metas_faturamento_tratativas` | 4 |
| Central | `central_departamentos`, `central_status`, `central_prioridades`, `central_categorias`, `central_subcategorias`, `central_campos_dinamicos`, `central_solicitacoes`, `central_campos_valores`, `central_interacoes`, `central_anexos`, `central_departamentos_responsaveis` | 11 |
| Tarifários | `solicitacoes_tarifario`, `tarifarios_anexos`, `tarifarios_historico` | 3 |
| Governança | `configuracoes_sistema`, `perfis_permissoes`, `perfis_sistema`, `modulos_sistema`, `auditoria_administrativa` | 5 |
| Automações | `automacoes_catalogo`, `operacoes_automacao` | 2 |

### 5.3 Triggers Críticos ✅

| Trigger | Tabela | Tipo | Função |
|--|--|--|--|
| `fn_auditoria_global_automatica` | 10+ tabelas | AFTER ROW | Log automático em `auditoria_administrativa` |
| `trg_sync_resumo_movimentos_statement` | `faturamento_movimentos` | AFTER STATEMENT (INSERT) | Consolida em `faturamento_resumo_diario` |
| `trg_sync_resumo_*` (row-level) | `faturamento_movimentos` / `faturamento_ajustes` | AFTER ROW (UPDATE/DELETE) | Re-processa resumo diário |
| `update_atualizado_em` | Múltiplas | BEFORE UPDATE | Atualiza timestamp |
| `sp_ativar_auditoria_tabela` | — | PROCEDURE | Ativa auditoria em tabelas novas |

### 5.4 RPCs (Stored Procedures) 🔄

| RPC | Chamada em | Status |
|--|--|--|
| `faturamento_consolidar_dia_v2` | `importar-movimentos/route.ts` | 🔄 Schema SQL não encontrado localmente |
| `reprocessar_metas_diarias` | `metas-utils.ts` | 🔄 Schema SQL não encontrado localmente |
| `purgar_faturamento_antigo` | Função agendada | ✅ Definida em `evolution_faturamento_v5` |

---

## 6. APIS E ENDPOINTS

> Detalhamento completo em `docs/leve_erp_inventario_apis.md`

### 6.1 Padrões de API ✅
- **Framework:** Next.js Route Handlers
- **Auth:** NextAuth v5 JWT (8h de sessão)
- **Wrapper de Auditoria:** `withAudit()` para logging automático de acesso, erros e negações
- **Cliente de DB:** `getAuditedClient(userId)` para contexto de auditoria no PostgreSQL

### 6.2 Sumário de Endpoints ✅

| Módulo | Endpoints | Auth | Auditado |
|--|--|--|--|
| Faturamento | 8 (GET, POST, sub-routes) | JWT + Token | Parcial |
| Sinistros | 6 (CRUD + sub-routes) | JWT | ✅ `withAudit` |
| Operações | 3 (GET, POST, PATCH) | JWT | ✅ `withAudit` |
| Tarifários | 4 (CRUD + anexos) | JWT | ✅ `withAudit` |
| Metas | 4 (CRUD + alertas) | JWT | ✅ `withAudit` |
| Central | 4 (CRUD + config + interações) | JWT | ❌ Usa createClient |
| Usuários | 3 (GET, POST, PATCH) | JWT | ❌ Sem wrapper |
| Permissões | 3 (GET, POST, PUT) | JWT | ✅ `withAudit` |
| Auditoria | 1 (GET) | JWT | ❌ Admin direto |
| Configurações | 2 (GET, PATCH) | JWT | ✅ `withAudit` |
| Admin | 4 (modulos, perfis, rebuild, etc.) | JWT | ⚠️ Verificar |

---

## 7. AUTENTICAÇÃO, AUTORIZAÇÃO E PERFIS

### 7.1 Autenticação ✅
- **Engine:** NextAuth v5 (Credentials Provider)
- **Hash:** bcryptjs
- **Sessão:** JWT com TTL de 8 horas
- **Payload:** `{ id, name, email, perfil }`
- **Middleware:** `src/middleware.ts` — protege todas as rotas exceto whitelist

### 7.2 Perfis do Sistema ✅

| Perfil | Label | No Enum SQL | No TypeScript |
|--|--|--|--|
| `administrador` | Administrador | ✅ | ✅ |
| `diretoria` | Diretoria | ✅ | ✅ |
| `gerente_operacoes` | Gerente de Operações | ✅ | ✅ |
| `supervisor` | Supervisor | ✅ | ✅ |
| `analista_sinistro` | Analista de Sinistro | ✅ | ✅ |
| `financeiro` | Financeiro | ✅ | ✅ |
| `rh` | RH | ✅ | ✅ |
| `dp` | DP | ✅ | ✅ |
| `auditoria` | Auditoria | ✅ | ✅ |
| `ti` | TI | ✅ (via ALTER TYPE) | ✅ |
| `administrativo` | Administrativo | 🔄 Não confirmado no enum SQL | ✅ |

### 7.3 Funções de Permissão (`src/lib/permissions.ts`) ✅

| Função | Perfis Permitidos |
|--|--|
| `canAccessAdmin` | admin, diretoria, admin., ti |
| `canViewAll` | admin, diretoria |
| `canManageUsers` | admin, admin. |
| `canAccessSinistros` | admin, diretoria, ger_ops, supervisor, analista, financeiro, auditoria |
| `canAnalyzeSinistro` | admin, analista, ger_ops |
| `canApproveFinanceiro` | admin, financeiro, diretoria |
| `canAccessTarifarios` | admin, diretoria, supervisor, ti |
| `canApproveTarifario` | admin, diretoria |
| `canExecuteTarifario` | admin, ti |
| `canAccessMetas` | admin, diretoria, financeiro, auditoria, ger_ops |
| `canManageMetas` | admin, financeiro |
| `canAuditMetas` | admin, auditoria |
| `canAccessCentral` | Todos os 11 perfis |
| `canManageCentralConfig` | admin, ti, admin. |
| `canViewAllCentralRequests` | admin, diretoria, admin., auditoria |
| `canAccessCentralReports` | admin, diretoria, ger_ops, admin. |
| `isSupervisor` | supervisor |
| `isGerenteOperacoes` | gerente_operacoes |
| `isDiretoriaOrAdmin` | admin, diretoria |

> ⚠️ **NOTA:** Estas funções são **hardcoded** e NÃO consultam a tabela `perfis_permissoes`. A matriz do banco é apenas para gestão visual.

---

## 8. FLUXOS FUNCIONAIS

> Detalhamento completo em `docs/leve_erp_fluxos_regras.md`

### 8.1 Ciclo de Vida do Sinistro ✅
```
Ocorrência no campo
  → Supervisor abre sinistro (/sinistros/novo)
    → Sistema gera PR e protocolo automaticamente
    → Verifica prazo de 48h úteis (gera inconsistência se atrasado)
    → Verifica ausência de CFTV (gera inconsistência)
    → Analista trata (/sinistros/[id])
      → Upload de documentos via Google Drive
      → Análise de inconsistências
      → Aprovação financeira (aba Financeiro)
        → Encerramento com valor final
```

### 8.2 Fluxo de Faturamento ✅
```
Agente local (PowerShell/BAT)
  → Coleta dados do sistema da operação (PRESCON/PARCO/PERSONAL)
  → POST /api/faturamento/importar-movimentos (com token)
    → UPSERT em faturamento_movimentos (deduplicação)
    → Trigger statement-level → faturamento_resumo_diario
    → Log em faturamento_importacao_logs
    → Update em operacoes (ultima_sincronizacao)
    → RPC faturamento_consolidar_dia_v2 (forçar consolidação)
```

### 8.3 Fluxo de Metas e Alertas ✅
```
Admin cria meta mensal (POST /api/metas-faturamento)
  → apurarMeta() → RPC reprocessar_metas_diarias
  → processarAlertasMeta() → Avalia desvio de ritmo
    → Se desvio > 15%: alerta de risco
    → Se criticidade ≥ média: cria tratativa automática
  → Job agendado: FaturamentoAlertEngine.processarJobGlobal()
    → Para cada operação com meta, avaliarPeriodo()
      → Executa 4 regras (DIA_ZERADO, SEQUENCIA, QUEDA, DESVIO)
      → UPSERT alertas com supressão contextual
```

### 8.4 Fluxo de Tarifários ✅
```
Supervisor/Admin cria solicitação → Status: Pendente
  → Diretoria avalia → Aprova ou Reprova
    → Se aprovado: TI executa → Em Execução
      → TI conclui → Concluído
  → Histórico operacional registrado em cada transição
```

### 8.5 Fluxo da Central de Solicitações ✅
```
Usuário abre solicitação → Status: Novo → Protocolo SOL-ANO-SEQ
  → SLA calculado pela categoria
  → Triagem → Em Atendimento → Aguardando Solicitante
    → Interações (mensagens, uploads, mudanças de status)
  → Conclusão ou Cancelamento
    → Avaliação opcional (1-5 estrelas)
```

---

## 9. INTEGRAÇÕES E SERVIÇOS EXTERNOS

### 9.1 Supabase PostgreSQL ✅
- **Função:** Banco de dados principal e autenticação de contexto
- **Clientes:** `createClient()` (anon/SSR), `createAdminClient()` (service_role), `getAuditedClient()` (service_role + contexto de audit)
- **Projeto:** `ckgqmgclopqomctgvhbq.supabase.co`

### 9.2 Google Drive API v3 ✅
- **Função:** Storage de arquivos de sinistros e tarifários
- **Lib:** `src/lib/drive.ts` → `getDriveService()`
- **OAuth2:** Refresh token permanente
- **Pontos de uso:** `sinistros/[id]/anexos/route.ts`, `tarifarios/[id]/anexos/route.ts`
- **Organização:** Pastas por protocolo (ex: `PR-2026-00001 - NOME CLIENTE`)

### 9.3 Agentes Locais de Faturamento ✅
- **Tecnologia:** Scripts PowerShell/BAT em Windows (Win7+)
- **Função:** Coletam dados de sistemas de estacionamento e enviam via API
- **Sistemas suportados:** PRESCON, PARCO, PERSONAL (Firebird), CLOUDPARK CANCELA, CLOUDPARK MOBILE, LINK, EMBRATEC, WPS, AVC, NEPOS, CARMOBI
- **Endpoint:** `POST /api/faturamento/importar-movimentos`
- **Autenticação:** Headers `x-operacao-id` + `x-integration-token`
- **Templates SQL:** Configuráveis em `faturamento_query_templates` por sistema

---

## 10. INTERFACE, UX E DESIGN SYSTEM

### 10.1 Conceito Visual ✅
- Design premium B2B corporativo
- CSS Vanilla consolidado em `globals.css` (1553 linhas)
- Fontes: **Inter** (texto geral) + **Outfit** (títulos e destaques) ✅
- Bordas arredondadas (16px-24px via `var(--radius-xl)`)
- Suporte a tema claro e escuro via `ThemeProvider` ✅

### 10.2 Componentes ✅
- **Sidebar:** Colapsável com hover-expand, seções por módulo, perfil-aware ✅
- **LayoutWrapper:** Controla Topbar + Sidebar com Flexbox ✅
- **Badges/Pills:** Sistema de `.badge` com variantes por status ✅
- **Form Grids:** `.form-grid-2` / `.form-grid-4` sem framework CSS ✅
- **Tabelas Virtualizadas:** VirtualMetasTable, VirtualTicketsTable (react-window) ✅
- **Responsivo:** Mobile-first, sidebar drawer, `.table-responsive` ✅

---

## 11. AUDITORIA E RASTREABILIDADE

### 11.1 Sistema Dual de Auditoria ✅

O Leve ERP implementa auditoria em **duas camadas independentes e complementares:**

#### Camada 1: Triggers Automáticos (Banco) ✅
- **Função:** `fn_auditoria_global_automatica()` (PL/pgSQL, SECURITY DEFINER)
- **Ativação:** Via `sp_ativar_auditoria_tabela('nome_tabela')` — procedure helper
- **Tabelas auditadas:** `usuarios`, `configuracoes_sistema`, `perfis_sistema`, `perfis_permissoes`, `sinistros`, `anexos`, `inconsistencias`, `solicitacoes_tarifario`, `tarifarios_anexos`, `operacoes`, `metas_faturamento`, `metas_faturamento_apuracoes`, `metas_faturamento_alertas`, `metas_faturamento_tratativas`
- **Dados capturados:** `usuario_id` (via `audit.current_user_id` ou `auth.uid()`), módulo, ação, dados anteriores/novos (JSONB), criticidade
- **Destino:** `auditoria_administrativa`

#### Camada 2: Logs Manuais (Aplicação) ✅
- **Funções:** `recordAuditLog()`, `withAudit()` (higher-order function)
- **Arquivo:** `src/lib/audit.ts`
- **Função `getAuditedClient(userId)`:** Cria cliente Supabase admin e injeta `audit.current_user_id` na sessão PostgreSQL via `set_config`
- **Função `withAudit(handler)`:** Wrapa API routes para logar acesso negado e erros críticos automaticamente
- **Destino:** `auditoria_administrativa`

> **LEGADO:** O módulo de sinistros mantém sua própria tabela `historico_sinistros` para timeline visual na aba Histórico. Isso é complementar, não substitui a auditoria global.

---

## 12. REGRAS DE NEGÓCIO

### Regras Gerais ✅
- `operacoes.id` é o eixo central de toda FK transacional ✅
- Toda tabela crítica tem auditoria automática via trigger ✅
- APIs com dados sensíveis usam `withAudit()` wrapper ✅

### Regras de Sinistros ✅
- SLA de 12 dias úteis (cálculo via `adicionarDiasUteis()`) ✅
- Fora do prazo se >48h úteis entre ocorrência e registro ✅
- Inconsistência automática se CFTV disponível mas sem upload ✅
- PR via sequence PostgreSQL (sem race condition) ✅
- Upload obrigatório categorizado (12 tipos de anexo) ✅

### Regras de Faturamento ✅
- Deduplicação estrita: `UNIQUE (operacao_id, ticket_id)` ✅
- Consolidação automática via trigger statement-level ✅
- Resumo diário: valores originais + ajustes = finais ✅
- Purga automática com buffer de 8 dias ✅
- Header `x-purge-today` para limpeza manual do dia ✅

### Regras de Metas ✅
- Uma meta por operação por mês/ano (UNIQUE constraint) ✅
- Constraint: meta global → `operacao_id` NULL ✅
- Alerta automático se desvio de ritmo > 15% ✅
- Tratativa automática se criticidade ≥ média ✅

### Regras de Permissão ✅
- Funções hardcoded em `permissions.ts` ✅
- Sidebar filtra itens por perfil via arrays inline ✅
- Supervisor vê apenas suas operações/sinistros/solicitações ✅
- Gerente vê apenas sua carteira de operações ✅

---

## 13. SEGURANÇA E RISCOS

### Riscos Ativos ✅

| Risco | Severidade | Status |
|--|--|--|
| AUTH_SECRET com valor placeholder em `.env.local` | 🔴 Crítico | 🔄 Verificar em produção |
| Rotas de importação fora do middleware auth | 🔴 Alto | Design intencional (token) |
| RPCs sem schema SQL local | 🔴 Alto | 🔄 Validar no banco |
| `eslint: ignore`, `typescript: ignoreBuildErrors` | 🟡 Médio | Ativo em `next.config.ts` |
| Console.log de debug em produção | 🟡 Médio | Presente em APIs de metas |
| Central usa `createClient()` ao invés de `getAuditedClient()` | 🟡 Médio | Auditoria incompleta nesse módulo |
| Permissões hardcoded desconectadas da matriz do banco | 🟡 Médio | "Double bookkeeping" |
| ~40 scripts debug/migração na raiz | 🟡 Médio | Limpeza necessária |
| `deploy-hostinger.zip` 814MB na raiz | 🟡 Médio | Risco de secrets vazados |
| Inconsistência naming `_em` vs `_at` | 🟢 Baixo | Tabelas de faturamento alertas |

### Mitigações Implementadas ✅
- RLS nos sinistros e tabelas filhas ✅
- bcryptjs para hashing de senhas ✅
- JWT HTTP-Only cookies ✅
- Service role key apenas no server-side ✅
- Audit trail duplo (triggers + app) ✅

---

## 14. DÍVIDA TÉCNICA E BACKLOG

> Detalhamento completo em `docs/leve_erp_backlog.md`

| Item | Severidade | Área |
|--|--|--|
| `sinistros/[id]/page.tsx` com 68KB (~1800 linhas) | 🔴 Crítico | Frontend |
| RPCs sem schema SQL versionado localmente | 🔴 Crítico | DevOps |
| Perfil `administrativo` possivelmente ausente do enum SQL | 🟡 Médio | Banco |
| Central de Solicitações sem `getAuditedClient()` | 🟡 Médio | Segurança |
| Permissões hardcoded vs matriz no banco | 🟡 Médio | Arquitetura |
| Console.logs de debug em APIs | 🟡 Médio | Qualidade |
| ~40 scripts de debug na raiz do projeto | 🟡 Médio | Organização |
| `globals.css` com 1553 linhas | 🟢 Baixo | Manutenibilidade |
| Naming inconsistente (`_em` vs `_at`) | 🟢 Baixo | Convenção |

---

## 15. CONFIGURAÇÕES E AMBIENTE

### Variáveis de Ambiente ✅
```env
# Next.js / Auth
NEXTAUTH_URL=                              # Domínio de deploy
NEXTAUTH_SECRET=                           # Chave JWT (TROCAR EM PRODUÇÃO!)
AUTH_SECRET=                               # Alias do NEXTAUTH_SECRET

# Supabase
NEXT_PUBLIC_SUPABASE_URL=                  # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=             # Chave anônima (public)
SUPABASE_SERVICE_ROLE_KEY=                 # Chave admin (server-only!)

# Google Drive
GOOGLE_CLIENT_ID=                          # OAuth2 Client ID
GOOGLE_CLIENT_SECRET=                      # OAuth2 Client Secret
GOOGLE_REFRESH_TOKEN=                      # Token permanente de refresh
GOOGLE_REDIRECT_URI=                       # URI de callback
GOOGLE_DRIVE_FOLDER_ID=                    # Pasta raiz no Drive

# Cron (Alertas)
CRON_SECRET=                               # Token de segurança do job
```

### Next.js Config ✅
- `output: 'standalone'` ✅
- `experimental.serverActions.bodySizeLimit: '10mb'` ✅
- `eslint: { ignoreDuringBuilds: true }` ⚠️
- `typescript: { ignoreBuildErrors: true }` ⚠️

---

## 16. GLOSSÁRIO

| Termo | Definição |
|--|--|
| **PR** | Protocolo Registrado — ID único de sinistro (formato: `PR-2026-00001`) |
| **SLA** | Prazo para conclusão (12 dias úteis para sinistros) |
| **Operação** | Local físico de estacionamento sob gestão da empresa |
| **Bandeira** | Marca do varejista contratante (GPA, Assaí, Carrefour, etc.) |
| **Agente** | Script local (PowerShell/BAT) que coleta e envia dados |
| **Resumo Diário** | Consolidação automática de faturamento por operação/dia |
| **Tratativa** | Fluxo de análise de alerta pela auditoria |
| **Apuração** | Snapshot do status de atingimento de uma meta |

---

## 17. GUIA DE CONTINUIDADE

### Documento Master Oficial
**`docs/leve_erp_documentacao_master_v3_0.md`** — Este arquivo é a fonte da verdade.

### Documentos Complementares
| Arquivo | Conteúdo |
|--|--|
| `docs/leve_erp_estrutura_dados.md` | Schema de banco detalhado |
| `docs/leve_erp_fluxos_regras.md` | Regras de negócio e fluxos |
| `docs/leve_erp_base_ia.md` | Contexto para IAs |
| `docs/leve_erp_backlog.md` | Débitos técnicos e backlog |
| `docs/leve_erp_guia_prompts.md` | Guia de prompts para IAs |

### Como Documentar Futuras Mudanças
1. Atualizar o master v3.0 com a mudança
2. Marcar itens com ✅/⚠️/🔄 conforme confiança
3. Se arquivos complementares forem afetados, atualizar também
4. Registrar no changelog no final deste documento

---

### CHANGELOG (v3.0)

| Data | Mudança | Tipo |
|--|--|--|
| 2026-03-26 | Criação do master v3.0 baseado na auditoria técnica | 🆕 Novo |
| 2026-03-26 | Documentação de 13 módulos (antes eram 2) | ➕ Adição |
| 2026-03-26 | Inventário de ~40 tabelas (antes ~6) | ➕ Adição |
| 2026-03-26 | Inventário de ~35 APIs (antes ~6) | ➕ Adição |
| 2026-03-26 | Sistema dual de auditoria (triggers + app) | ➕ Adição |
| 2026-03-26 | Fontes corrigidas: Poppins → Outfit | 🔧 Correção |
| 2026-03-26 | FAQ sobre triggers corrigido (eram abundantes) | 🔧 Correção |
| 2026-03-26 | RLS marcada como implementada (antes dizia ausente) | 🔧 Correção |
| 2026-03-26 | Módulo de faturamento totalmente documentado | ➕ Adição |
| 2026-03-26 | Fluxo de agentes locais documentado | ➕ Adição |
| 2026-03-26 | Matriz de permissões com 18 funções | ➕ Adição |
| 2026-03-26 | ThemeProvider (light/dark) documentado | ➕ Adição |
| 2026-03-26 | SWR + react-window documentados | ➕ Adição |
| 2026-03-26 | `documentacao_mestre_leve_mobilidade.md` marcado como legado | ⚠️ Obsoleto |
| 2026-03-26 | `README.md` template removido conceitualmente | ⚠️ Obsoleto |
