# Leve ERP — Fluxos Funcionais e Regras de Negócio

> **Versão:** 3.0 | **Fonte:** Código-fonte real (API handlers, lib/, types/)
> ✅ Confirmado no código | ⚠️ Inferência | 🔄 Precisa validação manual

---

## 1. EIXO CENTRAL: OPERAÇÕES

Toda transação no sistema gira em torno da entidade `operacoes`. É o vínculo obrigatório de:
- Sinistros (`sinistros.operacao_id`) ✅
- Movimentos de faturamento (`faturamento_movimentos.operacao_id`) ✅
- Resumos diários (`faturamento_resumo_diario.operacao_id`) ✅
- Metas (`metas_faturamento.operacao_id`) ✅
- Alertas (`faturamento_alertas.operacao_id`) ✅
- Tarifários (`solicitacoes_tarifario.operacao_id`) ✅
- Automações (`operacoes_automacao.operacao_id`) ✅

**Regra:** Nenhum dado transacional existe sem vínculo a uma operação. ✅

---

## 2. FLUXOS DE SINISTROS

### 2.1 Abertura ✅
1. Supervisor acessa `/sinistros/novo`
2. Seleciona operação, preenche dados do cliente/veículo/dano
3. Sistema gera:
   - **PR:** `PR-ANO-SEQNUM` via sequence PostgreSQL `sinistro_pr_seq` ✅
   - **Protocolo:** `LEVE-TIMESTAMP-RANDOM(4 chars)` ✅
   - **SLA:** 12 dias úteis a partir de `data_ocorrencia` (via `adicionarDiasUteis()`) ✅
4. Verificações automáticas na criação:
   - Se `data_registro - data_ocorrencia > 48h úteis` → `fora_do_prazo_abertura = true` ✅
   - Se operação possui CFTV mas não há imagens → cria `inconsistencia` automática ✅
5. Registro de histórico: `"Sinistro criado pelo supervisor X"` ✅

### 2.2 Tratativa (Analista/Backoffice) ✅
1. Analista acessa `/sinistros/[id]` — exibe 8 abas:
   - **Geral:** Dados vitais (cliente, veículo, dano, status, SLA)
   - **Documentos:** Upload de 12 categorias via Google Drive
   - **Inconsistências:** Criação/análise de inconsistências pontuais
   - **Prevenção:** Input de melhoria e ação preventiva
   - **Redução de Orçamentos:** Negociação de valores
   - **Tratativa:** Observações internas, data início análise
   - **Financeiro:** Aprovação, valores, saving (redução de orçamento)
   - **Histórico:** Timeline de auditoria visual
2. Ciclo de status: `aberto → em_analise → aguardando_documentos → aprovado|reprovado → encerrado` ✅

### 2.3 Upload de Documentos (Google Drive) ✅
1. Usuário seleciona arquivo + categoria de anexo
2. `POST /api/sinistros/[id]/anexos` recebe `multipart/form-data`
3. Backend verifica/cria pasta no Drive: `PR-XXXX - NOME CLIENTE`
4. Upload via `googleapis` stream
5. Retorna `webViewLink` (URL pública para visualização)
6. Grava referência em tabela `anexos` (URL + tipo + sinistro_id)
7. Frontend exibe com `target="_blank"` — experiência white-label ✅

### 2.4 Aprovação Financeira ✅
1. Financeiro edita aba Financeiro
2. Registra: orçamento original, redução negociada, valor final
3. Aprova pagamento → status muda para `encerrado`
4. **Irrevogável:** Após aprovação, valores e datas são definitivos ✅

### 2.5 Regras de SLA ✅
| Regra | Valor | Função no Código |
|--|--|--|
| Prazo total | 12 dias ÚTEIS | `adicionarDiasUteis(data_ocorrencia, 12)` |
| Limite de registro | 48 horas ÚTEIS (2 dias úteis) | `adicionarDiasUteis(data_ocorrencia, 2)` |
| Dias úteis consideram | Seg-Sex, excluem feriados | `estaNoIntervaloUtil(inicio, fim)` |

---

## 3. FLUXOS DE FATURAMENTO

### 3.1 Pipeline de Importação ✅
```
┌──────────────────────┐
│ Agente Local         │ Script PowerShell/BAT em Windows
│ (1 por operação)     │ Conecta ao sistema local (PRESCON, PARCO, etc.)
└────────┬─────────────┘
         │ POST /api/faturamento/importar-movimentos
         │ Headers: x-operacao-id, x-integration-token
         │ Body: { movimentos: [...] }
         ▼
┌──────────────────────┐
│ API Handler          │ 1. Valida token vs operações.token_integracao
│ (Next.js Route)      │ 2. UPSERT em faturamento_movimentos
│                      │ 3. Deduplicação: ON CONFLICT(operacao_id, ticket_id)
│                      │ 4. Log em faturamento_importacao_logs
└────────┬─────────────┘
         │ Trigger automático (Statement-level INSERT)
         ▼
┌──────────────────────┐
│ Consolidação         │ Trigger re-calcula faturamento_resumo_diario
│ (PostgreSQL)         │ Para cada data distinta no batch inserido
└────────┬─────────────┘
         │ RPC: faturamento_consolidar_dia_v2 (forçar)
         ▼
┌──────────────────────┐
│ Resumo Diário        │ Valores: original + ajuste = final
│ (Tabela oficial)     │ Breakdowns: por tipo + por forma_pagamento
└──────────────────────┘
```

### 3.2 Regras de Deduplicação ✅
- Constraint UNIQUE: `(operacao_id, ticket_id)`
- Se ticket já existe: UPDATE (dados mais recentes do agente prevalecem)
- Se novo: INSERT normal ✅
- Header opcional `x-purge-today: true` limpa movimentos do dia antes de inserir ✅

### 3.3 Purga Automática ✅
- Função `purgar_faturamento_antigo()` remove movimentos brutos com >8 dias ✅
- O `faturamento_resumo_diario` é PRESERVADO (é o histórico oficial) ✅
- Buffer de 8 dias permite re-processamento de dados recentes ✅

### 3.4 Ajustes Manuais ✅
- Tabela `faturamento_ajustes` com tipo, valor e sinal (+/-)
- Tipos: `receita`, `avulso`, `mensalista`
- Sinais: `positivo` (adiciona), `negativo` (subtrai)
- **Trigger row-level:** Qualquer CRUD em ajustes re-calcula o resumo diário ✅

### 3.5 Templates SQL ✅
- Cada sistema de estacionamento tem um template SQL específico
- Armazenados em `faturamento_query_templates`
- Campos: `codigo` (PRESCON_PADRAO, etc.), `sql_template`, `mapping_saida`
- Agente local seleciona o template baseado na config da operação ⚠️

---

## 4. FLUXOS DE METAS E ALERTAS

### 4.1 Criação de Meta ✅
1. Admin/Financeiro cria meta em `POST /api/metas-faturamento`
2. Validação: UNIQUE `(operacao_id, ano, mes)` — rejeita duplicatas ✅
3. Metas globais: `operacao_id = NULL`, CHECK constraint `chk_meta_global_null` ✅
4. Após criação, executa automaticamente:
   - `apurarMeta()` → calcula realizado, projetado, % ✅
   - `processarAlertasMeta()` → gera alertas se desvio ✅

### 4.2 Apuração de Meta ✅
- Busca resumos diários do período em `faturamento_resumo_diario`
- Calcula:
  - `valor_realizado`: soma de totais até hoje
  - `valor_projetado`: projeção linear até fim do mês
  - `percentual_atingimento`: realizado / meta × 100
  - `confianca_apuracao`: baseada em dias restantes (quanto mais dias, menor confiança)
- RPC `reprocessar_metas_diarias` processa granularidade diária 🔄

### 4.3 Motor de Alertas (FaturamentoAlertEngine) ✅
- **Arquivo:** `src/lib/faturamento-alertas.ts`
- **Processamento:** Via Job agendado (NÃO roda real-time na tela) ✅
- **Endpoint:** `GET /api/faturamento/alertas/processar?token=CRON_SECRET`
- **Status tracking:** `faturamento_alertas_v2_status`

#### Regras de Detecção ✅

| Código | Critério | Severidade | Score |
|--|--|--|--|
| `DIA_ZERADO` | Total geral = 0 em dia operacional | Crítico | 50 |
| `SEQUENCIA_ABAIXO_META` | 3 dias consecutivos < Meta Diária | Alerta | 30 |
| `QUEDA_BRUSCA_HISTORICA` | Queda > 35% vs média dos últimos 7 dias | Alerta | 25 |
| `DESVIO_META_DIARIA` | Desvio > 25% da meta diária esperada | Insight | 15 |

#### Supressão Contextual ✅
1. **Feriados:** Consulta `faturamento_feriados` — suprime alertas ✅
2. **Dias não operacionais:** Consulta `faturamento_operacao_calendario` — se domingo=false, suprime ✅
3. **Descarte manual:** Auditor pode marcar como falso positivo com justificativa ✅

### 4.4 Tratativas de Auditoria ✅
- Auto-geradas quando `criticidade >= 'media'` ✅
- Campos: auditor_responsavel, categoria_causa, causa_raiz, acao_corretiva, prazo_resolucao
- Interface dedicada em `/admin/auditoria/metas` (modal split-screen) ✅

---

## 5. FLUXO DE TARIFÁRIOS ✅

```
Supervisor/Admin cria solicitação
  → Tipo: Cadastro_Novo_Tarifario | Alteracao_Tarifario | Cadastro_Novo_Convenio | Alteracao_Convenio
  → Status: pendente
  → Upload de anexos via Google Drive (mesma infraestrutura de sinistros)
  │
  ▼
Diretoria avalia
  → Aprovado → Status: aprovado
  → Reprovado → Status: reprovado (fim do fluxo)
  │
  ▼ (se aprovado)
TI executa
  → Status: em_execucao
  → TI aplica as mudanças no sistema externo
  │
  ▼
TI conclui
  → Status: concluido
  → Histórico operacional registrado em tarifarios_historico
```

**Regra de escopo:** Supervisor vê apenas suas próprias solicitações ✅

---

## 6. FLUXO DA CENTRAL DE SOLICITAÇÕES ✅

```
Usuário abre solicitação (/central-solicitacoes/nova)
  → Seleciona departamento → categoria → subcategoria
  → Preenche campos dinâmicos (definidos por depto/categoria)
  → Protocolo auto: SOL-ANO-SEQ
  → SLA: calculado pela categoria
  → Status: Novo
  │
  ▼
Triagem (responsável do departamento)
  → Status: Em Triagem → Em Atendimento
  │
  ▼
Interações (timeline de conversas)
  → Tipo: mensagem, status_change, responsible_change, file_upload
  → Cada interação registra: usuario_id, tipo, conteúdo, timestamps
  │
  ▼
Resolução
  → Aguardando Solicitante (se precisar info)
  → Concluído (resolvido)
  → Cancelado (descartado)
  → Avaliação opcional (1-5 estrelas) ⚠️
```

---

## 7. REGRAS DE CONTROLE DE ACESSO

### 7.1 Escopo por Perfil ✅

| Perfil | Escopo de Dados | Implementação |
|--|--|--|
| `administrador` | Tudo | Sem filtro |
| `diretoria` | Tudo | Sem filtro |
| `gerente_operacoes` | Operações sob gestão | Filtro por `gerente_operacoes_id = user.id` |
| `supervisor` | Próprias operações | Filtro por `supervisor_id = user.id` |
| `analista_sinistro` | Sinistros atribuídos | Filtro no módulo de sinistros |
| `financeiro` | Módulos financeiros | Sem filtro nos módulos permitidos |
| `auditoria` | Módulos de auditoria | Sem filtro nos módulos permitidos |
| `ti` | Configurações e permissões | Sem filtro |
| `rh`, `dp` | Central de solicitações | Apenas seus próprios pedidos |
| `administrativo` | Administrativo (cadastros) | admin-like parcial |

### 7.2 Defesa em Profundidade ✅
1. **Camada 1 - Middleware:** `src/middleware.ts` bloqueia rotas sem sessão JWT ✅
2. **Camada 2 - Sidebar:** Esconde itens de menu por perfil (inline arrays) ✅
3. **Camada 3 - API:** Verifica perfil em `withAudit()` ou checagem inline ✅
4. **Camada 4 - Banco:** RLS em sinistros (policies por perfil e ownership) ✅

> ⚠️ **Inconsistência conhecida:** As camadas 2 e 3 usam mecanismos diferentes (sidebar usa arrays inline, APIs usam funções de `permissions.ts` ou checagens ad-hoc). Não há enforcement unificado.

---

## 8. REGRAS DE AUDITORIA ✅

### 8.1 Auditoria Automática (Triggers no Banco) ✅
- Trigger `fn_auditoria_global_automatica()` ativado em ~15 tabelas
- Captura: usuario_id (via `audit.current_user_id`), tabela, ação (INSERT/UPDATE/DELETE), dados antes/depois, criticidade
- Ativação por tabela: `CALL sp_ativar_auditoria_tabela('nome_tabela')` ✅

### 8.2 Auditoria Manual (Aplicação) ✅
- `recordAuditLog()` → loga eventos custom com módulo, ação, detalhes ✅
- `withAudit(handler)` → wrapa API routes, loga:
  - Acesso negado (sem sessão)
  - Erros críticos (status 500)
  - ✅ Registro automático sem intervenção do dev

### 8.3 Prerrequisito ✅
Para que a auditoria de trigger funcione, a API DEVE usar `getAuditedClient(userId)` que:
1. Cria um cliente Supabase com `service_role`
2. Executa `set_config('audit.current_user_id', userId, true)` na sessão PostgreSQL
3. Permite que o trigger capture o ID do usuário que está agindo ✅

> ⚠️ **Exceção:** Central de Solicitações usa `createClient()` (anon) — a auditoria nessas tabelas pode não capturar o usuario_id correto.
