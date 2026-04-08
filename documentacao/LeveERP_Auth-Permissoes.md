# Autenticação e Permissões: Leve ERP (PRISM)

## 1. Providers de Autenticação

O Leve ERP utiliza **NextAuth.js v5 (Auth.js)** com o provider `Credentials` — sem login social, OAuth ou magic link. O sistema é estritamente interno e fechado.

### Método de Login
- **Email + Senha** (bcrypt hash, rodadas 10).
- Não há cadastro público. Usuários são criados exclusivamente pelo TI ou Administrativo via painel interno.
- Não há integração com Supabase Auth nativo — a autenticação é totalmente gerenciada pela tabela `public.usuarios` com hash `bcryptjs`.

### Fluxo de Autenticação
```
1. Usuário acessa /login
2. POST /api/auth/signin (NextAuth handler)
3. CredentialsProvider.authorize():
   a. Busca usuário por email na tabela `usuarios` via AdminClient
   b. Verifica `ativo = true` e `status != 'inativo'`
   c. Compara senha com `bcrypt.compare(senha, senha_hash)`
   d. Se válido, retorna { id, nome, email, perfil }
4. NextAuth gera JWT com { id, name, email, perfil }
5. Token armazenado como cookie httpOnly encriptado
6. Redirect para /dashboard
```

### Recuperação de Senha
> **Não há fluxo automático de reset de senha implementado.** A recuperação é feita manualmente pelo TI, que atualiza o `senha_hash` diretamente no banco via painel administrativo ou Supabase Dashboard.

---

## 2. Perfis de Acesso (Roles)

O sistema possui **11 perfis distintos** armazenados no campo `perfil` da tabela `usuarios` como ENUM PostgreSQL.

### Perfis Existentes
| Identificador | Nome Amigável | Categoria |
|---|---|---|
| `administrador` | Administrador | Sistema |
| `diretoria` | Diretoria | Estratégico |
| `gerente_operacoes` | Gerente de Operações | Operacional |
| `supervisor` | Supervisor | Operacional |
| `analista_sinistro` | Analista de Sinistro | Especializado |
| `financeiro` | Financeiro | Financeiro |
| `rh` | Recursos Humanos | RH |
| `dp` | Departamento Pessoal | RH |
| `auditoria` | Auditoria | Controle |
| `ti` | TI | Técnico |
| `administrativo` | Administrativo | Administrativo |

### Matriz de Permissões por Módulo

| Módulo | administrador | diretoria | gerente_operacoes | supervisor | analista_sinistro | financeiro | ti | rh/dp | auditoria | administrativo |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sinistros — Ver** | ✅ | ✅ | 👁️* | 👁️* | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Sinistros — Analisar** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sinistros — Aprovar Pgto** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tarifários — Ver** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Tarifários — Aprovar** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tarifários — Executar** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Operações — Ver** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Metas — Ver** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Metas — Gerenciar** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Patrimônio — Ver** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Patrimônio — Gerenciar** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Patrimônio — Transferir** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Colaboradores — Ver** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Colaboradores — Gerenciar** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Central Solicitações — Abrir** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Central — Config/Admin** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Gestão de Usuários** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Auditoria / Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Tecnologia & IA / Configs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Logs Control-XRM** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Permissões** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

> `*` = Acesso filtrado por escopo: gerentes veem apenas suas operações, supervisores veem apenas suas unidades.

**Legenda:** ✅ Acesso total · 👁️ Somente leitura · ⚙️ Acesso parcial/condicional · ❌ Sem acesso

---

## 3. Como os Roles são Implementados

### Armazenamento
O perfil é armazenado diretamente na tabela `public.usuarios`, coluna `perfil` do tipo ENUM `perfil_usuario`. **Não utiliza Supabase Auth metadata** — é um campo próprio da tabela de usuários do ERP.

```sql
CREATE TYPE perfil_usuario AS ENUM (
  'administrador', 'diretoria', 'gerente_operacoes', 'supervisor',
  'analista_sinistro', 'financeiro', 'rh', 'dp', 'auditoria', 'ti', 'administrativo'
);
```

### Verificação no Frontend (JWT → Session)
No momento do login, o `perfil` é lido do banco e injetado no JWT:

```typescript
// lib/auth.ts
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.perfil = user.perfil; // ← injetado no token
  }
  return token;
},
async session({ session, token }) {
  session.user.id = token.id;
  (session.user as any).perfil = token.perfil; // ← acessível via useSession()
  return session;
}
```

Nos componentes e pages, o perfil é acessado via:
```typescript
const session = await auth(); // Server Component
const perfil = (session.user as any).perfil as Perfil;
```

### Verificação na Camada de API (BFF)
Toda API Route verifica o perfil antes de executar operações sensíveis:
```typescript
// Exemplo real de /api/usuarios POST
const perfil = (session.user as any).perfil;
if (!['administrador', 'administrativo'].includes(perfil)) {
  return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
}
```

As funções centralizadas ficam em `src/lib/permissions.ts`:
```typescript
export function canAccessPatrimonio(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'gerente_operacoes',
          'supervisor', 'financeiro', 'auditoria', 'ti', 'administrativo'].includes(perfil);
}
```

### Verificação no Banco (RLS)
O perfil é verificado via a função `fn_get_current_user_perfil()` que lê o contexto da sessão:

```sql
-- Lê o ID do usuário do contexto NextAuth ou Supabase Auth nativo
CREATE OR REPLACE FUNCTION public.fn_get_current_user_perfil()
RETURNS public.perfil_usuario AS $$
DECLARE v_perfil public.perfil_usuario;
BEGIN
  SELECT perfil INTO v_perfil FROM public.usuarios
  WHERE id = public.fn_get_current_user_id();
  RETURN v_perfil;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

O contexto do usuário é injetado via `SET LOCAL audit.current_user_id = '<uuid>'` antes de cada operação crítica no banco.

### Fluxo de Atribuição de Role a Novo Usuário
```
TI/Administrativo → /admin/usuarios → "Novo Usuário"
  → POST /api/usuarios
    → Verifica perfil da sessão (deve ser 'administrador' ou 'administrativo')
    → bcrypt.hash(senha, 10)
    → INSERT INTO usuarios (nome, email, senha_hash, perfil, ...)
    → Usuário criado com status='ativo', ativo=true
```

---

## 4. Rotas e Proteção

### Arquitetura de Proteção em Camadas

```
Camada 1: middleware.ts (Edge)
  ↓ Bloqueia sessões inválidas → redireciona /login
Camada 2: (dashboard)/layout.tsx (Server Component)
  ↓ Segunda verificação de sessão → redireciona /login
Camada 3: Page Server Component ou API Route
  ↓ Verificação de perfil específico → 403 Forbidden
Camada 4: RLS no PostgreSQL (banco)
  ↓ Última linha de defesa por registro
```

### Rotas Públicas (sem autenticação)
| Rota | Propósito |
|---|---|
| `/login` | Página de login |
| `/api/auth/*` | Handlers do NextAuth |
| `/api/integracoes/cloudpark/*` | Webhook do Agente Windows (token próprio) |
| `/api/faturamento/importar-movimentos` | Endpoint legado do agente |
| `/api/faturamento/importar-resumo-personal` | Importação de dados Personal |
| `/api/faturamento/report-execucao` | Relatório de execução do script ETL |
| `/api/control-xrm/*` | Endpoints da integração Control-XRM |
| `*/agente-config` | Configuração de agente local |

### Rotas Protegidas e Perfis com Acesso
| Rota | Perfis com Acesso |
|---|---|
| `/dashboard` | Todos autenticados |
| `/sinistros/*` | `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `analista_sinistro`, `financeiro`, `auditoria` |
| `/tarifarios/*` | `administrador`, `diretoria`, `supervisor`, `ti` |
| `/operacoes/*` | `administrador`, `diretoria`, `gerente_operacoes`, `supervisor` |
| `/central-solicitacoes/*` | Todos autenticados |
| `/admin/usuarios` | `administrador`, `administrativo` |
| `/admin/patrimonio/*` | `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `financeiro`, `auditoria`, `ti`, `administrativo` |
| `/admin/colaboradores/*` | `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `rh`, `dp`, `auditoria`, `administrativo` |
| `/admin/auditoria` | `administrador`, `diretoria`, `auditoria`, `ti` |
| `/admin/tecnologia-ia/*` | `administrador`, `diretoria`, `ti`, `administrativo` |
| `/admin/faturamento/*` | `administrador`, `diretoria`, `financeiro`, `auditoria` |
| `/admin/permissoes` | `administrador`, `ti` |
| `/admin/configuracoes` | `administrador`, `ti` |

### Comportamento em Acesso Negado
- **Sem sessão (não logado):** `middleware.ts` redireciona para `/login` com `307 Temporary Redirect`.
- **Sessão inválida no layout:** `(dashboard)/layout.tsx` chama `redirect('/login')` do Next.js.
- **Perfil insuficiente na API Route:** Retorna `{ error: 'Sem permissão' }` com status `403 Forbidden`.
- **Tentativa de acesso negado é registrada** em `auditoria_administrativa` via `withAudit()` wrapper com `criticidade: 'alta'`.

---

## 5. Gestão de Usuários

### Criação de Novo Usuário
Apenas perfis `administrador` ou `administrativo` podem criar usuários. O fluxo é:

1. Acessar `/admin/usuarios` → botão "Novo Usuário"
2. Preencher: nome, email, senha temporária, perfil, telefone (opcional), gerente vinculado (opcional)
3. `POST /api/usuarios`
4. API aplica `bcrypt.hash(senha, 10)` e cria o registro com `status: 'ativo'`, `ativo: true`
5. **O usuário deve trocar a senha no primeiro acesso** (fluxo de força de troca não está implementado automaticamente — depende de comunicação manual)

### Atualização de Perfil (Role)
Feita via interface `/admin/usuarios` por `administrador` ou `administrativo`:
- `PATCH /api/usuarios/[id]` — atualiza `perfil`, `status`, `gerente_operacoes_id` etc.
- A nova role é refletida imediatamente no próximo login (o JWT existente usa a role antiga até expirar em 8h).

### Revogação de Acesso
Dois mecanismos disponíveis:
1. **Desativação:**`ativo = false` — o `authorize()` rejeita login com `if (!usuario.ativo) return null`.
2. **Inativação:** `status = 'inativo'` — bloqueado pelo mesmo guard: `if (usuario.status === 'inativo') return null`.
3. **Sessões ativas:** Não há invalidação de JWT em tempo real. Sessões existentes permanecem válidas até o `maxAge` de 8h. Para revogação imediata, alterar `AUTH_SECRET` invalida todos os tokens simultaneamente.

---

## 6. Sessão e Segurança

### Configuração da Sessão
| Parâmetro | Valor | Arquivo |
|---|---|---|
| Estratégia | `jwt` (stateless) | `lib/auth.ts` |
| Duração (`maxAge`) | **8 horas** | `lib/auth.ts` |
| Armazenamento | Cookie httpOnly encriptado (`AUTH_SECRET`) | NextAuth |
| Renovação automática | Sim (sliding window nativa do NextAuth) | — |

### Clientes Supabase
O sistema utiliza **dois clientes distintos**:

| Cliente | Chave | Uso |
|---|---|---|
| `createClient()` | `SUPABASE_ANON_KEY` | Leitura pública com RLS ativo (raro) |
| `createAdminClient()` | `SUPABASE_SERVICE_ROLE_KEY` | Operações privilegiadas em API Routes (bypassa RLS — segurança garantida pela lógica de aplicação) |

> **Atenção:** Como o `createAdminClient()` bypassa o RLS, toda API Route que o utiliza **deve obrigatoriamente** verificar o perfil via `auth()` antes de executar qualquer operação.

### Pontos de Atenção de Segurança

> [!WARNING]
> **Renovação de Role:** O perfil é lido do banco apenas no login. Se o perfil de um usuário for alterado enquanto ele está logado, a mudança só será aplicada após o JWT expirar (máximo 8h). Para ambientes críticos, considerar invalidação de tokens via rotação do `AUTH_SECRET`.

> [!CAUTION]
> **`SUPABASE_SERVICE_ROLE_KEY` no servidor:** Esta chave bypassa todas as políticas RLS. Ela nunca deve ser exposta no cliente (browser). Está corretamente isolada em `createAdminClient()`, chamado apenas em API Routes (`/api/*`) e Server Components.

> [!WARNING]
> **Sem force MFA:** O sistema não implementa autenticação de múltiplos fatores. Recomendado para perfis `administrador` e `diretoria`.

> [!NOTE]
> **Auditoria de Acessos Negados:** O wrapper `withAudit()` registra automaticamente tentativas de acesso negado (`403`) em `auditoria_administrativa` com `criticidade: 'alta'`, incluindo IP e User-Agent do solicitante.

> [!NOTE]
> **Rotas do Agente Windows:** Os endpoints `/api/integracoes/cloudpark/*` são exceções de autenticação de sessions — eles usam um `Bearer Token` fixo (`CLOUDPARK_API_TOKEN`) validado manualmente na API Route, sem relação com o sistema de perfis de usuário.
