# 📘 Documentação Mestre Oficial - Leve Mobilidade ERP

Bem-vindo(a) à documentação mestre e oficial do sistema **Leve Mobilidade ERP**.
Este documento foi gerado a partir de uma varredura completa da arquitetura do sistema e serve como a **base fundamental e fonte da verdade** para IAs (especialmente NotebookLM), novos desenvolvedores e futuros squads de manutenção.

> ⚠️ As informações listadas aqui representam o estado extraído e validado do repositório no momento da geração. Inferências ou pontos fracos foram marcados como [Ponto de Atenção] ou [Necessita Validação].

---
## 📑 Índice
1. [Visão Geral do Sistema](#1-viso-geral-do-sistema)
2. [Resumo Executivo da Arquitetura](#2-resumo-executivo-da-arquitetura)
3. [Mapa Completo do Sistema](#3-mapa-completo-do-sistema)
4. [Estrutura de Navegação e Rotas](#4-estrutura-de-navegao-e-rotas)
5. [Módulos do Sistema](#5-mdulos-do-sistema)
6. [Entidades, Modelos e Dados](#6-entidades-modelos-e-dados)
7. [Banco de Dados e Relacionamentos](#7-banco-de-dados-e-relacionamentos)
8. [Autenticação, Autorização e Perfis](#8-autenticao-autorizao-e-perfis)
9. [Fluxos Funcionais e Jornadas de Uso](#9-fluxos-funcionais-e-jornadas-de-uso)
10. [Interface, UX e Comportamento Responsivo](#10-interface-ux-e-comportamento-responsivo)
11. [Componentes, Padrões e Reuso](#11-componentes-padres-e-reuso)
12. [Integrações e Serviços Externos](#12-integraes-e-servios-externos)
13. [Configurações Técnicas e Ambiente](#13-configuraes-tcnicas-e-ambiente)
14. [Estrutura de Código e Organização do Projeto](#14-estrutura-de-cdigo-e-organizao-do-projeto)
15. [Regras de Negócio](#15-regras-de-negcio)
16. [Uploads, Arquivos e Documentos](#16-uploads-arquivos-e-documentos)
17. [Logs, Auditoria e Rastreabilidade](#17-logs-auditoria-e-rastreabilidade)
18. [Segurança e Riscos](#18-segurana-e-riscos)
19. [Dívida Técnica, Gargalos e Pontos de Atenção](#19-dvida-tcnica-gargalos-e-pontos-de-ateno)
20. [Roadmap Sugerido](#20-roadmap-sugerido)
21. [Glossário do Sistema](#21-glossrio-do-sistema)
22. [Resumo para IA / NotebookLM](#22-resumo-para-ia--notebooklm)
23. [FAQ Técnico do Projeto](#23-faq-tcnico-do-projeto)
24. [Anexos e Artefatos Úteis](#24-anexos-e-artefatos-teis)

---

## 1. VISÃO GERAL DO SISTEMA
- **Nome do Sistema:** Leve Mobilidade ERP Corporativo
- **Propósito Principal:** Gestão centralizada de ocorrências (sinistros) e operações de mobilidade/terceirização em diferentes locais físicos (supermercados, shoppings, hospitais, estacionamentos).
- **Problema que Resolve:** Elimina o uso de planilhas dispersas para controle de danos causados em estacionamentos e dependências, centralizando o workflow de abertura de chamado, análise, documentação financeira e acompanhamento (SLA).
- **Tipo de Aplicação:** Web Application / Single Page Application App-like / Painel B2B Admin.
- **Público-Alvo:** Equipes internas da empresa. Supervisores locais, analistas de sinistro, gerentes de operações, base administrativa e diretoria.
- **Contexto de Negócio:** A empresa atende grandes varejistas ("Bandeiras" como GPA, Assaí, Carrefour). Quando ocorre um incidente em uma localidade controlada (ex: batida em estacionamento, carrinho riscando carro), um sinistro precisa ser rapidamente aberto, mitigado, negociado e pago se procedente, a fim de evitar desgaste para o cliente final e para a Bandeira/Contratante.
- **Escopo Atual:** Fortemente centrado no **Módulo de Sinistros** e **Módulo de Operações (Cadastros estruturais)** e painel administrativo para usuários.

---

## 2. RESUMO EXECUTIVO DA ARQUITETURA
- **Frontend / Framework:** Next.js 16 (App Router) + React 19.
- **Linguagem / Tipagem:** TypeScript em 100% da base moderna.
- **Estilização:** CSS Vanilla (`globals.css`) robusto e consolidado em um Design System "Premium/Corporativo".
- **Backend (API):** Next.js Route Handlers (`src/app/api/...`).
- **Banco de Dados:** PostgreSQL hospedado pela plataforma Supabase.
- **Autenticação:** NextAuth.js v5 atrelado ao banco PostgreSQL customizado e usando senhas *hashed* com `bcryptjs`. As sessões são persistidas via JWT.
- **Storage de Arquivo (Arquitetura Híbrida):** Utiliza Google Drive API extensivamente para upload e armazenamento (documentos de sinistro, evidências), gravando no banco relacional apenas as URLs públicas e IDs do Drive. As APIs do Supabase (Service Role) foram injetadas nos `Route Handlers`.
- **Comunicação:** Chamadas REST via `fetch` a partir de `useEffect`/`useCallback` nos Client Components para as APIs Node.js/Next.js, as quais conversam de forma segura (Server-bound) com o Supabase Admin Client.
- **Modelo de Navegação:** Client components interativos simulando SPA, protegido por um layout root que envolve o app em painéis com Sidebar (Navegação lateral) e Topbar.

---

## 3. MAPA COMPLETO DO SISTEMA
### 3.1. Telas Principais Identificadas:
1. **Login:** (`/login`) — Tela corporativa e responsiva para e-mail/senha. (*Pública*)
2. **Dashboard:** (`/dashboard`) — Visão geral e indicadores. (*Autenticada*)
3. **Módulo Sinistros (Lista):** (`/sinistros`) — Tabela interativa com busca, filtros de status, operação e indicativos visuais de SLA. (*Autenticada*)
4. **Módulo Sinistros (Novo):** (`/sinistros/novo`) — Formulário de abertura por Supervisores locais. (*Autenticada*)
5. **Módulo Sinistros (Detalhe):** (`/sinistros/[id]`) — **O Coração do App**. Uma Mega-tela estruturada com abas internas dinâmicas: Geral, Documentos, Inconsistências, Prevenção, Redução de Orçamentos, Tratativa, Financeiro e Histórico. (*Autenticada*)
6. **Módulo Operações:** (`/operacoes`) — Gestão dos locais supervisionados. (*Autenticada, Restrita*)
7. **Admin - Usuários:** (`/admin/usuarios`) — Gestão de acessos. (*Autenticada, Restrita*)
8. **Admin - Supervisores/Gerentes/Operacoes:** (`/admin/...`) — Rotas CRUD de hierarquia administrativa. (*Autenticada, Restrita*)

---

## 4. ESTRUTURA DE NAVEGAÇÃO E ROTAS
### 4.1. Rotas Públicas
- `/login` : Formulário de acesso.

### 4.2. Rotas Autenticadas (Requerem login válido / Painel `(dashboard)`)
| Rota | Nome da Tela | Descrição | Permissão/Perfil |
|------|--------------|-----------|------------------|
| `/dashboard` | Dashboard Geral | Tela de aterrissagem | Todos Autenticados |
| `/sinistros` | Controle de Sinistros | Tabela de Sinistros Gerais | Todos Autenticados (filtro RLS Lógico) |
| `/sinistros/novo` | Abertura de Sinistro | Formulário longo de 4 etapas para cadastro | Supervisores, Gerentes, Admins |
| `/sinistros/[id]` | Tratativa de Sinistro | Mega-Painel de Tratativa com 8 abas | Apenas envolvidos/Gestão |
| `/operacoes` | Lista de Operações | Painel de controle de locais | "Administrador", "Diretoria", "Gerente" |
| `/admin/usuarios` | Controle de Acessos | CRUD completo de Usuários | "Administrador", "Diretoria", "RH" |
| `/admin/supervisores`| Controle Hierárquico | Painel de vínculos de Supervisores | "Admin", "Diretoria", "Gerente" |

### 4.3. API Routes (Backend Next.js - `src/app/api/...`)
- `/api/auth/[...nextauth]` — Handler nativo NextAuth.
- `/api/sinistros` (GET, POST) — Busca filtrada e criação de PRs.
- `/api/sinistros/[id]` (GET, PUT) — Atualização pontual do sinistro.
- `/api/sinistros/[id]/anexos` (POST) — **Integração Google Drive**. Criação dinâmica de pastas e manipulação de stream multipart/form-data.
- `/api/operacoes` (GET) — População de selects.
- `/api/usuarios` — Utilizado para carregar selects de analistas e hierarquia.

---

## 5. MÓDULOS DO SISTEMA

### Módulo Principal: Gestor de Sinistros (`/sinistros`)
- **Objetivo:** Registrar, tramitar, aprovar/reprovar e fechar contabilmente passivos de clientes em dependências sob gestão da contratante.
- **Telas Vinculadas:** Listagem, Criação (Wizard Form) e Tela de Detalhes (`[id]`).
- **Recursos Principais (Abas do Detalhe):**
  - **Geral:** Dados vitais, Cliente (Nome, CPF), Veículo (Placa, Modelo), Data de Emissão *vs* Data de Ocorrência, e Status (SLA).
  - **Documentos:** Envio atrelado a 12 sub-categorias (Ticket, Orçamento, CNH, BO, etc). Gerencia uploads híbridos e lista arquivos diretamente usando `webViewLink` (Google Drive).
  - **Tratativa:** Onde o Analista interno imputa o SLA e marca horas investidas na análise com "Observações Internas".
  - **Financeiro:** Campo crucial de Aprovação de pagamento, controle de saving "Redução de orçamento" (Evita fraude) e valor final pago.
  - **Prevenção / Aprendizado:** Input sobre falhas recorrentes em garagens ou processos.
  - **Inconsistências:** Usado para reprovar apenas partes do fluxo sem matar o sinistro. (Ex: "Foto da placa ilegível").
  - **Histórico:** Mapeamento em trilha de toda auditoria humana feita no objeto.
- **Riscos / Dívida Atual Módulo:** O arquivo `[id]/page.tsx` possui cerca de **1200+ linhas**. Isso concentra uma alta curva de renderização e estado local para 8 diferentes modais e painéis tabulares.

### Módulo: Admin & Operações
- **Objetivo:** Montar a árvore de responsabilidades da empresa: um **Gerente** governa **Supervisores**, que governam **Operações** físicas (Mapeadas por UF e Bandeira), que acumulam **Sinistros**.

---

## 6. ENTIDADES, MODELOS E DADOS
Todas encontram-se rigorosamente tipadas em `src/types/index.ts`.
- **`Usuario`**:
  - `perfil` ENUM: `administrador, diretoria, gerente_operacoes, supervisor, analista_sinistro, financeiro, rh, dp, auditoria, administrativo`.
  - Associado a uma hierarquia (Ex: supervisor referenciando `gerente_operacoes_id`).
- **`Operacao`**: Base física da garagem/terreno.
  - Campos: Nome da operação, Codigo da operação, Bandeira (GPA, Assaí), tipo de operação, possui CFTV, endereço, município, UF, e vagas totais.
- **`Sinistro`**: A entidade central (The King).
  - Controle de índice e rastreio usando `PR` (Protocolo Registrado - `PR-2026-00001`).
  - `status`: Aberto, Em Análise, Aguardando Documentos, Aprovado, Reprovado, Encerrado.
  - `categoria_sinistro`: Avaria, furto, colisao, estrutural. 
  - Centraliza como dados aninhados (denormalizados na tabela master): Placa, Modelo, Danos, Observações, CPF e Telefone do reclamante.
  - **SLA:** `data_limite_sla` é populada ativamente.
- **`Anexo`**: Referencia links do Google drive associados ao sinistro a partir de uma `CategoriaAnexo`.
- **`Inconsistencia`**: Status particular pontuado para um erro humano do cliente ou supervisor no preenchimento de documentos durante a validação da base.
- **`HistoricoSinistro`**: Auditoria 1:N com *Sinistro*.

---

## 7. BANCO DE DADOS E RELACIONAMENTOS
O backend é 100% suportado por um PostgreSQL (Supabase).
- Arquivos mestres: `supabase/schema.sql` e subsequentes migrations evolucionárias (`supabase/evolution_sinistros_v4.sql`).
- **Engenharia de Destaque:** A geração do `PR` não ocorre sujeita a "race conditions" no backend Node. O Postgres usa nativamente uma sequence segura `sinistro_pr_seq` para assegurar P.R único sequencial no formato Ano-Sufixo (`DEFAULT ('PR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(...)`).
- **Relacionamentos Físicos:**
  - `sinistro.operacao_id` → `operacoes.id`.
  - `anexos.sinistro_id` → `sinistros.id` (Possui ON DELETE CASCADE explícito suportando integridade).
- **Triggers**: Possui funções PL/pgSQL nativas para preencher a coluna `atualizado_em` (`update_atualizado_em()`).
- [Necessita Validação]: O arquivo SQL local não declara as RLS (Row Level Security policies). Supõs-se que ou a proteção esteja apenas no escopo de backend Node ou as policies são gerenciadas externamente no portal Supabase.

---

## 8. AUTENTICAÇÃO, AUTORIZAÇÃO E PERFIS
- Autenticação gerida pelo framework NextAuth (`auth.js v5`) usando a engine de *CredentialsProvider*.
- **Como funciona o Login:** As senhas enviadas do Client entram no arquivo `src/lib/auth.ts`, são pareadas em hash seguro pela biblioteca `bcryptjs` confrontando o que foi gravado pelo admin em `senha_hash`.
- **Sessões JWT:** O token tem duração de 8 horas e salva em Payload limpo: `id, name, email, perfil`. Estando blindado via Cookies HTTP-Only.
- **Acesso Visual:** O React injeta o Payload dentro dos helper-methods (`src/lib/permissions.ts`) verificando booleans de tela. Ex: `canAccessAdmin(perfil)`, `isDiretoriaOrAdmin(perfil)`. Botões como "Editar", "Aprovar Pagamento", ou items na `Sidebar` somem ativamente dependendo do Perfil.

---

## 9. FLUXOS FUNCIONAIS E JORNADAS DE USO

### Principais Jornadas: O Fluxo de Vida do Sinistro
1. **Ocorrência Inicial:** O Atendimento relata dano num veículo de estacionamento do supermercado.
2. **Supervisor Abertura (`/sinistros/novo`):** O funcionário In loco loga (Pelo celular), busca Operação "Assaí Ipiranga", digita dados do dono, tira foto da placa/CNH. Cria protocolo, dispara gravação SQL.
3. **Analista / Backoffice Age (`/sinistros`):** Visualiza novas linhas como "Aberto" apontando nível de Urgência no Painel Administrativo Desk. Se a foto sumiu, cria Inconsistência na Aba Lateral. E marca a tratativa como `Em Análise` preenchendo *Data Início Análise*.
4. **Anexação Drive:** O backoffice ou a base sobem orçamentos. O painel processa multipart form local, mas streamiza buffers para o Google APIs enviando arquivos puros à pasta `PR-XXXX - NOME CLIENTE` no Drive da gerência e extraindo a WebViewLink pública.
5. **Aprovação / Pagamento:** Baseado na evidência e apuração interna, financeiro edita a aba Financeira com saving (Orçamento R$2.000, Fechado R$1.500), aprova e o Status pula globalmente para **Encerrado**.

---

## 10. INTERFACE, UX E COMPORTAMENTO RESPONSIVO
- **Conceito "Premium B2B Restyling":** Toda a casca visual da aplicação obedece um manual orgânico (`globals.css`) que sofreu refatoração recente e drástica em março/26 focado em diminuir o tamanho (densidade e height) para focar na quantidade de campos em tela sem perder a formatação limpa.
- **Mobile First App-Like:** Para quem usa de rua (supervisores gerando cadastros no carro do cliente). O menu Lateral (`Sidebar`) converte em side-drawer perfeitamente responsivo graças à variável `.sidebar-overlay`, sem overflow lateral nas tabelas de dados que rodam via `.table-responsive`.
- As bordas, cards brancos e bottons carregam variações de raios refinadas na casa dos 16px aos 24px (`var(--radius-xl)`). Fontes corporativas estritas `Inter & Poppins`. 

---

## 11. COMPONENTES, PADRÕES E REUSO
**Observação Estrutural Importante:**
O projeto não faz uso de bibliotecas de U.I complexas ativas (Material, Chakra, Radix, TailwindCSS).
A modelagem estética baseia-se maciçamente no uso dos estilos semânticos do `globals.css`. Destaques para Reuso:
- **`LayoutWrapper`**: O esqueleto da casca, controla a topbar e barra lateral unificados em todas as views usando Flexbox.
- **Pills e Labels:** Uso padronizado de `<span className="badge badge-primary">` ou `.not-filled` para states nulos, gerando harmonia global em listas.
- **Grids de Formulário:** Baseado na classe `.form-grid-2`/`.form-grid-4`. Sem uso desnecessário de marcação col-md do bootstrap.

---

## 12. INTEGRAÇÕES E SERVIÇOS EXTERNOS
- **Supabase PostgreSQL Banco C/ Service Role**: Conexão primária B2B via cliente server-side injetando explicitamente a chave admin (`NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`) evitando expor RLS bypass nos formulários diretos e controlando payload no Node.
- **Google Drive APIs v3 (`googleapis`)**: 
  - Subpasta Mestra mapeada no `.env` via `GOOGLE_DRIVE_FOLDER_ID`.
  - Processo: Recebe tokens OAUTH renováveis refresh (`lib/drive.ts`). Na rota `anexos/route.ts` verifica a existência da pasta "PR-XYZ". Se não existe, cria a pasta de cliente, gera `multipart/upload` para ela e puxa o JSON ID e Link web da mídia que foi persistida permanentemente de graça no cloud da empresa para auditorias processuais fora do sistema se um dia precisarem.

---

## 13. CONFIGURAÇÕES TÉCNICAS E AMBIENTE
Lista de **Variáveis Críticas Inferidas**:
```bash
NEXTAUTH_URL= # (Domínio de Deploy)
NEXTAUTH_SECRET= # (Chave hash JWT)
NEXT_PUBLIC_SUPABASE_URL= # (URL Cloud Postgres)
NEXT_PUBLIC_SUPABASE_ANON_KEY= # (URL Public)
SUPABASE_SERVICE_ROLE_KEY= # (Chave Admin Node para Route Handlers)
GOOGLE_CLIENT_ID= # (OAuth Drive)
GOOGLE_CLIENT_SECRET= # (OAuth Drive)
GOOGLE_REFRESH_TOKEN= # (OAuth Mestre Permanente)
GOOGLE_REDIRECT_URI= 
GOOGLE_DRIVE_FOLDER_ID= # ID da root folder Google.
```

---

## 14. ESTRUTURA DE CÓDIGO E ORGANIZAÇÃO DO PROJETO
```text
/src
 ├─ /app
 │  ├─ (dashboard)/       # Layout mestre que exige token jwt.
 │  │   ├─ admin/         # Sub-rotas CRUD da empresa.
 │  │   ├─ operacoes/     # Master Data list.
 │  │   └─ sinistros/     # Módulo The King. Listagem e detalhe.
 │  ├─ api/               # API Gateway - Operações de gravação B2B seguras.
 │  └─ login/             # Página Pública Page Next Server Render.
 ├─ /components           # Apresentação Pura (TopBar, NavItems).
 ├─ /lib                  # Negócio & Utilities: auth.js, permissions.ts, drive.ts, date-utils.ts.
 └─ /types                # A fonte da verdade para TS Objects de Data, ENUMS, Record Labels.
/supabase
 └─ schema.sql            # Todo o SQL original de como tabelas/tipos nascem.
```

---

## 15. REGRAS DE NEGÓCIO (ESSENCIAIS ENCONTRADAS)
- **Não Exclusão Lógica Sem Controle:** Não existe soft-delete visual ou hard delete aparente via cliente no momento de um sinistro validado na tela inteira de detalhe.
- **Aprovação Financeira Mestra:** Um valor de encerramento pode ser contabilizado cruzando "Redução de Orçamento". Um orçamento que um cliente pediu R$10.000 pode ter redução de R$2.000 após tratativas. Se aprovar pagamento, as datas e valores fecham o registro histórico irrevogavelmente, trocando o status global para **Encerrado**.
- **Obrigatoriedades em Emissão:** É impossível gravar sinistros retroativos com emissores diferentes. Emissão e Data de ocorrência podem divergir sim e estão representadas com flags visuais diferentes.
- **Controle de Visualização de Arquivo:** O NextJS não guarda stream. Quem gera o URL é o Google e o app aponta `target="_blank"` usando CSS nativo com ícones, mascarando o drive e transformando a experiência "White-Label".

---

## 16. UPLOADS, ARQUIVOS E DOCUMENTOS
- Possui classificação rigorosa. Todo upload pede o ID da ocorrência em paralelo ao seu TIPO (Ex. "Boletim_ocorrencia"). A listagem mapeia isso nativamente em Caixas com Cards pontilhados em caso de status nulo. Facilita o analista saber qual evidência tá faltando (Ex: "Falta comprovante fiscal da lavanderia para pagar o sinistrado.").

---

## 17. LOGS, AUDITORIA E RASTREABILIDADE
- Tabela `historico_sinistros`.
- Toda ação grande via API Handlers gera subação que insere na tabela o texto: *"Usuario X alterou Status para Y"* gravando a timeline na lateral visível do detalhe do sinistro para quem supervisiona.

---

## 18. SEGURANÇA E RISCOS
- [Hipótese Técnica Crítica] **Mídia Pública Google Drive**: Se o link é um `webViewLink` gerado sem permissões de domínio travadas pela API, links das fotos do carro, placa e as vezes CNH ou Orçamento de mecânica repassados para fora expõem dados sensíveis (LGPD).
- **Service Role em Rotas Client:** As tabelas Supabase estão sendo consumidas 100% via API com token Master Bypass (`service_role`). Requer que NENHUM component client interaja usando `supabasejs` anon key sem aplicar Data filters via `user_id` em Backend seguro. A aplicação depende inteiramente que todo request bata na `/api/` (NextJS) garantindo a session de payload.

---

## 19. DÍVIDA TÉCNICA, GARGALOS E PONTOS DE ATENÇÃO
1. **Componentão Bloqueante**: `/sinistros/[id]/page.tsx` possui *TUDO*: Modais, forms, grids de detail, funções de submit, manipulação de estado local massiva via `useState`. Causa risco alto em testes de manutenção visuais e refatorações complexas de regra (Spaghetti code propension).
2. **State Management de Fetches:** Fazer Fetching nativo com `useEffect`/`useCallback` nos dashboards causa cascateamento e falta de Global Caching. Sugerido uso de bibliotecas reativas para sincronização Server-State.
3. **Escala Design System:** O `globals.css` está muito denso (1.500+ linhas). Pode ocorrer conflitos entre classes de escopos (Ex: `.card` sobrepondo regras globais indesejáveis se a página precisar refatorar o wrapper de cards).

---

## 20. ROADMAP SUGERIDO

| Ação/Atenção | Prioridade | Esforço | Motivo / Vantagem |
|---|---|---|---|
| Refatorar Painel de Sinistro Master | Crítica | Alto | Fatiar `[id]/page.tsx` em partes pequenas renderizáveis de domínio isolado: `<TabTratativa>`, `<TabAnexos>`, etc. Evitar lentidão de DEV e refatoração acidental. |
| Supabase RLS Ativadas | Alta | Baixo | Adicionar segurança de Banco de Dados bloqueando leituras acidentais ou acessos não logados diretos por APIs da Web. |
| Gerenciamento React Query | Média | Médio | Gerar Cache L1 das queries dos Sinistros, para que ao voltar do Dashboard para listar novamente não ter Loadings de "Piscadas na UI" inteiras da API. |
| Componentes de UI Headless Separados | Média | Médio | Migrar os classes em components React: Ex: `<Badge color="status" />`, `<FormGroup />`. Facilita criação visual futura com menos boilerplate e tipagem limpa typescript. |

---

## 21. GLOSSÁRIO DO SISTEMA
- **PR**: Protocolo Registrado - Sigla que rege o prefixo dos ID de incidentes.
- **SLA**: Prazo métrico em dias preestabelecidos para conclusão de incidentes por prioridade.
- **Analista / Administrativo / Supervisor / Gerente**: Perfis que governam a base de pirâmide de gestão de acessos do sistema limitando poder de ação (Sendo Analista detentor do fluxo contábil interno e Supervisor gerador de passivos externos).
- **Ocorrência/Sinistro**: O evento que originou atrito com bens patrimoniais controlados (Batida/furto no condomínio, supermercado ou shopping supervisionado).

---

## 22. RESUMO PARA IA / NOTEBOOKLM
O **Leve Mobilidade ERP** é um Software B2B de backoffice de gerenciamento moderno criado com Next.js (App Router), Node e Postgres através da stack da plataforma Supabase, focada no processo vital de governança na terceirização de Facility Management (Estacionamentos Varejistas). Ele resolve a tratativa fluída, negocial e aprovativa de Sinistros (Sinistros de Automóvel, Estrutura e afins) vinculados a filiais e praças (Operações). 

Se atuando como I.A Auxiliadora neste repositório: Lembre que não há TailWind CSS instalado, tudo se baseia rigorosamente nas utilities e styles corporativos refinados premium B2B gravados no super arquivo `./globals.css`. Todo o banco de dados principal de schema se localiza via migrações estáticas no `supabase/schema.sql` (Única fonte da verdade onde tipos enumeráveis e referências cruzadas existem de verdade). Por fim, o storage não utiliza Supabase Storage original, ele conecta buffers Stream no Backend injetando diretórios em escala industrial de gigabytes da infraestrutura REST da Google Drive APIs em um arquivo de lib helper para cada PR gerado a partir do modulo. Qualquer edição em lógicas operacionais front-ends precisará necessariamente bater em Server actions nas routes puras da `/api/*` injetadas em SSR fetch por sessão. O core logístico é baseado num painel mestre de IDs (`[id]/page.tsx`) denso, devendo ser lido completamente antes de edições pontuais.

---

## 23. FAQ TÉCNICO DO PROJETO

- **O que faz a aplicação de ponta-a-ponta?**
Pessoas logadas abrem sinistros locais preenchendo veículos de clientes batidos. O backoffice loga de outro lado, acompanha prazos críticos SLA, recolhe recibos de oficinas e paga os clientes na aba financeira controlando as evidências.

- **Quem hospeda isso? Devo usar Firebase?**
Supabase para todos dados e Autenticação custom bcrypt e Google Drive em Cloud GCP para Anexos. NADA é enviado a bucket S3 ou AWS direto atualmente.

- **Há alguma regra sensível impeditiva no banco de logs?**
`Update` simples ou formatações simples são autorizadas e auditadas numa subtabela ativamente (Históricos) manualmente nas API Routes de Next. A lógica não é governada por triggers no database a nível Row do Update de Sinistro e sim por scripts isolados na Node. O único Trigger ativo roda apenas em carimbo "Atualizado_em" Timestamp.

- **Onde arrumo quebra de navegação de um supervisor?**
As `roles` globais da interface estão trancadas em arrays nativos e helpers (`permissions.ts`) chamadas primariamente para montagem de UI na `Sidebar.tsx`. E a rota real protegida se baseia nas Server Calls que travam NextAuth seções usando layout e pages do painel superior Dashboard `(dashboard)`.

---
## 24. ANEXOS E ARTEFATOS ÚTEIS
- *Checklist Mudança Core: Se adicionar aba ao Módulo Sinistros:*
  - [ ] Adicionar tipagem TypeScript (index.ts) se houver Sub-Enum.
  - [ ] Alterar arquivo físico do Banco com nova `ALTER TABLE` evolution.sql (`supabase`).
  - [ ] Atualizar GET e PUT API Next de `/api/sinistros/[id]`.
  - [ ] Montar visual grid UI novo no *mammoth* file `src/app/(dashboard)/sinistros/[id]/page.tsx` usando inputs de `.form-group` controlados.
  - [ ] Atualizar status auditoria ao Salvar, no arquivo Node de API.
