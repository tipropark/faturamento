# Módulos e Telas: Leve ERP (PRISM)

## 1. Mapa de Rotas Completo

| Rota | Módulo | Título | Perfis com Acesso | Status |
|---|---|---|---|---|
| `/login` | Auth | Página de Login | Público | ✅ Funcional |
| `/dashboard` | Dashboard | Visão Geral | Todos | ✅ Funcional |
| `/sinistros` | Sinistros | Lista de Sinistros | admin, diretoria, gerente_operacoes, supervisor, analista_sinistro, financeiro, auditoria | ✅ Funcional |
| `/sinistros/novo` | Sinistros | Registrar Novo Sinistro | admin, diretoria, gerente_operacoes, supervisor, analista_sinistro | ✅ Funcional |
| `/sinistros/[id]` | Sinistros | Detalhe do Sinistro | admin, diretoria, gerente_operacoes, supervisor, analista_sinistro, financeiro, auditoria | ✅ Funcional |
| `/sinistros/relatorios` | Sinistros | Relatórios | admin, diretoria, analista_sinistro, auditoria | ✅ Funcional |
| `/tarifarios` | Tarifários | Lista de Solicitações | admin, diretoria, supervisor, ti | ✅ Funcional |
| `/tarifarios/novo` | Tarifários | Nova Solicitação | admin, diretoria, supervisor | ✅ Funcional |
| `/tarifarios/[id]` | Tarifários | Detalhe da Solicitação | admin, diretoria, supervisor, ti | ✅ Funcional |
| `/operacoes` | Operações | Catálogo de Unidades | admin, diretoria, gerente_operacoes, administrativo | ✅ Funcional |
| `/central-solicitacoes` | Helpdesk | Hub da Central | Todos autenticados | ✅ Funcional |
| `/central-solicitacoes/nova` | Helpdesk | Wizard Nova Solicitação | Todos autenticados | ✅ Funcional |
| `/central-solicitacoes/todas` | Helpdesk | Todos os Chamados | admin, diretoria, administrativo, auditoria | ✅ Funcional |
| `/central-solicitacoes/[id]` | Helpdesk | Detalhe do Chamado | Conforme escopo | ✅ Funcional |
| `/central-solicitacoes/relatorios` | Helpdesk | Relatórios de Atendimento | admin, diretoria, gerente_operacoes, administrativo | 🔶 Parcial |
| `/central-solicitacoes/configuracoes` | Helpdesk | Configuração de Departamentos | admin, ti, administrativo | ✅ Funcional |
| `/admin/faturamento` | Financeiro | Dashboard de Faturamento | admin, diretoria, financeiro, gerente_operacoes | ✅ Funcional |
| `/admin/faturamento/metas` | Financeiro | Metas e Alertas | admin, diretoria, financeiro, auditoria | ✅ Funcional |
| `/admin/faturamento/metas/[id]` | Financeiro | Detalhe da Meta | admin, diretoria, financeiro | ✅ Funcional |
| `/admin/faturamento/alertas` | Financeiro | Alertas de Desvio | admin, diretoria, financeiro, auditoria | ✅ Funcional |
| `/admin/patrimonio` | Patrimônio | Inventário de Ativos | admin, diretoria, gerente_operacoes, supervisor, financeiro, auditoria, ti, administrativo | ✅ Funcional |
| `/admin/patrimonio/novo` | Patrimônio | Cadastrar Novo Ativo | admin, ti, administrativo | ✅ Funcional |
| `/admin/patrimonio/[id]` | Patrimônio | Detalhe do Ativo | Conforme acesso | ✅ Funcional |
| `/admin/patrimonio/alertas` | Patrimônio | Alertas de Patrimônio | admin, ti, auditoria | ✅ Funcional |
| `/admin/patrimonio/categorias` | Patrimônio | Gestão de Categorias | admin, ti, administrativo | ✅ Funcional |
| `/admin/auditoria` | Auditoria | Log de Auditoria Global | admin, auditoria, diretoria | ✅ Funcional |
| `/admin/auditoria/faturamento` | Auditoria | Auditoria de Faturamento | admin, auditoria, diretoria | ✅ Funcional |
| `/admin/auditoria/faturamento/operacao` | Auditoria | Auditoria por Operação | admin, auditoria | ✅ Funcional |
| `/admin/auditoria/faturamento/tratativa` | Auditoria | Tratativas de Alertas | admin, auditoria, financeiro | ✅ Funcional |
| `/admin/auditoria/metas` | Auditoria | Auditoria de Metas | admin, auditoria | ✅ Funcional |
| `/admin/auditoria/auditor-senior` | Auditoria | Painel do Auditor Sênior | admin, auditoria | 🔶 Parcial |
| `/admin/tecnologia-ia` | TI | Hub de Tecnologia & IA | admin, diretoria, ti, auditoria | ✅ Funcional |
| `/admin/tecnologia-ia/logs-xrm` | TI | Logs Control-XRM | admin, ti, auditoria, diretoria | ✅ Funcional |
| `/admin/usuarios` | Admin | Gestão de Usuários | admin, administrativo, diretoria | ✅ Funcional |
| `/admin/colaboradores` | Admin | Lista de Colaboradores | admin, diretoria, gerente_operacoes, rh, dp, administrativo | ✅ Funcional |
| `/admin/colaboradores/novo` | Admin | Cadastrar Colaborador | admin, rh, dp, administrativo | ✅ Funcional |
| `/admin/colaboradores/[id]` | Admin | Detalhe do Colaborador | Conforme acesso | ✅ Funcional |
| `/admin/supervisores` | Admin | Lista de Supervisores | admin, administrativo, diretoria, gerente_operacoes | ✅ Funcional |
| `/admin/gerentes` | Admin | Lista de Gerentes | admin, administrativo, diretoria | ✅ Funcional |
| `/admin/operacoes` | Admin | Gerenciar Operações (Admin) | admin, administrativo, diretoria | ✅ Funcional |
| `/admin/permissoes` | Admin | Perfis e Permissões | admin, ti | ✅ Funcional |
| `/admin/configuracoes` | Admin | Configurações do Sistema | admin, ti | ✅ Funcional |

---

## 2. Documentação por Módulo

---

### Área: Autenticação

#### `/login`
- **Propósito:** Ponto único de entrada do sistema. O usuário insere email e senha para obter acesso.
- **Roles:** Público (redireciona para `/dashboard` se já autenticado).
- **Dados consumidos:** `POST /api/auth/signin` → NextAuth `CredentialsProvider` → `public.usuarios`.
- **Ações disponíveis:** Login via email/senha; exibição de erro em credenciais inválidas.
- **Componentes:** Formulário centralizado com identidade visual da Leve (azul-marinho `#272F5C`).
- **Status:** ✅ Funcional.

---

### Área: Layout Global

#### `Sidebar` (`/src/components/Sidebar.tsx`)
- **Propósito:** Navegação principal lateral persistente, com suporte a colapso via pin/hover.
- **Comportamento:** Exibe apenas os itens de menu compatíveis com o `perfil` do usuário logado (filtragem client-side via `canSee(perfis)`).
- **Seções:** Principal / Módulos Operacionais / Operações / Atendimento / Administração.
- **Estado:** Colapsável (modo ícone apenas) com expansão ao hover. Estado persistido em `localStorage`.

#### `Topbar` (`/src/components/Topbar.tsx`)
- **Propósito:** Barra superior com breadcrumb, notificações e acesso rápido ao perfil.

#### `BottomNav` (`/src/components/BottomNav.tsx`)
- **Propósito:** Navegação inferior para mobile (App-First), com atalhos para as rotas mais usadas.

#### `/dashboard`
- **Propósito:** Painel inicial com KPIs de visão geral após o login.
- **Roles:** Todos os perfis autenticados.
- **Dados consumidos:** `sinistros (count por status)`, `operacoes (count ativas)`, `usuarios (count ativos)`, `solicitacoes_tarifario (count por status)`.
- **Componentes:** Banner de boas-vindas com saudação contextual, `stats-grid` com 5 KPIs, tabela de sinistros recentes, painel de resumo por status.
- **Status:** ✅ Funcional.

---

### Módulo: Sinistros

#### `/sinistros` — Lista de Sinistros
- **Propósito:** Visão tabular de todos os sinistros acessíveis ao usuário logado, com filtros avançados.
- **Roles:** `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `analista_sinistro`, `financeiro`, `auditoria`.
- **Dados consumidos:** `GET /api/sinistros` → `sinistros JOIN operacoes JOIN usuarios` (filtrado por RLS de perfil e escopo).
- **Ações disponíveis:** Filtrar por status, prioridade, operação, data; busca por PR/cliente/placa; exportar CSV; clicar para ver detalhe.
- **Componentes:** Tabela paginada com badges de status coloridos, filtros em linha, botão "Novo Sinistro".
- **Status:** ✅ Funcional.

#### `/sinistros/novo` — Registrar Novo Sinistro
- **Propósito:** Formulário completo de abertura de ocorrência (cliente, veículo, danos, documentos).
- **Roles:** `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `analista_sinistro`.
- **Dados consumidos:** `GET /api/operacoes` (para seleção da unidade); `POST /api/sinistros` (submissão).
- **Ações disponíveis:** Preencher dados do cliente (nome, CPF, telefone), veículo (placa, modelo, marca), ocorrência (data, motivo, danos), upload de imagens; submeter.
- **Componentes:** Formulário multi-seção com validação, upload via Supabase Storage para `sinistros-anexos`.
- **Status:** ✅ Funcional.

#### `/sinistros/[id]` — Detalhe do Sinistro
- **Propósito:** Visualização e gestão completa de um sinistro específico, incluindo histórico, tratativas e decisão financeira.
- **Roles:** Conforme RLS (gerentes veem seus sinistros, supervisores veem os seus, analistas e admin veem todos).
- **Dados consumidos:** `GET /api/sinistros/[id]` → sinistro + anexos + histórico + inconsistências.
- **Ações disponíveis:**
  - `analista_sinistro`, `administrador`: Alterar status, atribuir analista, adicionar obs. internas.
  - `financeiro`, `administrador`: Aprovar/reprovar pagamento, registrar data de pagamento.
  - Todos com acesso: Upload de anexos adicionais, visualizar timeline de eventos.
- **Componentes:** Tabs de informações (Dados, Tratativa, Financeiro, Histórico, Anexos), modal de edição de status, timeline de eventos.
- **Status:** ✅ Funcional.

#### `/sinistros/relatorios` — Relatórios
- **Propósito:** Análise consolidada de sinistros por período, operação e tipo.
- **Roles:** `administrador`, `diretoria`, `analista_sinistro`, `auditoria`.
- **Status:** ✅ Funcional.

---

### Módulo: Tarifários e Convênios

#### `/tarifarios` — Lista de Solicitações
- **Propósito:** Painel do workflow de aprovação de mudanças tarifárias e convênios.
- **Roles:** `administrador`, `diretoria`, `supervisor`, `ti`.
- **Dados consumidos:** `GET /api/tarifarios` → `solicitacoes_tarifario JOIN operacoes JOIN usuarios`.
- **Ações disponíveis:** Filtrar por status/tipo; clicar para ver detalhe; criar nova solicitação.
- **Componentes:** Cards Kanban ou tabela por status (`pendente → aprovado → em_execucao → concluido`).
- **Status:** ✅ Funcional.

#### `/tarifarios/novo` — Nova Solicitação
- **Propósito:** Abertura de solicitação formal de alteração tarifária ou de convênio.
- **Roles:** `administrador`, `diretoria`, `supervisor`.
- **Dados consumidos:** `GET /api/operacoes` (seleção operação); `POST /api/tarifarios`.
- **Ações disponíveis:** Selecionar tipo (`cadastro novo`, `alteração tarifário`, `cadastro convênio`, `alteração convênio`), descrever a mudança desejada, anexar documentos de referência, definir data desejada.
- **Status:** ✅ Funcional.

#### `/tarifarios/[id]` — Detalhe da Solicitação
- **Propósito:** Gestão do ciclo de vida de uma solicitação (aprovação pela diretoria + execução pelo TI).
- **Ações por role:**
  - `diretoria`, `administrador`: Aprovar/reprovar com parecer.
  - `ti`, `administrador`: Registrar início e conclusão da execução, adicionar obs. técnica.
- **Status:** ✅ Funcional.

---

### Módulo: Operações

#### `/operacoes` — Catálogo de Unidades
- **Propósito:** Listagem de todas as operações ativas com dados de localização, capacidade e responsáveis.
- **Roles:** `administrador`, `diretoria`, `gerente_operacoes`, `administrativo`.
- **Dados consumidos:** `GET /api/operacoes` → `operacoes JOIN usuarios (supervisor + gerente)`.
- **Ações disponíveis:** Busca por nome/cidade, filtrar por bandeira/UF/status, visualizar cards de operação.
- **Componentes:** Grid de cards (nome, bandeira, cidade, supervisor, gerente, vagas).
- **Status:** ✅ Funcional.

#### `/admin/operacoes` — Gerenciar Operações (Admin)
- **Propósito:** CRUD completo de unidades operacionais com todos os campos estendidos (infraestrutura, pessoal, benefícios, integrações).
- **Roles:** `administrador`, `administrativo`, `diretoria`.
- **Dados consumidos:** `GET /api/operacoes`, `POST /api/operacoes`, `PUT /api/operacoes/[id]`.
- **Ações disponíveis:** Criar nova operação, editar todos os campos (incluindo `cloudpark_filial_codigo`, escopo de pessoal, CFTV, benefícios), ativar/inativar operação.
- **Componentes:** Tabela com modal de edição expandido (formulário multi-seção com ~30 campos).
- **Status:** ✅ Funcional.

---

### Módulo: Financeiro / Faturamento

#### `/admin/faturamento` — Dashboard de Faturamento
- **Propósito:** Visão consolidada da performance financeira de todas as operações com dados de faturamento diário/mensal.
- **Roles:** `administrador`, `diretoria`, `financeiro`, `gerente_operacoes`.
- **Dados consumidos:** `GET /api/faturamento` → `faturamento_movimentos`, `faturamento_resumo_diario`, `metas_faturamento`.
- **Ações disponíveis:** Filtrar por período (mês/ano), selecionar operação, visualizar movimentos individuais (tabela virtualizada), exportar CSV.
- **Componentes:** `VirtualTicketsTable` (virtualização de listas longas via `react-window`), gráficos de linha (Recharts), painel de KPIs (faturamento realizado vs. meta).
- **Status:** ✅ Funcional.

#### `/admin/faturamento/metas` — Metas e Alertas
- **Propósito:** Painel de acompanhamento de metas mensais por operação com indicadores de ritmo e alertas de desvio.
- **Roles:** `administrador`, `diretoria`, `financeiro`, `auditoria`.
- **Dados consumidos:** `GET /api/metas-faturamento` → `metas_faturamento`, `apuracoes_meta`, `alertas_meta`.
- **Ações disponíveis:** Criar/editar meta por operação, visualizar status de apuração (no ritmo / crítica / atingida), filtrar por mês/ano, acessar detalhe da meta.
- **Componentes:** `VirtualMetasTable` (tabela virtualizada de metas), cards de KPI de apuração com indicadores coloridos, badge de criticidade.
- **Status:** ✅ Funcional.

#### `/admin/faturamento/metas/[id]` — Detalhe da Meta
- **Propósito:** Drill-down de uma meta específica com histórico de apurações diárias e tratativas de alertas.
- **Dados consumidos:** `GET /api/metas-faturamento/[id]` → detalhes de meta + apurações por dia.
- **Componentes:** Gráfico de linha (realizado vs. projetado vs. meta parcial esperada), tabela de dias com status diário.
- **Status:** ✅ Funcional.

#### `/admin/faturamento/alertas` — Alertas de Desvio
- **Propósito:** Lista de alertas gerados automaticamente quando operações desviam significativamente das metas.
- **Roles:** `administrador`, `diretoria`, `financeiro`, `auditoria`.
- **Dados consumidos:** `GET /api/metas-faturamento/alertas` → `alertas_meta JOIN metas_faturamento JOIN operacoes`.
- **Ações disponíveis:** Filtrar por criticidade/status, iniciar tratativa via modal, visualizar histórico de tratativas.
- **Componentes:** `AlertaTratativaModal` (modal completo de análise de alerta com formulário de causa raiz e ação corretiva).
- **Status:** ✅ Funcional.

---

### Módulo: Patrimônio

#### `/admin/patrimonio` — Inventário de Ativos
- **Propósito:** Catálogo completo de bens físicos da empresa com filtros por categoria, status, operação.
- **Roles:** `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `financeiro`, `auditoria`, `ti`, `administrativo`.
- **Dados consumidos:** `GET /api/patrimonio` → `patrimonios JOIN operacoes JOIN usuarios (responsavel)`.
- **Ações disponíveis:** Busca por código/nome, filtrar por categoria (TI, Facilities, Operacional, Veículo, Mobiliário), status (Ativo, Manutenção, Baixado), exportar lista.
- **Componentes:** Tabela com linha de ativo (código, nome, operação, responsável, categoria, status, condição), botão de ação rápida por linha.
- **Status:** ✅ Funcional.

#### `/admin/patrimonio/novo` — Cadastrar Novo Ativo
- **Propósito:** Formulário de registro de um novo bem patrimonial com campos dinâmicos por categoria.
- **Roles:** `administrador`, `ti`, `administrativo`.
- **Dados consumidos:** `GET /api/operacoes`, `GET /api/usuarios`; `POST /api/patrimonio`.
- **Ações disponíveis:** Preencher dados do ativo (código, nome, categoria, valor de compra, data de garantia), vincular à operação e responsável, selecionar campos específicos em `campos_especificos JSONB`.
- **Status:** ✅ Funcional.

#### `/admin/patrimonio/[id]` — Detalhe do Ativo
- **Propósito:** Ficha completa do ativo com histórico de movimentações, manutenções e vistorias.
- **Ações disponíveis:**
  - `ti`, `administrativo`: Editar dados, registrar manutenção, agendar vistoria, transferir operação.
  - `auditoria`: Visualizar histórico completo.
- **Componentes:** Tabs (Dados Gerais, Histórico de Alocação, Manutenções, Vistorias, Anexos/Fotos), modal de edição de status.
- **Status:** ✅ Funcional.

#### `/admin/patrimonio/alertas` — Alertas de Patrimônio
- **Propósito:** Monitoramento centralizado de garantias vencendo, manutenções pendentes e inconsistências.
- **Dados consumidos:** `GET /api/patrimonio/alertas` → `patrimonio_alertas JOIN patrimonios`.
- **Status:** ✅ Funcional.

#### `/admin/patrimonio/categorias` — Gestão de Categorias
- **Propósito:** CRUD de categorias e subcategorias customizadas para classificação de ativos.
- **Roles:** `administrador`, `ti`, `administrativo`.
- **Componentes:** `SubcategoriaModal` para criação hierárquica de categorias.
- **Status:** ✅ Funcional.

---

### Módulo: Central de Solicitações (Helpdesk)

#### `/central-solicitacoes` — Hub da Central
- **Propósito:** Painel inicial do módulo Helpdesk com KPIs de chamados abertos, SLA e acesso rápido às ações.
- **Roles:** Todos os perfis autenticados.
- **Dados consumidos:** `GET /api/central-solicitacoes` → `central_solicitacoes (count por status)`.
- **Componentes:** Cards de resumo (abertos, em atendimento, concluídos), botão de destaque "Nova Solicitação", lista de chamados recentes.
- **Status:** ✅ Funcional.

#### `/central-solicitacoes/nova` — Wizard Nova Solicitação
- **Propósito:** Interface step-by-step de 4 passos para abertura de chamado: (1) Departamento → (2) Categoria → (3) Subcategoria (se existir) → (4) Detalhes e Envio.
- **Roles:** Todos os perfis autenticados.
- **Dados consumidos:** `GET /api/central-solicitacoes/config` → `central_departamentos`, `central_categorias`, `central_subcategorias`, `central_prioridades`, `operacoes`.
- **Ações disponíveis:** Selecionar departamento → assunto → refinar → preencher título, descrição, operação, urgência, anexos; enviar.
- **Componentes:** Progress indicator (4 nós com linha), selection cards (aspect-ratio 1:1 com hover e estado selecionado), formulário final premium.
- **Status:** ✅ Funcional.

#### `/central-solicitacoes/todas` — Todos os Chamados
- **Propósito:** Visão administrativa de todos os chamados do sistema com filtros completos.
- **Roles:** `administrador`, `diretoria`, `administrativo`, `auditoria`.
- **Status:** ✅ Funcional.

#### `/central-solicitacoes/[id]` — Detalhe do Chamado
- **Propósito:** Thread de interações de um chamado com histórico de mensagens e ações de atendimento.
- **Dados consumidos:** `GET /api/central-solicitacoes/[id]` → solicitação + interações + anexos.
- **Status:** ✅ Funcional.

#### `/central-solicitacoes/configuracoes` — Configuração de Departamentos
- **Propósito:** Gestão dos departamentos, categorias, subcategorias, SLAs e campos dinâmicos do Helpdesk.
- **Roles:** `administrador`, `ti`, `administrativo`.
- **Dados consumidos:** `GET/POST/PUT /api/central-solicitacoes/config` → todas as tabelas `central_*`.
- **Status:** ✅ Funcional.

---

### Módulo: Auditoria e Logs

#### `/admin/auditoria` — Log de Auditoria Global
- **Propósito:** Visualização de todos os eventos registrados automaticamente pelos triggers do banco.
- **Roles:** `administrador`, `auditoria`, `diretoria`.
- **Dados consumidos:** `GET /api/auditoria` → `auditoria_administrativa`.
- **Ações disponíveis:** Filtrar por módulo, criticidade, período, usuário; buscar por registro ID.
- **Componentes:** Tabela com badges de criticidade (`baixa/media/alta/critica`), diff viewer JSON para `dados_anteriores`/`dados_novos`.
- **Status:** ✅ Funcional.

#### `/admin/auditoria/faturamento` — Auditoria de Faturamento
- **Propósito:** Análise detalhada de inconsistências e alertas de faturamento para auditores.
- **Roles:** `administrador`, `auditoria`, `diretoria`.
- **Status:** ✅ Funcional.

#### `/admin/auditoria/metas` — Auditoria de Metas
- **Propósito:** Histórico de apurações e inconsistências no módulo de metas financeiras.
- **Status:** ✅ Funcional.

#### `/admin/auditoria/auditor-senior` — Painel do Auditor Sênior
- **Propósito:** Visão consolidada de alto nível para auditores com acesso a relatórios executivos.
- **Status:** 🔶 Parcial.

---

### Módulo: Tecnologia & IA

#### `/admin/tecnologia-ia` — Hub de Tecnologia & IA
- **Propósito:** Portal de acesso às ferramentas técnicas internas e infraestrutura de IA.
- **Roles:** `administrador`, `diretoria`, `ti`, `auditoria`.
- **Componentes:** Grid de 7 cards de módulo (ícone colorido, badge de categoria, features, link):
  1. **Cotas de API de IA** — consumo de tokens e custos.
  2. **Sincronização de Dados** — status das rotinas de ETL.
  3. **Gerador de SC** — automação de Solicitações de Compra.
  4. **Documentação ERP** — manuais e guias internos.
  5. **Biblioteca de Prompts** — gestão de prompts para IA.
  6. **Links de Internet** — status de conectividade das unidades.
  7. **Logs Control-XRM** — monitoramento da integração de faturamento.
- **Status:** ✅ Funcional (módulos internos em desenvolvimento incremental).

#### `/admin/tecnologia-ia/logs-xrm` — Logs Control-XRM
- **Propósito:** Monitoramento em tempo real das execuções do script de integração Control-XRM (ETL noturno de faturamento).
- **Roles:** `administrador`, `ti`, `auditoria`, `diretoria`.
- **Dados consumidos:** `GET /api/control-xrm/logs` → `control_xrm_logs`.
- **Ações disponíveis:** Filtrar por nível (INFO/WARN/ERROR), status, etapa, período; visualizar payload JSON de erros.
- **Status:** ✅ Funcional.

---

### Módulo: Administração

#### `/admin/usuarios` — Gestão de Usuários
- **Propósito:** CRUD completo de usuários do sistema com atribuição de perfis.
- **Roles:** `administrador`, `administrativo`, `diretoria`.
- **Dados consumidos:** `GET /api/usuarios` → `usuarios`; `POST /api/usuarios`; `PATCH /api/usuarios/[id]`.
- **Ações disponíveis:** Criar novo usuário (nome, email, senha, perfil, gerente vinculado), editar perfil/status, ativar/desativar conta. **Não há auto-registro — exclusivo pelo TI.**
- **Componentes:** Tabela de usuários com badge de perfil, modal de criação/edição, toggle de ativo.
- **Status:** ✅ Funcional.

#### `/admin/colaboradores` — Lista de Colaboradores
- **Propósito:** Cadastro e gestão de colaboradores de campo (independente de acesso ao sistema).
- **Roles:** `administrador`, `diretoria`, `gerente_operacoes`, `rh`, `dp`, `administrativo`.
- **Dados consumidos:** `GET /api/colaboradores` → `colaboradores JOIN colaboradores_operacoes JOIN operacoes`.
- **Ações disponíveis:** Busca por nome/CPF/matrícula, filtrar por status/operação, ver detalhe, criar novo.
- **Status:** ✅ Funcional.

#### `/admin/colaboradores/novo` — Cadastrar Colaborador
- **Propósito:** Formulário de registro de novo colaborador com dados pessoais e vínculo com operações.
- **Roles:** `administrador`, `rh`, `dp`, `administrativo`.
- **Status:** ✅ Funcional.

#### `/admin/colaboradores/[id]` — Detalhe do Colaborador
- **Propósito:** Ficha completa com histórico de operações e gestão de vínculos ativos.
- **Status:** ✅ Funcional.

#### `/admin/supervisores` — Lista de Supervisores
- **Propósito:** Visão filtrada de usuários com perfil `supervisor` e suas operações vinculadas.
- **Roles:** `administrador`, `administrativo`, `diretoria`, `gerente_operacoes`.
- **Status:** ✅ Funcional.

#### `/admin/gerentes` — Lista de Gerentes
- **Propósito:** Visão dos gerentes de operações com suas equipes de supervisores.
- **Roles:** `administrador`, `administrativo`, `diretoria`.
- **Status:** ✅ Funcional.

#### `/admin/permissoes` — Perfis e Permissões
- **Propósito:** Gestão da matriz de permissões por perfil e módulo (tabelas `perfis_sistema`, `perfis_permissoes`, `modulos_sistema`).
- **Roles:** `administrador`, `ti`.
- **Status:** ✅ Funcional.

#### `/admin/configuracoes` — Configurações do Sistema
- **Propósito:** Painel de configurações globais da plataforma (integrações, notificações, parâmetros).
- **Roles:** `administrador`, `ti`.
- **Dados consumidos:** `GET /api/configuracoes` → `configuracoes_sistema`.
- **Status:** ✅ Funcional.

---

## 3. Componentes Globais Reutilizados

| Componente | Arquivo | Propósito | Onde é Usado | Props Principais |
|---|---|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | Menu lateral colapsável com filtragem de itens por perfil | Layout global de todas as páginas autenticadas | `user`, `isCollapsed`, `onToggle`, `onClose` |
| `LayoutWrapper` | `components/LayoutWrapper.tsx` | Container de layout que une Sidebar + Topbar + BottomNav + área de conteúdo | `(dashboard)/layout.tsx` | `user`, `children` |
| `Topbar` | `components/Topbar.tsx` | Barra superior com título da página, notificações e avatar | Todas as páginas autenticadas | `user` |
| `BottomNav` | `components/BottomNav.tsx` | Navegação mobile inferior com atalhos de módulos principais | Mobile only — todas as páginas autenticadas | `user` |
| `VirtualMetasTable` | `components/faturamento/VirtualMetasTable.tsx` | Tabela virtualizada (react-window) para listas longas de metas sem degradação de performance | `/admin/faturamento/metas` | `metas`, `onSelect`, `height` |
| `VirtualTicketsTable` | `components/faturamento/VirtualTicketsTable.tsx` | Tabela virtualizada de movimentos de faturamento (tickets individuais) | `/admin/faturamento` | `tickets`, `onLoadMore` |
| `AlertaTratativaModal` | `components/faturamento/AlertaTratativaModal.tsx` | Modal completo de análise de alerta de meta com formulário de causa raiz, histórico de tratativas e submissão | `/admin/faturamento/alertas`, `/admin/auditoria/faturamento` | `alerta`, `onClose`, `onSave` |
| `SubcategoriaModal` | `components/patrimonio/SubcategoriaModal.tsx` | Modal de criação/edição de subcategorias de patrimônio com validação em linha | `/admin/patrimonio/categorias` | `categoria`, `onSave`, `onClose` |
