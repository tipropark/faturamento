# Decisões Técnicas (ADR): Leve ERP (PRISM)

---

## ADR-001 — Construção de ERP interno em vez de sistema de mercado

**Status:** Adotado

**Contexto:**
A Leve Mobilidade operava com uma combinação de Airtable (para gestão de dados e workflows), planilhas Excel e processos manuais para controlar sinistros, faturamento, patrimônio e solicitações. O crescimento das operações tornou a manutenção dessa estrutura inviável: dados descentralizados, sem controle de acesso granular, sem rastreabilidade de ações e sem integração com os sistemas de pátio das unidades.

**Decisão:**
Construir um ERP interno progressivo, módulo por módulo, utilizando a equipe de TI interna como único desenvolvedor, assistida por ferramentas de IA generativa (Antigravity / Cursor / Lovable).

**Alternativas consideradas:**
- **Airtable evoluído:** Limitado para lógica de negócio complexa, sem capacidade de integração robusta com agentes Windows. Custos altos por usuário em escala.
- **Sistemas ERP de mercado (TOTVS, SAP):** Custo proibitivo de aquisição e implantação; customização difícil para o modelo de operações de estacionamento.
- **Planilhas + Power BI:** Sem rastreabilidade, sem controle de acesso por módulo, sem workflow.

**Consequências:**
- ✅ Custo de licenciamento zero; custo total baseado em infraestrutura (Supabase + Vercel).
- ✅ Adaptação rápida a necessidades específicas da Leve (ex.: integração com CloudPark, Prescon, Personal).
- ✅ Controle total sobre dados sensíveis (sinistros, CPFs, dados financeiros).
- ⚠️ Dependência de uma equipe de TI interna pequena; bus factor alto.
- ⚠️ Ausência de comunidade de suporte externa; documentação deve ser gerada internamente.

---

## ADR-002 — Next.js 16 como framework principal

**Status:** Adotado

**Contexto:**
O projeto precisava de um framework que suportasse simultaneamente renderização de UI complexa, rotas de API seguras no servidor (Backend For Frontend — BFF) e deploy simplificado. A equipe de TI tem experiência com React/JavaScript.

**Decisão:**
Next.js 16 (App Router) com React 19, TypeScript e Tailwind CSS. O App Router centraliza rotas de página e API no mesmo projeto, eliminando a necessidade de um backend Node separado.

**Evidência no código:**
```json
// package.json
"next": "16.1.6",
"react": "19.2.3"
```

**Alternativas consideradas:**
- **Remix:** Bom suporte a server-side, mas ecossistema menor e menor familiaridade da equipe.
- **Vite + Express separado:** Maior controle, mas dobra a complexidade de deploy e manutenção (dois projetos).
- **Next.js 14 (Pages Router):** App Router oferece melhor co-localização de API routes e permite RSC (React Server Components).

**Consequências:**
- ✅ API Routes no mesmo repositório — sem necessidade de backend separado.
- ✅ Deploy em Vercel sem configuração adicional.
- ✅ RSC e Suspense melhoram performance percebida sem trabalho manual.
- ⚠️ React 19 (experimental) em produção — APIs podem mudar entre minor versions.
- ⚠️ Next.js 16 (ainda em beta no momento) — potenciais breaking changes.

---

## ADR-003 — Supabase como BaaS (Backend-as-a-Service)

**Status:** Adotado

**Contexto:**
O projeto precisava de um banco de dados PostgreSQL gerenciado, autenticação, storage de arquivos e capacidade de executar lógica no banco (funções PL/pgSQL, triggers, RLS). Construir e manter uma API REST própria adicionaria complexidade operacional.

**Decisão:**
Supabase como plataforma completa: PostgreSQL gerenciado, cliente JavaScript, RPC functions, triggers, RLS e storage de arquivos.

**Evidência no código:**
```json
"@supabase/ssr": "^0.9.0",
"@supabase/supabase-js": "^2.99.1"
```

**Alternativas consideradas:**
- **Firebase (Firestore):** NoSQL — inadequado para dados relacionais complexos com JOINs (operações × sinistros × usuários × metas).
- **PlanetScale (MySQL):** Sem suporte a RLS nativo; JSON menos robusto que PostgreSQL.
- **PostgreSQL próprio + Prisma:** Maior controle, mas requer gestão de infraestrutura (servidor, backups, SSL).
- **Neon + Drizzle:** Alternativa moderna, mas sem a experiência de RLS e storage integrado.

**Consequências:**
- ✅ PostgreSQL completo com JOINs, triggers, funções PL/pgSQL, JSONB.
- ✅ RLS nativo para segurança no nível do banco.
- ✅ Storage integrado para anexos de sinistros e tarifários.
- ✅ Supabase Dashboard acelera inspeção e debug de dados.
- ⚠️ O Auth nativo do Supabase **não foi adotado** (NextAuth foi escolhido — ver ADR-007), criando necessidade de bridge manual via `audit.current_user_id`.
- ⚠️ Lock-in no ecossistema Supabase; migração para outro provider requereria reescrita de triggers e funções RPC.

---

## ADR-004 — NextAuth v5 (beta) para autenticação de usuários

**Status:** Adotado | ⚠️ Em revisão

**Contexto:**
O Supabase Auth é baseado em JWT do próprio provedor e foi projetado para acesso direto do browser ao banco. O sistema ERP da Leve é interno, sem cadastro público, com credenciais gerenciadas manualmente pelo TI (email + senha no banco próprio).

**Decisão:**
NextAuth v5 Beta (`next-auth@^5.0.0-beta.30`) com `CredentialsProvider` customizado que valida email/senha na tabela `usuarios` do próprio PostgreSQL via `bcryptjs`.

**Evidência no código:**
```typescript
// lib/auth.ts
authorize: async (credentials) => {
  const { data: user } = await supabase
    .from('usuarios').select('*').eq('email', email).single();
  const valid = await bcrypt.compare(senha, user.senha_hash);
  return { id: user.id, perfil: user.perfil, ... };
}
```

**Alternativas consideradas:**
- **Supabase Auth nativo:** Projetado para acesso browser → banco direto. Integração com NextAuth cria fricção; RLS baseada em `auth.uid()` conflita com nossa tabela `usuarios` customizada.
- **Auth0 / Clerk:** Custo por usuário ativo; complexidade adicional para um sistema interno de ~20 usuários.
- **NextAuth v4 (estável):** Compatibilidade mais fraca com App Router e RSC.

**Consequências:**
- ✅ Total controle sobre autenticação — sem dependência externa de auth provider.
- ✅ Gerenciamento de usuários direto no banco existente.
- ⚠️ NextAuth v5 ainda em beta — API pode mudar em releases futuros.
- ⚠️ `auth.uid()` do Supabase é sempre NULL quando acessado via API Routes — necessidade de `SET LOCAL` do `audit.current_user_id` para que o RLS identifique o usuário.
- ⚠️ Sem `refresh token` — sessão expira em 8h forçando re-login.

---

## ADR-005 — Desenvolvimento incremental com migrations SQL explícitas

**Status:** Adotado

**Contexto:**
O projeto começou como prova de conceito com um único módulo (Sinistros) e cresceu organicamente. Não havia um planejamento completo de schema upfront — cada módulo foi adicionado conforme a necessidade operacional.

**Decisão:**
Cada evolução do banco é representada por um arquivo SQL nomeado com versão incremental na pasta `/supabase/`. Nenhum ORM de migration automática (Prisma Migrate, Drizzle Kit) foi utilizado — as migrations são aplicadas manualmente pelo TI.

**Evidência no código:**
```
supabase/
  evolution_faturamento_v1.sql
  evolution_faturamento_v3_sync.sql
  evolution_faturamento_v5_resumo_ajustes.sql
  evolution_faturamento_v7_hybrid_architecture.sql
  evolution_faturamento_v8_personal_resumo.sql
  fix_missing_set_config.sql
  fix_senior_sync_rpc.sql
  fix_and_seed_personal.sql
```

**Consequências:**
- ✅ Cada migration é um artefato legível e auditável.
- ✅ Sem tooling adicional de ORM para aprender/manter.
- ⚠️ Sem controle programático de versão aplicada — o TI precisa rastrear manualmente quais scripts foram executados em produção.
- ⚠️ Arquivos de `fix_*` indicam retrabalho pós-deploy — ausência de environment de staging.
- ⚠️ Schema diverge facilmente entre desenvolvimento local e produção (sem `supabase db push` automatizado).

---

## ADR-006 — Agente Windows para coleta de dados locais

**Status:** Adotado

**Contexto:**
Os sistemas de gestão de pátio (CloudPark, Senior, Personal, Control-XRM) estão instalados localmente nas unidades, com bancos de dados locais (SQL Server, Firebird, MySQL). Não há APIs REST públicas nesses sistemas para consumo direto pelo ERP.

**Decisão:**
Desenvolvimento de agentes locais (scripts Python/VBScript) instalados nas máquinas das unidades, que consultam o banco local do sistema de pátio via ODBC/nativo e enviam os dados ao ERP via HTTPS.

**Alternativas consideradas:**
- **VPN + acesso direto ao banco remoto:** Risco de segurança alto (exposição de banco de dados); dependência de conectividade contínua de VPN; latência imprevisível.
- **API oficial dos fabricantes (CloudPark, Senior):** Os sistemas não oferecem APIs de integração acessíveis ao nível de detalhe necessário, ou quando oferecem, têm custo adicional de licenciamento.
- **ETL na nuvem com DB proxy:** Complexidade de manter uma VPN segura para acesso ao banco local.

**Consequências:**
- ✅ Desacoplamento total — ERP não precisa de VPN nem acesso direto às bases locais.
- ✅ Deduplicação idempotente garante resiliência a falhas de rede.
- ✅ Multi-sistema suportado via `faturamento_query_templates` (PRESCON, PARCO, Personal, Control-XRM).
- ⚠️ Sem mecanismo de auto-update — atualização do agente requer visita técnica ou acesso remoto.
- ⚠️ Sem monitoramento proativo de "agente offline" — só detectado quando dados param de chegar.
- ⚠️ Autenticação do agente via token estático por operação (`token_integracao`) — sem rotação automática.

---

## ADR-007 — RLS no Supabase como segunda camada de segurança

**Status:** Adotado parcialmente | ⚠️ Incompleto em alguns módulos

**Contexto:**
Com múltiplos perfis de usuário e dados sensíveis (sinistros com CPF, faturamento financeiro, dados de colaboradores), era necessário mais do que validação no frontend ou middleware Next.js — uma breach no middleware ou na API poderia expor dados de outras unidades.

**Decisão:**
RLS habilitado e com políticas formais nas tabelas críticas (`sinistros`, `anexos`, `historico_sinistros`, `inconsistencias`, `control_xrm_logs`). Um bridge manual via `SET LOCAL audit.current_user_id = <uuid>` é executado nas APIs para propagar o contexto do usuário NextAuth ao banco.

**Evidência no código:**
```sql
-- evolution_sinistros_rls_v1.sql
ALTER TABLE public.sinistros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinistros FORCE ROW LEVEL SECURITY;

-- fix_missing_set_config.sql
CREATE OR REPLACE FUNCTION public.set_config(...)
  RETURN pg_catalog.set_config(name, value, is_local);
```

**Alternativas consideradas:**
- **RLS exclusivo no frontend/middleware:** Insuficiente — qualquer requisição direta à API (Postman, script) bypassaria as restrições.
- **RLS exclusivo no banco:** Ideal, mas o bridge `auth.uid()` ↔ NextAuth é não-trivial e requer `SECURITY DEFINER` workarounds.
- **Apenas service_role com validação na API:** Atual abordagem para tabelas sem RLS formal — controle na camada de API apenas.

**Consequências:**
- ✅ Defesa em profundidade: mesmo acesso direto ao Supabase respeita as políticas.
- ✅ Auditoria automática funciona independentemente do middleware.
- ⚠️ **RLS incompleto:** Patrimônio, Colaboradores, Metas têm RLS habilitado mas sem políticas formais — dependem exclusivamente da camada de API.
- ⚠️ O workaround `set_config` via `SECURITY DEFINER` é um vetor de ataque se mal configurado.

---

## ADR-008 — Perfis definidos em tabela dinâmica (vs. ENUM PostgreSQL)

**Status:** Adotado (migração em andamento)

**Contexto:**
A primeira versão usava `CREATE TYPE perfil_usuario AS ENUM (...)` para definir os perfis de acesso. A adição constante de novos perfis (`ti`, `rh`, `dp`, `auditoria`) exigia `ALTER TYPE ADD VALUE` que, em PostgreSQL, é irreversível e pode criar conflitos em transações.

**Decisão:**
Migrar de ENUM para tabela `perfis_sistema` com campo `identificador TEXT UNIQUE`, mantendo o ENUM legado por compatibilidade com código existente.

**Evidência no código:**
```sql
-- evolution_governanca_v2.sql
CREATE TABLE IF NOT EXISTS perfis_sistema (
  identificador TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  perfil_base_id UUID REFERENCES perfis_sistema(id), -- herança
  ...
);
```

**Consequências:**
- ✅ Novos perfis criáveis pelo admin via UI sem migration SQL.
- ✅ Herança de perfil (`perfil_base_id`) permite criação de perfis customizados.
- ⚠️ **Estado transitório:** Código TypeScript ainda referencia o ENUM legado em muitos lugares. Migração completa não concluída.
- ⚠️ `fn_get_current_user_perfil()` ainda retorna `public.perfil_usuario` (ENUM) — incompatível com `perfis_sistema.identificador` (TEXT).

---

## ADR-009 — Arquitetura híbrida de faturamento (movimentos + resumos)

**Status:** Adotado

**Contexto:**
Diferentes sistemas de pátio exportam dados em formatos radicalmente diferentes: CloudPark e Senior exportam **ticket a ticket** (movimentos detalhados), enquanto o sistema Personal exporta apenas **totalizadores diários** (sem rastreabilidade por ticket). Forçar um único modelo para todos os sistemas era inviável.

**Decisão:**
Dois modos de integração configuráveis por operação:
1. **`movimentos_detalhados`:** Ticket a ticket — deduplicação por `(operacao_id, ticket_id)`.
2. **`personal_resumo_diario`:** Resumo agregado — UPSERT em `faturamento_resumo_importado` com trigger que sincroniza para `faturamento_resumo_diario`.

**Evidência no código:**
```sql
-- evolution_faturamento_v7_hybrid_architecture.sql
COMMENT ON COLUMN operacoes.integracao_faturamento_tipo IS
  'Tipo de integração: legado_direto ou api_agent';
```

**Consequências:**
- ✅ Suporte a 5+ sistemas de pátio distintos (CloudPark, Senior, Personal, Prescon, Parco, Control-XRM).
- ✅ Templates de query (`faturamento_query_templates`) permitem onboarding de novos sistemas sem deploy.
- ⚠️ O modo Personal **perde rastreabilidade por ticket** — só totais diários disponíveis; análise de forma de pagamento é agregada.
- ⚠️ Dashboard trata `faturamento_resumo_diario` como fonte comum, mas a origem dos dados é diferente — pode criar inconsistências se o modo de integração for trocado sem limpeza.

---

## ADR-010 — Uso de IA generativa no desenvolvimento (Antigravity/Cursor/Lovable)

**Status:** Adotado

**Contexto:**
A equipe de TI interna é pequena (1–2 pessoas) e o escopo do ERP cresce continuamente. Desenvolver todos os módulos manualmente seria inviável no tempo disponível.

**Decisão:**
Uso de Antigravity (Cursor com modelo Gemini), Lovable (para prototipagem visual), e Stitch (para design de telas) como co-pilotos de desenvolvimento. O desenvolvedor humano valida, revisa e aplica as sugestões.

**Consequências:**
- ✅ Velocidade de desenvolvimento 3-5x superior ao desenvolvimento manual.
- ✅ Documentação técnica (como este conjunto de arquivos) gerada de forma assistida.
- ⚠️ Código gerado por IA pode ter inconsistências sutis — revisão manual obrigatória.
- ⚠️ Padronização de código pode variar entre sessões de geração — necessidade de linting rigoroso.
- ⚠️ Raciocínio por trás de decisões pode não estar documentado se não solicitado explicitamente.

---

## ADR-011 — Sistema sem cadastro público (apenas TI cria usuários)

**Status:** Adotado | Intencional

**Contexto:**
O Leve ERP é um sistema **100% interno**. Nenhum cliente ou parceiro externo acessa o sistema. Permitir auto-cadastro seria um risco de segurança desnecessário.

**Decisão:**
A rota `/login` é a única rota pública. Não existe `/registro` ou `/signup`. Toda criação de conta é feita pelo TI via painel interno (`/admin/usuarios`). Senhas são definidas pelo TI e comunicadas manualmente.

**Consequências:**
- ✅ Superfície de ataque reduzida — sem vetores de auto-registro, brute force de criação de conta.
- ✅ Controle total sobre quem tem acesso ao sistema.
- ⚠️ Processo de onboarding manual — TI deve criar a conta antes que o colaborador possa acessar.
- ⚠️ Sem recuperação automática de senha — reset via painel do Supabase ou UPDATE direto no banco.

---

## ADR-012 — Tailwind CSS como framework de estilo (com design system em CSS puro)

**Status:** Adotado com ressalva

**Contexto:**
O projeto usa Tailwind CSS para utilitários de layout rápido, mas o design system principal está definido em `globals.css` com CSS Custom Properties (`--brand-primary`, `--shadow-md`, etc.) e classes utilitárias customizadas (`.btn-primary`, `.stat-card`, `.badge-success`).

**Decisão:**
Abordagem híbrida: Tailwind para spacing/grid rápido em páginas específicas; classes CSS customizadas para componentes reutilizáveis (botões, cards, badges, modais).

**Consequências:**
- ✅ `globals.css` é a fonte da verdade de design — não há dependência de purge do Tailwind para manter classes customizadas.
- ✅ Design tokens (`--brand-primary`, `--bg-card`) fazem dark/light mode funcionar com uma única mudança de classe `.dark`.
- ⚠️ Mistura de paradigmas pode confundir novos desenvolvedores — às vezes `bg-blue-500`, às vezes `.badge-primary`.
- ⚠️ Tailwind não foi configurado com `theme.extend` para usar os tokens CSS — oportunidade de unificação perdida.

---

## ADR-013 — `react-window` para virtualização de listas longas

**Status:** Adotado

**Contexto:**
Listas de tickets de faturamento podem ter 5.000–50.000 registros por mês por operação. Renderizar todos em uma tabela DOM nativa causaria travamentos no browser.

**Decisão:**
`react-window` para virtualização de linhas em `VirtualTicketsTable` e `VirtualMetasTable` — apenas as linhas visíveis no viewport são montadas no DOM.

**Consequências:**
- ✅ Performance de renderização consistente independentemente do volume de dados.
- ⚠️ Integração com CSS de tabela padrão (`.table`) é mais complexa — requer wrapper customizado.
- ⚠️ Exportação de CSV ainda requer carga completa no servidor — não virtualizada.

---

## Dívidas Técnicas Conhecidas

| ID | Dívida | Impacto | Urgência |
|---|---|---|---|
| **DT-001** | `AUTH_SECRET` fraco em produção (`leve-erp-secret-2024-mude-em-producao`) | **Crítico** — sessões podem ser forjadas | 🔴 Imediata |
| **DT-002** | Credenciais reais no `.env.local` commitadas — `CLOUDPARK_API_TOKEN`, `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY` | **Crítico** — exposição se repositório for público | 🔴 Imediata |
| **DT-003** | RLS incompleto em Patrimônio, Colaboradores, Metas | **Alta** — controle apenas na camada de API | 🟠 Alta |
| **DT-004** | Perfis ainda definidos como ENUM PostgreSQL em grande parte do código (migração para `perfis_sistema` incompleta) | **Média** — dificulta adição de novos perfis | 🟡 Média |
| **DT-005** | `token_integracao` dos agentes sem rotação automática | **Média** — se token vazar, replace é manual | 🟡 Média |
| **DT-006** | Endpoint `/api/faturamento/report-execucao` sem autenticação por token | **Baixa** — qualquer pessoa pode poluir os logs de execução | 🟢 Baixa |
| **DT-007** | Sem environment de staging — migrations aplicadas direto em produção | **Alta** — risco de `fix_*.sql` serem necessários em produção | 🟠 Alta |
| **DT-008** | NextAuth v5 beta em produção | **Média** — API instável pode quebrar em updates | 🟡 Média |
| **DT-009** | Credenciais SQL Server legado (`sql_server`, `sql_database`) em `operacoes` sem criptografia a nível de coluna | **Alta** — dados sensíveis em plaintext no banco | 🟠 Alta |
| **DT-010** | Sem política de retenção de logs (`control_xrm_logs`, `auditoria_administrativa`) | **Baixa** — crescimento indefinido pode impactar performance | 🟢 Baixa |

---

## O que foi Descartado — Aprendizados

### Integração direta via VPN ao banco dos sistemas de pátio
**Tentada:** A primeira ideia era conectar o ERP diretamente ao banco SQL Server das unidades via VPN de site-a-site.
**Descartada:** Conectividade de VPN nas unidades é inconsistente; qualquer queda de VPN derrubaria a coleta de dados. Risco de segurança alto — banco de dados diretamente exposto. A abordagem de agente local com API HTTP foi mais resiliente.

### Uso do Supabase Auth nativo com JWT próprio
**Tentada:** Configurar `auth.uid()` baseado nos usuários criados no Supabase Auth.
**Descartada:** Os usuários precisam ser criados com dados adicionais (perfil, operação vinculada, supervisor) que o Supabase Auth não suporta nativamente. A abordagem de tabela `usuarios` customizada com NextAuth foi mais simples e completamente controlada.

### ORM Prisma para migrations
**Considerado:** Usar Prisma para type-safe queries e migrations automáticas.
**Descartado:** A complexidade das funções PL/pgSQL, triggers e RLS do Supabase é difícil de representar em schema Prisma. O ganho de type-safety não compensava a perda de controle direto sobre o SQL.

### Enum PostgreSQL `perfil_usuario` como sistema definitivo de permissões
**Tentado:** Usar ENUM diretamente em policies e queries.
**Descartado:** Cada novo perfil exigia `ALTER TYPE ADD VALUE` + migration SQL + restart do schema. A tabela `perfis_sistema` é mais flexível, mas a migração está incompleta — estado transitório é o maior problema atual de governança.

### `FORCE ROW LEVEL SECURITY` em todas as tabelas
**Tentado em sinistros:** `ALTER TABLE sinistros FORCE ROW LEVEL SECURITY` (força o RLS até para `service_role`).
**Descartado como padrão global:** Requer que o bridge `audit.current_user_id` esteja sempre corretamente configurado nas todas as requisições — qualquer API Route que esqueça o `SET LOCAL` gera erros silenciosos. Adotado apenas em tabelas de dados mais sensíveis.

---

## Roadmap Técnico Sugerido

### Curto prazo (< 1 mês) — Crítico
1. **[DT-001] Rotacionar `AUTH_SECRET`** para valor criptograficamente forte em produção.
2. **[DT-002] Mover segredos para variáveis de ambiente do Vercel** e remover do `.env.local` commitado.
3. **[DT-003] Implementar RLS formal em Patrimônio e Colaboradores** — políticas SELECT/INSERT/UPDATE/DELETE baseadas em `fn_get_current_user_perfil()`.

### Médio prazo (1–3 meses) — Alta prioridade
4. **Criar ambiente de staging** — projeto Supabase separado para desenvolvimento/testes antes de aplicar migrations em produção.
5. **Completar migração de ENUM → `perfis_sistema`** — atualizar TypeScript types, API Routes e funções RLS.
6. **Sistema de notificação de alertas** — envio de WhatsApp (Evolution API) ou email quando alerta de meta é gerado com criticidade `alta` ou `critica`.
7. **Mecanismo de monitoramento de agentes** — alerta automático quando uma operação ativa não sincroniza há X horas.

### Longo prazo (3–6 meses) — Expansão
8. **Módulo TEF dedicado** — monitoramento direto de status de terminais de pagamento.
9. **Criptografia de coluna (`pgcrypto`)** para CPF, credenciais de sistema legado e dados bancários.
10. **Política de retenção de logs** — archiving automático de `auditoria_administrativa` e `control_xrm_logs` com mais de 90 dias.
11. **Upgrade NextAuth → versão estável** quando `next-auth@5.x` sair de beta.
12. **Painel de saúde de integrações** — visão unificada do status de todos os agentes ativos, com last-seen e alertas de inatividade.
