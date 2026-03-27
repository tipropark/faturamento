# Leve ERP — Backlog Técnico e Dívida Técnica

> **Versão:** 3.0 | **Gerado em:** 2026-03-26 | **Fonte:** Auditoria de código-fonte
> ✅ Confirmado | ⚠️ Inferência | 🔄 Precisa validação manual

---

## 1. DÍVIDA TÉCNICA CRÍTICA

### DT-001: Mega-arquivo sinistros/[id]/page.tsx 🔴
- **Tamanho:** 68KB (~1800+ linhas)
- **Problema:** Concentra renderização, estado local, modais, 8 abas, formulários, submits — tudo em um único arquivo
- **Impacto:** Alta dificuldade de manutenção, risco de regressão em qualquer edição
- **Recomendação:** Refatorar em componentes: `<TabGeral>`, `<TabDocumentos>`, `<TabInconsistencias>`, `<TabPrevencao>`, `<TabReducao>`, `<TabTratativa>`, `<TabFinanceiro>`, `<TabHistorico>`
- **Esforço:** Alto (8-16h estimado)
- **Prioridade:** 🔴 Crítica

### DT-002: RPCs sem schema SQL versionado 🔴
- **Problema:** 3 stored procedures são chamadas no código mas não possuem definição SQL no repositório local:
  - `faturamento_consolidar_dia_v2` (chamada em `importar-movimentos/route.ts`)
  - `reprocessar_metas_diarias` (chamada em `metas-utils.ts`)
  - `set_config` (chamada em `audit.ts`)
- **Impacto:** Impossível reconstruir o banco a partir dos scripts locais; risco de perda em caso de migração
- **Recomendação:** Extrair DDL das RPCs do banco de produção e versionar em `/supabase/`
- **Esforço:** Baixo (1-2h)
- **Prioridade:** 🔴 Crítica

### DT-003: AUTH_SECRET com valor placeholder 🔴
- **Valor atual em .env.local:** `leve-erp-secret-2024-mude-em-producao`
- **Impacto:** Se usado em produção, comprometimento de JWTs
- **Recomendação:** Regenerar com `openssl rand -base64 32`
- **Esforço:** Mínimo (5min)
- **Prioridade:** 🔴 Crítica
- **Status:** 🔄 Verificar no servidor de produção

---

## 2. DÍVIDA TÉCNICA MÉDIA

### DT-004: Perfil 'administrativo' possivelmente ausente do enum SQL 🟡
- **Problema:** Existe no TypeScript e `permissions.ts` mas NÃO no enum base `perfil_usuario` do `schema.sql`
- **Impacto:** Pode causar erro de INSERT se não foi adicionado via ALTER TYPE
- **Recomendação:** Executar `SELECT unnest(enum_range(NULL::perfil_usuario))` no banco
- **Esforço:** Mínimo
- **Status:** 🔄 Validação manual necessária

### DT-005: Central de Solicitações sem getAuditedClient 🟡
- **Problema:** Todas as APIs de `/api/central-solicitacoes/` usam `createClient()` (anon SSR) em vez de `getAuditedClient()`
- **Impacto:** Auditoria via triggers pode não capturar o `usuario_id` correto
- **Recomendação:** Substituir `createClient()` por `getAuditedClient(userId)` em 5 arquivos
- **Esforço:** Baixo (1h)
- **Prioridade:** 🟡 Média

### DT-006: Permissões hardcoded vs matriz no banco 🟡
- **Problema:** `permissions.ts` define permissões com arrays fixos no código. A tabela `perfis_permissoes` é ignorada no runtime. São duas "fontes de verdade" desconectadas.
- **Impacto:** Mudanças na matriz do banco não têm efeito prático; mudanças reais exigem deploy
- **Recomendação:** Ou remover a ilusão de gestão dinâmica, ou implementar consulta ao banco no middleware
- **Esforço:** Alto (8-16h para implementação dinâmica)
- **Prioridade:** 🟡 Média

### DT-007: Console.log de debug em APIs de produção 🟡
- **Problema:** `console.log('--- DEBUG API METAS ---')` e similares presentes em APIs
- **Impacto:** Vazamento de dados em logs de servidor, noise em monitoramento
- **Recomendação:** Remover console.logs ou substituir por logger estruturado
- **Esforço:** Baixo (30min)
- **Prioridade:** 🟡 Média

### DT-008: eslint/typescript ignorados no build 🟡
- **Problema:** `next.config.ts` contém `eslint: { ignoreDuringBuilds: true }` e `typescript: { ignoreBuildErrors: true }`
- **Impacto:** Bugs de tipo e lint passam despercebidos em build; regressões silenciosas
- **Recomendação:** Habilitar progressivamente, resolvendo erros por módulo
- **Esforço:** Médio-Alto (depende da quantidade de erros)
- **Prioridade:** 🟡 Média

### DT-009: APIs de usuários sem wrapper de auditoria 🟡
- **Problema:** `GET/POST /api/usuarios` não usa `withAudit()`, perdendo log automático
- **Recomendação:** Adicionar `withAudit()` wrapper
- **Esforço:** Mínimo (15min)
- **Prioridade:** 🟡 Média

### DT-010: Sidebar inconsistente com permissions.ts 🟡
- **Problema:** Sidebar usa arrays inline de perfis para visibilidade; APIs usam funções de `permissions.ts`. São mecanismos diferentes que podem divergir.
- **Impacto:** Usuário pode ver menu mas ter acesso negado na API, ou vice-versa
- **Recomendação:** Migrar sidebar para usar as mesmas funções de `permissions.ts`
- **Esforço:** Médio (2-4h)
- **Prioridade:** 🟡 Média

---

## 3. DÍVIDA TÉCNICA BAIXA

### DT-011: ~40 scripts de debug/migração na raiz do projeto 🟢
- **Problema:** Arquivos como `check_*.js`, `fix_*.js`, `inspect_*.js`, `PURGE_FATURAMENTO.ps1` acumulados na raiz
- **Impacto:** Poluição visual, risco de execução acidental
- **Recomendação:** Mover para `/scripts/` ou deletar se não mais necessários
- **Esforço:** Baixo (30min)

### DT-012: deploy-hostinger.zip (814MB) na raiz 🟢
- **Problema:** ZIP de deploy gigante, possivelmente incluindo node_modules e secrets
- **Impacto:** Risco de segurança; peso no repositório
- **Recomendação:** Adicionar ao `.gitignore`, verificar conteúdo, deletar se possível
- **Esforço:** Mínimo

### DT-013: Inconsistência de naming _em vs _at 🟢
- **Problema:** Tabelas core usam `criado_em`/`atualizado_em`, tabelas de faturamento alertas usam `criado_at`/`atualizado_at`
- **Impacto:** Confusão em queries e documentação
- **Recomendação:** Padronizar para `_em` em novas tabelas; renomear `_at` quando possível
- **Esforço:** Baixo para novas tabelas; médio para renomear existentes

### DT-014: globals.css com 1553 linhas 🟢
- **Problema:** Arquivo CSS monolítico muito grande
- **Impacto:** Dificuldade de manutenção, risco de conflitos de classe
- **Recomendação:** Considerar split por módulo ou feature (módulo de faturamento, sinistros, etc.)
- **Esforço:** Médio

### DT-015: Rota de teste /api/test-metas em produção 🟢
- **Problema:** Endpoint de teste exposto
- **Recomendação:** Remover ou proteger com flag de environment
- **Esforço:** Mínimo

### DT-016: Campos redundantes em operações 🟢
- **Problema:** Campos de automação existem em `operacoes` E em `operacoes_automacao` (migração incompleta)
- **Recomendação:** Completar migração para `operacoes_automacao` e depreciar campos antigos
- **Esforço:** Médio

### DT-017: Campo ativo vs status em usuarios 🟢
- **Problema:** Tabela `usuarios` tem `ativo` (boolean) e `status` (varchar) — possivelmente redundantes
- **Recomendação:** Consolidar em um único campo
- **Esforço:** Baixo

---

## 4. ITENS PENDENTES DE VALIDAÇÃO MANUAL 🔄

| # | Item | Validação Necessária |
|--|--|--|
| V-001 | Enum `perfil_usuario` inclui `administrativo`? | `SELECT unnest(enum_range(NULL::perfil_usuario))` |
| V-002 | Enum `perfil_usuario` inclui `ti`? | Idem |
| V-003 | RPC `faturamento_consolidar_dia_v2` existe? | `SELECT proname FROM pg_proc WHERE proname = '...'` |
| V-004 | RPC `reprocessar_metas_diarias` existe? | Idem |
| V-005 | Tabela `metas_faturamento_apuracoes_diarias` existe? | Verificar no Table Editor |
| V-006 | Migration RLS já aplicada em produção? | Testar `SELECT` com role sem permissão |
| V-007 | AUTH_SECRET em produção é o placeholder? | Verificar variáveis no servidor Hostinger |
| V-008 | deploy-hostinger.zip contém secrets? | Inspecionar conteúdo |
| V-009 | Cron de alertas está configurado? | Verificar se Vercel Cron ou GitHub Actions está ativo |

---

## 5. ROADMAP SUGERIDO

| Sprint | Ação | Impacto | Esforço |
|--|--|--|--|
| Imediato | DT-003: Trocar AUTH_SECRET | 🔴 Segurança | 5min |
| Imediato | DT-007: Remover console.logs | 🟡 Qualidade | 30min |
| Imediato | DT-015: Remover /api/test-metas | 🟢 Limpeza | 5min |
| Sprint 1 | DT-002: Versionar RPCs do banco | 🔴 DevOps | 1-2h |
| Sprint 1 | DT-005: Central com getAuditedClient | 🟡 Segurança | 1h |
| Sprint 1 | DT-009: withAudit nos usuarios | 🟡 Segurança | 15min |
| Sprint 2 | DT-001: Refatorar sinistros/[id] | 🔴 Manutenibilidade | 8-16h |
| Sprint 2 | DT-010: Unificar sidebar + permissions | 🟡 Consistência | 2-4h |
| Sprint 3 | DT-006: Permissões dinâmicas | 🟡 Arquitetura | 8-16h |
| Sprint 3 | DT-008: Habilitar lint/ts no build | 🟡 Qualidade | Variável |
| Técnico | DT-011..017: Limpeza geral | 🟢 Organização | 2-4h total |
