# Leve ERP — Contexto para Inteligência Artificial

> **Versão:** 3.0 | **Gerado em:** 2026-03-26
> Este documento serve como base de contexto para IAs (NotebookLM, Gemini, ChatGPT, etc.)

---

## IDENTIDADE DO SISTEMA

O **Leve Mobilidade ERP** é um sistema corporativo B2B de gestão para a empresa Leve Mobilidade, que atua em terceirização de estacionamentos e facility management para grandes varejistas (GPA, Assaí, Carrefour).

O sistema gerencia:
- **Sinistros** (danos a veículos em estacionamentos)
- **Operações** (locais físicos sob gestão)
- **Faturamento** (receitas de estacionamento, coletadas por agentes locais)
- **Metas e alertas** (monitoramento de performance)
- **Tarifários** (solicitações de mudança de preço/convênio)
- **Central de solicitações** (tickets internos multi-departamento)
- **Auditoria** (rastreabilidade completa de ações)

---

## REGRAS ABSOLUTAS PARA IA

### O que NÃO existe neste projeto:
- ❌ **NÃO há TailwindCSS** — toda estilização é via CSS Vanilla em `globals.css`
- ❌ **NÃO há Supabase Storage** — anexos são armazenados no Google Drive
- ❌ **NÃO há React Query/TanStack** — data fetching é via `SWR` ou `useEffect`/`fetch`
- ❌ **NÃO há Bootstrap, Material UI, Chakra, Radix**
- ❌ **NÃO há fonte Poppins** — as fontes são **Inter** (texto) e **Outfit** (títulos)
- ❌ **NÃO há backend separado** — APIs são Next.js Route Handlers

### O que EXISTE e é crítico:
- ✅ **CSS Vanilla** — `globals.css` (1553 linhas) é a base visual. Use as classes existentes.
- ✅ **SWR** — Módulos de faturamento e metas usam SWR para data fetching
- ✅ **react-window** — Tabelas pesadas usam virtualização
- ✅ **ThemeProvider** — Sistema suporta tema claro e escuro via CSS variables
- ✅ **Triggers PostgreSQL** — Auditoria e consolidação de faturamento são feitas via triggers
- ✅ **`getAuditedClient(userId)`** — Obrigatório em APIs que alteram dados (injeta userId no PostgreSQL)
- ✅ **`withAudit(handler)`** — Wrapper obrigatório para APIs que precisam de log de acesso

---

## STACK TÉCNICA

```
Frontend:  Next.js 16.1.6 + React 19.2.3 + TypeScript 5
Estilo:    CSS Vanilla (globals.css) — sem frameworks CSS
Ícones:    lucide-react 0.577.0
Gráficos:  Recharts 3.8.0
Auth:      NextAuth v5 beta (Credentials, JWT 8h)
DB:        Supabase PostgreSQL (@supabase/supabase-js 2.99.1)
Hashing:   bcryptjs 3.0.3
Fetching:  SWR 2.4.1 (módulos novos) + fetch nativo (módulos antigos)
Virtual:   react-window 2.2.7 (tabelas pesadas)
Drive:     googleapis 171.4.0 (Google Drive API v3)
Deploy:    Standalone build (next.config.ts: output: 'standalone')
```

---

## ARQUITETURA DE DADOS

### Eixo Central
- `operacoes.id` é a FK central de toda transação
- Toda query transacional deve incluir vínculo com operação

### Padrão de APIs
```typescript
// Padrão OBRIGATÓRIO para APIs que alteram dados
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, { session, userId, userPerfil }) => {
  const supabase = await getAuditedClient(userId);
  // ... lógica
});
```

### Padrão de Permissões
```typescript
import { canAccessMetas, isDiretoriaOrAdmin } from '@/lib/permissions';

// Verificar no handler:
if (!canAccessMetas(userPerfil)) {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}
```

### Padrão de UX
```jsx
// Usar classes de globals.css
<div className="card">
  <div className="card-body">
    <div className="form-grid-2">
      <div className="form-group">
        <label className="form-label">Campo</label>
        <input className="form-input" />
      </div>
    </div>
  </div>
</div>

// Badges de status
<span className="badge badge-success">Ativo</span>
<span className="badge badge-warning">Pendente</span>
<span className="badge badge-danger">Crítico</span>
```

---

## CHECKLIST PARA EDIÇÕES

### Ao criar nova API:
- [ ] Usar `withAudit()` como wrapper ✅
- [ ] Usar `getAuditedClient(userId)` para DB ✅
- [ ] Verificar permissão com função de `permissions.ts` ✅
- [ ] Ter FK com `operacoes.id` se transacional ✅

### Ao criar nova página:
- [ ] Colocar dentro de `(dashboard)/` para herdar layout ✅
- [ ] Adicionar entrada na Sidebar com filtro de perfis ✅
- [ ] Usar classes de `globals.css` (card, form-grid, badge, etc.) ✅
- [ ] Suportar tema claro e escuro (CSS variables) ✅

### Ao criar nova tabela no banco:
- [ ] Adicionar `criado_em`/`atualizado_em` com trigger ✅
- [ ] Ativar auditoria: `CALL sp_ativar_auditoria_tabela('nome_tabela')` ✅
- [ ] Se FK transacional, referenciar `operacoes.id` ✅
- [ ] Adicionar no arquivo SQL correspondente em `/supabase/` ✅

### Ao editar sinistros/[id]:
- ⚠️ **CUIDADO:** Arquivo tem 68KB (~1800 linhas). Ler completamente antes de editar.
- [ ] Mapear estado local relevante
- [ ] Verificar se a aba afetada afeta outras abas
- [ ] Testar em mobile (responsividade obrigatória)

---

## DOCUMENTOS DE REFERÊNCIA

| Documento | Conteúdo | Prioridade |
|--|--|--|
| `docs/leve_erp_documentacao_master_v3_0.md` | **FONTE MESTRA** — Visão completa | 🔴 Ler primeiro |
| `docs/leve_erp_estrutura_dados.md` | Schema, tabelas, triggers, RPCs | Para DB |
| `docs/leve_erp_fluxos_regras.md` | Regras de negócio e fluxos | Para lógica |
| `docs/leve_erp_backlog.md` | Débitos técnicos e riscos | Para planejamento |
| `docs/leve_erp_guia_prompts.md` | Prompts otimizados para IA | Para IAs |
| `src/types/index.ts` | TypeScript types e enums | Para desenvolvimento |
| `src/lib/permissions.ts` | Matriz de permissões | Para auth |
| `src/lib/audit.ts` | Sistema de auditoria | Para segurança |
| `src/app/globals.css` | Design system completo | Para UI |

---

## MÓDULOS E SUAS LOCALIZAÇÕES

| Módulo | Página | API | Tipo |
|--|--|--|--|
| Dashboard | `(dashboard)/dashboard/page.tsx` | Agrega sinistros/ops | Leitura |
| Sinistros | `(dashboard)/sinistros/` | `/api/sinistros/` | CRUD completo |
| Operações | `(dashboard)/operacoes/` | `/api/operacoes/` | CRUD completo |
| Tarifários | `(dashboard)/tarifarios/` | `/api/tarifarios/` | CRUD com fluxo |
| Faturamento | `(dashboard)/admin/faturamento/` | `/api/faturamento/` | Complexo |
| Metas | `(dashboard)/admin/faturamento/metas/` | `/api/metas-faturamento/` | CRUD + alertas |
| Auditoria Metas | `(dashboard)/admin/auditoria/metas/` | Usa metas + alertas | Tratativas |
| Central | `(dashboard)/central-solicitacoes/` | `/api/central-solicitacoes/` | CRUD + interações |
| Usuários | `(dashboard)/admin/usuarios/` | `/api/usuarios/` | CRUD |
| Permissões | `(dashboard)/admin/permissoes/` | `/api/permissoes/` | Matriz |
| Configurações | `(dashboard)/admin/configuracoes/` | `/api/configuracoes/` | Chave-valor |
| Auditoria | `(dashboard)/admin/auditoria/` | `/api/auditoria/` | Consulta |
