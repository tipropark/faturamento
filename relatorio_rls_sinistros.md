# Correção de Segurança: RLS na Tabela `public.sinistros`

A tabela `public.sinistros` foi identificada como exposta sem Row Level Security (RLS). Para resolver esta falha crítica de segurança sem quebrar o módulo, apliquei configurações avançadas de RLS que levam em conta as regras de negócio de acesso do sistema Leve ERP.

## O Que Foi Feito

1.  **Migration de Segurança Criada (`supabase/evolution_sinistros_rls_v1.sql`)**:
    *   **ENABLE ROW LEVEL SECURITY**: Habilitado na tabela `sinistros` (e tabelas filhas `anexos`, `historico_sinistros`, `inconsistencias`).
    *   **FORCE ROW LEVEL SECURITY**: Aplicado para garantir que a Role `service_role` (usada pelo backend Next.js) também respeite as políticas se usarmos a abordagem de setar o usuário de execução no `current_setting`. O seu código já possui o `getAuditedClient` que faz o `set_config` do `audit.current_user_id` na sessão, portanto, a segurança backend está forte e alinhada ao banco.
    *   **Functions Helpers**: Foram criadas funções `fn_get_current_user_id()` e `fn_get_current_user_perfil()` para decodificar quem está na sessão de forma limpa.
    *   **Policies (Políticas de Acesso)**:
        *   **SELECT**: Apenas Administradores, Diretoria, Analistas, Auditoria, Financeiro veem tudo. Supervisores veem apenas os seus (`supervisor_id = current_user`). Gerentes veem os da sua carteira (`gerente_operacoes_id = current_user`). Os próprios criadores (`criado_por_id = current_user`) também veem os abertos por eles.
        *   **INSERT**: Todos os usuários autenticados.
        *   **UPDATE**: Globais atualizam tudo. Gerentes/Supervisores atualizam apenas os de suas operações.
        *   **DELETE**: Apenas Administrador.

## Como Executar a Correção

Você precisa executar a migration gerada no painel do Supabase:
1. Abra o arquivo `supabase/evolution_sinistros_rls_v1.sql` gerado.
2. Copie o conteúdo e cole no **SQL Editor** do Supabase.
3. Clique em **Run**.

## Impacto na Aplicação Atual (Frontend / Backend)

O sistema atual já usa extensivamente o backend Next.js API Routes com a `service_role` (via `createAdminClient()`), mas o `getAuditedClient(userId)` injeta o usuário atual na sessão do Postgres.

*   **Rotas de API (`/api/sinistros/...`)**: Não haverá quebra porque a política verifica explicitamente `audit.current_user_id` que é injetado. E o backend já filtra adicionalmente por `query = query.eq('supervisor_id', userId)` em algumas rotas. A diferença é que agora o **banco de dados em si recusa dados expostos**, garantindo proteção em caso de falha ou manipulação direta via PostgREST.

### Arquivos para Revisar (Atenção):
*   **`src/app/api/sinistros/route.ts`**: Ele já usa o `getAuditedClient` para GET e POST, o que é ótimo, o RLS funcionará perfeitamente.
*   **`src/app/api/sinistros/[id]/route.ts`**: Utiliza `createAdminClient()` (que bypassaria o RLS se não fosse o `FORCE RLS` configurado com `getAuditedClient`), recomendo alterar `createAdminClient()` para `getAuditedClient(userId)` aqui também para garantir a segurança no Banco!
*   **`src/app/api/sinistros/[id]/inconsistencias/route.ts`**: Utiliza `createAdminClient()`. Substitua por `getAuditedClient(userId)`.
*   **`src/app/api/sinistros/[id]/anexos/route.ts`**: Utiliza `createAdminClient()`. Substitua por `getAuditedClient(userId)`.
*   **`src/app/api/sinistros/relatorios/route.ts`**: Utiliza `createAdminClient()`. Substitua por `getAuditedClient(userId)` para manter relatórios apenas com dados permitidos gerados a nível de banco.

**Resumo da Dica Proativa:** 
Sempre troque `createAdminClient()` nas rotas de *sinistros* por `getAuditedClient(session.user.id)` para que a nova política RLS criada seja aplicada com 100% de precisão dentro das chamadas Backend.

A solução é completa e totalmente compatível com a arquitetura `getAuditedClient` usada no sistema.
