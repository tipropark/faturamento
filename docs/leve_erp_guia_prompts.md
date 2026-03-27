# Leve ERP — Guia de Prompts para IA

> **Versão:** 3.0 | **Gerado em:** 2026-03-26
> Este guia contém prompts otimizados para sessões de IA (Gemini, ChatGPT, Claude, etc.)

---

## 1. PROMPT DE CONTEXTO INICIAL (Usar no início de toda sessão)

```
Você está trabalhando no Leve Mobilidade ERP, um sistema corporativo Next.js 16 + React 19 + TypeScript + Supabase PostgreSQL.

REGRAS ABSOLUTAS:
- NÃO use TailwindCSS (use classes de globals.css)
- NÃO use Supabase Storage (use Google Drive para anexos)
- NÃO use React Query (use SWR para novos módulos)
- Fontes: Inter (texto) e Outfit (títulos), NÃO Poppins
- Use getAuditedClient(userId) para DB em APIs (NÃO createAdminClient)
- Use withAudit(handler) como wrapper em APIs
- Operações (operacoes.id) é o eixo central de toda FK transacional
- Suporte tema claro/escuro via CSS variables

DOCUMENTOS OBRIGATÓRIOS (ler antes de editar):
- docs/leve_erp_documentacao_master_v3_0.md (fonte da verdade)
- docs/leve_erp_base_ia.md (contexto rápido para IA)
- src/types/index.ts (entidades e enums)
- src/lib/permissions.ts (18 funções de permissão)
- src/lib/audit.ts (sistema de auditoria)
```

---

## 2. PROMPTS POR TAREFA

### Criar nova API
```
Crie uma nova API Route em src/app/api/[modulo]/route.ts seguindo o padrão do Leve ERP:
- Use withAudit() como wrapper
- Use getAuditedClient(userId) para acessar o banco
- Verifique permissão com funções de src/lib/permissions.ts
- A tabela deve ter FK com operacoes.id se for transacional
- Retorne NextResponse.json com status HTTP adequado
- Lembre: não use createAdminClient, use getAuditedClient

Arquivo de referência: src/app/api/sinistros/route.ts
```

### Criar nova página
```
Crie uma nova página em src/app/(dashboard)/[modulo]/page.tsx seguindo o padrão do Leve ERP:
- Use 'use client' (client component com SWR para data fetching)
- Importe ícones de lucide-react
- Use classes de globals.css: card, card-body, form-grid-2, form-input, badge, btn
- Filtre dados por perfil do usuário (session.user.perfil)
- Suporte tema claro e escuro (use CSS variables, NÃO cores fixas)
- Adicione entrada na Sidebar.tsx com filtro de perfis

Arquivo de referência: src/app/(dashboard)/admin/faturamento/metas/page.tsx
```

### Criar nova tabela no banco
```
Crie um evolution SQL em supabase/evolution_[nome]_v1.sql seguindo o padrão do Leve ERP:
- Colunas: id UUID PK DEFAULT uuid_generate_v4(), criado_em/atualizado_em TIMESTAMPTZ
- FK para operacoes(id) se transacional (com ON DELETE CASCADE se apropriado)
- Trigger: CREATE TRIGGER trg_[tabela]_updated BEFORE UPDATE ON [tabela] FOR EACH ROW EXECUTE FUNCTION update_atualizado_em()
- Auditoria: CALL sp_ativar_auditoria_tabela('[tabela]')
- Use snake_case para nomes de coluna
- Use _em (NÃO _at) para timestamps
```

### Editar sinistros/[id]
```
ATENÇÃO: O arquivo src/app/(dashboard)/sinistros/[id]/page.tsx tem 68KB (~1800 linhas).
Leia o arquivo COMPLETO antes de qualquer edição.

Identifique a aba/seção relevante antes de editar.
As abas são: Geral, Documentos, Inconsistências, Prevenção, Redução de Orçamentos, Tratativa, Financeiro, Histórico.

Não modifique o estado de outras abas acidentalmente.
Teste a responsividade (mobile é obrigatório).
```

### Debug de faturamento
```
O módulo de faturamento do Leve ERP tem a seguinte pipeline:

Agente Local (PowerShell) → POST /api/faturamento/importar-movimentos
  → UPSERT em faturamento_movimentos (dedup por operacao_id + ticket_id)
  → Trigger statement-level → faturamento_resumo_diario (consolidação)
  → RPC faturamento_consolidar_dia_v2 (forçar)

Tabela oficial para dashboards: faturamento_resumo_diario
Tabela de dados brutos: faturamento_movimentos
Tabela de ajustes: faturamento_ajustes (com trigger de re-consolidação)

Use SWR para data fetching. A tela de faturamento já usa useSWR.
```

### Analisar permissões
```
O sistema de permissões do Leve ERP tem 3 camadas:
1. Middleware (src/middleware.ts) - bloqueia rotas sem sessão
2. Sidebar (src/components/Sidebar.tsx) - esconde menus por perfil (arrays inline)
3. API (src/lib/permissions.ts) - 18 funções de verificação

IMPORTANTE: As funções de permissions.ts são hardcoded, NÃO consultam o banco.
A tabela perfis_permissoes é apenas para gestão visual.

Perfis: administrador, diretoria, gerente_operacoes, supervisor, analista_sinistro, financeiro, rh, dp, auditoria, ti, administrativo
```

---

## 3. PROMPTS DE DIAGNÓSTICO

### Verificar consistência de auditoria
```
Verifique se todas as APIs de escrita usam getAuditedClient:
- Procure por createAdminClient ou createClient em src/app/api/
- Todas as ocorrências devem ser substituídas por getAuditedClient(userId)
- Exceção: rotas de importação de agentes (usam token, não sessão)
```

### Verificar gaps de permissão
```
Compare a visibilidade na Sidebar.tsx com as funções de permissions.ts:
- Para cada item da sidebar, há uma função de permissão correspondente?
- Os perfis listados na sidebar são os mesmos das funções?
- Há APIs usando checagem inline ao invés das funções centralizadas?
```

---

## 4. TEMPLATE DE DOCUMENTAÇÃO DE MUDANÇAS

Ao finalizar uma sessão de desenvolvimento, use este template para registrar mudanças:

```markdown
## Mudança: [Título]
- **Data:** YYYY-MM-DD
- **Módulo:** [Nome do módulo]
- **Arquivos alterados:**
  - `caminho/arquivo.ts` — descrição da mudança
- **Tabelas afetadas:** [lista]
- **APIs afetadas:** [lista]
- **Regras de negócio novas/alteradas:** [descrição]
- **Permissões alteradas:** [lista de funções]
- **Pendências:** [lista]
- **Documento atualizado:** ✅/❌
```

---

## 5. ANTI-PATTERNS (Evitar)

| ❌ Não faça | ✅ Faça |
|--|--|
| `import { createAdminClient } from '@/lib/supabase/server'` | `import { getAuditedClient } from '@/lib/audit'` |
| `className="bg-blue-500 text-white p-4"` (Tailwind) | `className="card card-body"` (globals.css) |
| `const supabase = createClient()` em API de escrita | `const supabase = await getAuditedClient(userId)` |
| `if (perfil === 'administrador' \|\| perfil === 'ti')` inline | `if (canAccessAdmin(perfil))` via permissions.ts |
| `color: #1a1a1a` (cor fixa) | `color: var(--text-primary)` (CSS variable) |
| `font-family: 'Poppins'` | `font-family: 'Inter'` ou `font-family: 'Outfit'` |
