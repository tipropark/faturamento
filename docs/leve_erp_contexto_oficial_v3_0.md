# LEVE ERP — Contexto Oficial v3.0
> **Gerado:** 2026-03-26 | **Fonte:** Auditoria técnica completa do código-fonte
> **Uso:** Colar no início de sessões de IA como contexto do sistema

---

## 1. RESUMO EXECUTIVO

**O que é:** Sistema corporativo B2B de gestão para a empresa Leve Mobilidade (terceirização de estacionamentos para varejistas como GPA, Assaí, Carrefour).

**Stack:**
- Next.js 16.1.6 (App Router) + React 19 + TypeScript 5
- CSS Vanilla (`globals.css`, 1553 linhas) — **sem TailwindCSS**
- Supabase PostgreSQL (banco, ~40 tabelas, triggers, RPCs)
- NextAuth v5 beta (Credentials, JWT 8h, bcryptjs)
- SWR (data fetching em módulos novos) + react-window (virtualização)
- Google Drive API v3 (anexos de sinistros e tarifários) — **sem Supabase Storage**
- Fontes: **Inter** (texto) + **Outfit** (títulos) — **NÃO Poppins**
- Deploy: standalone build (Hostinger)

**Eixo central:** `operacoes.id` é a FK de toda transação. Operação = local físico de estacionamento.

**13 Módulos em produção:** Dashboard, Sinistros, Operações, Tarifários, Faturamento, Metas, Alertas, Auditoria de Metas, Central de Solicitações, Administração, Permissões, Configurações, Log de Auditoria.

---

## 2. REGRAS ESTRUTURAIS INEGOCIÁVEIS

### Dados
- Toda FK transacional referencia `operacoes.id`
- Tabelas críticas têm auditoria automática via trigger `fn_auditoria_global_automatica()`
- Ativar auditoria em tabelas novas: `CALL sp_ativar_auditoria_tabela('nome')`
- Timestamps: `criado_em`/`atualizado_em` com trigger `update_atualizado_em()`
- Naming: snake_case, sufixo `_em` (NÃO `_at`)

### APIs
```
- OBRIGATÓRIO usar withAudit(handler) como wrapper de API
- OBRIGATÓRIO usar getAuditedClient(userId) para acessar o banco (NÃO createAdminClient)
- Verificar permissão via funções de src/lib/permissions.ts
- Retornar NextResponse.json com status HTTP adequado
```

### Auth / Permissões
- Middleware `src/middleware.ts` protege todas as rotas exceto: `/login`, `/api/auth/*`, importação de faturamento
- 11 perfis: administrador, diretoria, gerente_operacoes, supervisor, analista_sinistro, financeiro, rh, dp, auditoria, ti, administrativo
- 18 funções hardcoded em `src/lib/permissions.ts` (NÃO consultam o banco)
- Sidebar filtra menus por arrays inline de perfis (separado das funções de permissão)
- Supervisor/Gerente veem apenas suas operações (filtro por ID)

### UI
- Usar classes de `globals.css`: card, form-grid-2, form-input, badge, btn, table
- Suporte obrigatório a tema claro/escuro via CSS variables (ThemeProvider)
- Mobile-first (supervisores usam pelo celular)
- NÃO usar: TailwindCSS, Bootstrap, Material UI, Chakra, cores fixas (usar var())

### Migrations
- Arquivos SQL em `/supabase/` com prefixo `evolution_*`
- Incluir: UUID PK, criado_em/atualizado_em, trigger de timestamp, ativação de auditoria
- FK para `operacoes(id)` se transacional

---

## 3. ESTADO ATUAL DOS MÓDULOS

### Sinistros ✅ COMPLETO
- **Finalidade:** Gestão de danos a veículos em estacionamentos
- **Tabelas:** sinistros, inconsistencias, anexos, historico_sinistros
- **APIs:** GET/POST /api/sinistros, GET/PATCH /api/sinistros/[id], sub-rotas: anexos (Google Drive), inconsistencias, historico, relatorios
- **Regras:** PR auto via sequence, SLA 12 dias úteis, fora-do-prazo >48h, inconsistência auto sem CFTV, RLS implementada
- **⚠️ Pendência:** `sinistros/[id]/page.tsx` tem 68KB (~1800 linhas) — urgente refatorar

### Operações ✅ COMPLETO
- **Finalidade:** Cadastro de locais físicos (eixo central)
- **Tabelas:** operacoes (30+ campos), operacoes_automacao, automacoes_catalogo
- **APIs:** GET/POST /api/operacoes, GET/PATCH /api/operacoes/[id]
- **Regras:** Token de integração UUID auto, herança de gerente via supervisor
- **⚠️ Pendência:** Migração incompleta de campos de automação (duplicados entre operacoes e operacoes_automacao)

### Faturamento ✅ COMPLETO (complexo)
- **Finalidade:** Controle de receitas de estacionamento
- **Tabelas:** faturamento_movimentos, faturamento_resumo_diario (oficial), faturamento_ajustes, faturamento_importacao_logs, faturamento_sincronizacoes, faturamento_query_templates
- **APIs:** GET /api/faturamento, POST importar-movimentos (auth por token), POST report-execucao, CRUD ajustes, GET templates, GET calendario
- **Pipeline:** Agente local (PowerShell) → API REST → UPSERT movimentos → Trigger statement-level → Resumo diário
- **Regras:** Deduplicação UNIQUE(operacao_id, ticket_id), purga 8 dias, templates SQL por sistema (PRESCON/PARCO/PERSONAL)
- **🔄 Pendência:** RPC `faturamento_consolidar_dia_v2` sem schema SQL local

### Metas de Faturamento ✅ COMPLETO
- **Finalidade:** Metas mensais por operação com apuração e alertas
- **Tabelas:** metas_faturamento, metas_faturamento_apuracoes, metas_faturamento_alertas, metas_faturamento_tratativas
- **APIs:** CRUD /api/metas-faturamento, GET alertas
- **Regras:** UNIQUE(operacao_id, ano, mes), apuração via RPC, alertas auto por desvio, tratativa auto para criticidade ≥ média
- **🔄 Pendência:** RPC `reprocessar_metas_diarias` sem schema SQL local

### Motor de Alertas ✅ COMPLETO
- **Finalidade:** Detecção de anomalias operacionais
- **Tabelas:** faturamento_regras_alerta, faturamento_alertas, faturamento_alertas_feedback, faturamento_alertas_v2_status, faturamento_operacao_calendario, faturamento_feriados
- **Engine:** `FaturamentoAlertEngine` em `src/lib/faturamento-alertas.ts`
- **4 Regras:** DIA_ZERADO (score 50), SEQUENCIA_ABAIXO_META (30), QUEDA_BRUSCA_HISTORICA (25), DESVIO_META_DIARIA (15)
- **IMPORTANTE:** Processamento via Job agendado APENAS. NÃO roda real-time na tela.

### Central de Solicitações ✅ COMPLETO
- **Finalidade:** Tickets internos multi-departamento com SLA
- **Tabelas:** 11 tabelas `central_*` (departamentos, categorias, campos_dinamicos, solicitacoes, interacoes, etc.)
- **APIs:** CRUD /api/central-solicitacoes, config, interacoes
- **Regras:** Protocolo SOL-ANO-SEQ, campos dinâmicos por depto/categoria, SLA por categoria
- **⚠️ Pendência:** Usa `createClient()` ao invés de `getAuditedClient()` — auditoria incompleta

### Tarifários ✅ COMPLETO
- **Finalidade:** Solicitações de mudança de preço/convênio
- **Tabelas:** solicitacoes_tarifario, tarifarios_anexos, tarifarios_historico
- **APIs:** CRUD /api/tarifarios, anexos (Google Drive)
- **Fluxo:** Criação → Aprovação (diretoria) → Execução (TI) → Conclusão

### Administração ✅ COMPLETO
- **Sub-módulos:** Usuários, Supervisores, Gerentes, Operações
- **⚠️ Pendência:** API /api/usuarios NÃO usa withAudit()

### Permissões ✅ COMPLETO
- **Tabelas:** perfis_permissoes, perfis_sistema, modulos_sistema
- **APIs:** GET/POST/PUT /api/permissoes
- **⚠️ Pendência:** Matriz no banco é visual-only. Runtime usa funções hardcoded.

### Configurações / Auditoria / Automações ✅ FUNCIONAIS
- Configurações: chave-valor com fallback para env vars
- Auditoria: consulta centralizada com filtros e dashboard
- Automações: catálogo (GET-only), sem UI de gestão dedicada

---

## 4. GAPS / RISCOS / PONTOS DE ATENÇÃO

### Riscos de Segurança
| Risco | Severidade |
|--|--|
| AUTH_SECRET com placeholder `leve-erp-secret-2024-mude-em-producao` | 🔴 Crítico |
| Rotas de importação fora do middleware auth (dependem de token) | 🔴 Alto |
| RPCs sem schema SQL versionado (3 funções) | 🔴 Alto |
| `eslint: ignore` + `typescript: ignoreBuildErrors` no build | 🟡 Médio |
| Console.log de debug em APIs de produção | 🟡 Médio |
| deploy-hostinger.zip (814MB) possivelmente com secrets | 🟡 Médio |

### Inconsistências Conhecidas
| Item | Detalhe |
|--|--|
| Permissões duplicadas | Sidebar usa arrays inline; APIs usam permissions.ts; banco tem perfis_permissoes — 3 fontes desconectadas |
| Central sem auditoria | Usa `createClient()` ao invés de `getAuditedClient()` |
| Naming inconsistente | Tabelas core usam `_em`, tabelas de alertas usam `_at` |
| Perfil `administrativo` | Existe no TypeScript mas possivelmente ausente do enum SQL |
| Campos duplicados | operacoes tem campos de automação E operacoes_automacao tem os mesmos |

### Validações Manuais Pendentes (Banco de Produção)
1. Enum `perfil_usuario` inclui `administrativo` e `ti`?
2. RPCs `faturamento_consolidar_dia_v2` e `reprocessar_metas_diarias` existem?
3. Tabela `metas_faturamento_apuracoes_diarias` existe?
4. Migration RLS de sinistros já aplicada?
5. AUTH_SECRET em produção é o placeholder?

### Backlog Prioritário
| # | Item | Esforço |
|--|--|--|
| 1 | Trocar AUTH_SECRET em produção | 5min |
| 2 | Versionar RPCs do banco localmente | 1-2h |
| 3 | Central: trocar createClient → getAuditedClient | 1h |
| 4 | Remover console.logs de debug | 30min |
| 5 | Refatorar sinistros/[id]/page.tsx (68KB) em sub-componentes | 8-16h |
| 6 | Unificar sidebar com permissions.ts | 2-4h |

---

## REFERÊNCIA RÁPIDA

### Arquivos-chave do código
| Arquivo | Função |
|--|--|
| `src/types/index.ts` (562 linhas) | Todas as entidades e enums TypeScript |
| `src/lib/permissions.ts` (87 linhas) | 18 funções de permissão |
| `src/lib/audit.ts` (160 linhas) | getAuditedClient, withAudit, recordAuditLog |
| `src/lib/auth.ts` (66 linhas) | NextAuth config (Credentials, JWT 8h) |
| `src/lib/faturamento-alertas.ts` (276 linhas) | Motor de alertas |
| `src/components/Sidebar.tsx` (275 linhas) | Navegação com filtro de perfil |
| `src/app/globals.css` (1553 linhas) | Design system completo |
| `src/middleware.ts` (33 linhas) | Proteção de rotas |

### Documentação completa
| Arquivo | Conteúdo |
|--|--|
| `docs/leve_erp_documentacao_master_v3_0.md` | Fonte da verdade (36KB) |
| `docs/leve_erp_estrutura_dados.md` | Schema do banco (11KB) |
| `docs/leve_erp_fluxos_regras.md` | Regras de negócio (12KB) |
| `docs/leve_erp_base_ia.md` | Contexto para IA (7KB) |
| `docs/leve_erp_backlog.md` | Backlog técnico (9KB) |
| `docs/leve_erp_guia_prompts.md` | Prompts por tarefa (6KB) |
