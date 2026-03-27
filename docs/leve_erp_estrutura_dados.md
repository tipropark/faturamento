# Leve ERP — Estrutura de Dados (Banco de Dados)

> **Versão:** 3.0 | **Fonte:** Auditoria técnica + arquivos SQL em `/supabase/`
> ✅ Confirmado no código | ⚠️ Inferência | 🔄 Precisa validação manual

---

## 1. VISÃO GERAL

- **SGBD:** PostgreSQL (Supabase) ✅
- **Projeto:** `ckgqmgclopqomctgvhbq.supabase.co` ✅
- **Total de tabelas:** ~40 ✅
- **Scripts SQL:** 34 arquivos em `/supabase/` ✅
- **Eixo central:** `operacoes.id` — toda FK transacional referencia esta tabela ✅

---

## 2. ENUMS DEFINIDOS NO BANCO ✅

| Enum | Valores | Arquivo |
|--|--|--|
| `perfil_usuario` | administrador, diretoria, gerente_operacoes, supervisor, analista_sinistro, financeiro, rh, dp, auditoria, ti 🔄(administrativo?) | `schema.sql` + evoluções |
| `status_sinistro` | aberto, em_analise, aguardando_documentos, aprovado, reprovado, encerrado | `schema.sql` |
| `tipo_operacao` | estacionamento, predial, misto | `schema.sql` |
| `categoria_anexo` | foto_placa, foto_veiculo, foto_dano, imagens_cftv, fotos_avaria, documentos_cliente, documento_veiculo, cnh_rg_cpf, ticket_cupom_fiscal, boletim_ocorrencia, orcamento_sinistrado, reducao_orcamentos, evidencia_conclusao, fotos_prevencao | `schema.sql` + evoluções |
| `status_inconsistencia` | pendente, aprovada, reprovada, corrigida | `evolution_sinistros.sql` |
| `categoria_sinistro` | avaria, furto, colisao, estrutural, reclamacao_posterior, outros | `evolution_sinistros.sql` |
| `tipo_solicitacao_tarifario` | cadastro_novo_tarifario, alteracao_tarifario_existente, cadastro_novo_convenio, alteracao_convenio_existente | `evolution_tarifarios_v1.sql` |
| `status_solicitacao_tarifario` | pendente, aprovado, reprovado, em_execucao, concluido | `evolution_tarifarios_v1.sql` |
| `nivel_acesso_modulo` | sem_acesso, visualizacao, criacao, edicao, aprovacao, execucao, total | `evolution_configuracoes_v1.sql` |
| `criticidade_log` | baixa, media, alta, critica | `evolution_auditoria_v2_global.sql` |
| `obrigatoriedade_operacao` | obrigatoria, opcional, dispensada | `evolution_central_solicitacoes_v1.sql` |
| `tipo_campo_dinamico` | texto_curto, texto_longo, select, multiselect, data, numero, checkbox, upload, vinculo_operacao, vinculo_usuario | `evolution_central_solicitacoes_v1.sql` |
| `tipo_interacao_central` | mensagem, status_change, responsible_change, file_upload, conclusion, reopening, system_log | `evolution_central_solicitacoes_v1.sql` |

---

## 3. TABELAS DETALHADAS

### 3.1 Core ✅

#### `usuarios`
| Coluna | Tipo | Constraint | Observação |
|--|--|--|--|
| id | UUID PK | DEFAULT uuid_generate_v4() | |
| nome | VARCHAR(255) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE NOT NULL | Login |
| senha_hash | TEXT | NOT NULL | bcryptjs |
| perfil | perfil_usuario | NOT NULL | Enum |
| ativo | BOOLEAN | DEFAULT TRUE | Controle de acesso |
| status | VARCHAR(20) | | ⚠️ Possivelmente redundante com `ativo` |
| gerente_operacoes_id | UUID FK | REFERENCES usuarios(id) | Hierarquia |
| criado_em / atualizado_em | TIMESTAMPTZ | DEFAULT NOW() | |
- **Triggers:** ✅ `update_atualizado_em`, ✅ Auditoria Global

#### `operacoes`
| Coluna | Tipo | Constraint | Observação |
|--|--|--|--|
| id | UUID PK | | Eixo central de FKs |
| nome_operacao | VARCHAR(255) | NOT NULL | |
| codigo_operacao | VARCHAR(50) | UNIQUE NOT NULL | Identificador curto |
| bandeira | VARCHAR(100) | | GPA, Assaí, etc. |
| tipo_operacao | tipo_operacao | | Enum |
| supervisor_id | UUID FK | REFERENCES usuarios(id) | |
| gerente_operacoes_id | UUID FK | REFERENCES usuarios(id) | |
| token_integracao | UUID | | Auto-gerado para agentes |
| habilitar_faturamento | BOOLEAN | | Da operação |
| automacao_sistema | VARCHAR(100) | | PRESCON, PARCO, etc. |
| integracao_faturamento_tipo | VARCHAR(50) | DEFAULT 'legado_direto' | |
| query_template_id | UUID FK | REFERENCES faturamento_query_templates | |
| 30+ campos estruturais | Vários | | Vagas, CFTV, cancelas, funcionários, benefícios |
- **Triggers:** ✅ `update_atualizado_em`, ✅ Auditoria Global
- ⚠️ **Migração incompleta:** Campos de automação existem aqui E em `operacoes_automacao`

#### `sinistros`
| Coluna | Tipo | Constraint | Observação |
|--|--|--|--|
| id | UUID PK | | |
| pr | VARCHAR(20) | UNIQUE NOT NULL | Via sequence `sinistro_pr_seq` |
| protocolo | VARCHAR(50) | UNIQUE NOT NULL | `LEVE-TIMESTAMP-RANDOM` |
| status | status_sinistro | NOT NULL DEFAULT 'aberto' | |
| operacao_id | UUID FK | NOT NULL | Eixo central |
| supervisor_id | UUID FK | | Quem abriu |
| analista_id / gerente_id / criado_por_id | UUID FK | | Hierarquia |
| data_ocorrencia / data_registro | TIMESTAMPTZ | | Detecção de prazo |
| data_limite_sla | DATE | | Calculado: +12 dias úteis |
| fora_do_prazo_abertura | BOOLEAN | DEFAULT FALSE | Auto: >48h úteis |
| categoria_sinistro | categoria_sinistro | | Enum |
| campos de prevenção | TEXT | | Melhoria, como evitar, ação recomendada |
- **Triggers:** ✅ `update_atualizado_em`, ✅ Auditoria Global, ✅ RLS

### 3.2 Faturamento ✅

#### `faturamento_movimentos`
| Coluna | Tipo | Constraint | Observação |
|--|--|--|--|
| id | UUID PK | | |
| operacao_id | UUID FK | NOT NULL | |
| ticket_id | VARCHAR | | UNIQUE com operacao_id |
| data_entrada / data_saida | TIMESTAMPTZ | | |
| valor | NUMERIC | | |
| forma_pagamento | VARCHAR | | DINHEIRO, PIX, CARTAO, CONVENIO |
| tipo_movimento | VARCHAR | DEFAULT 'RECEITA' | RECEITA, AVULSO, MENSALISTA |
| origem_sistema | VARCHAR(50) | | PRESCON, PARCO, PERSONAL |
| payload_original | JSONB | | Dados brutos do agente |
- **Constraints:** UNIQUE `(operacao_id, ticket_id)` ✅
- **Triggers:** Statement-level INSERT → consolida resumo diário, Row-level UPDATE → re-processa ✅

#### `faturamento_resumo_diario`
| Coluna | Tipo | Constraint | Observação |
|--|--|--|--|
| operacao_id | UUID FK | NOT NULL | |
| data_referencia | DATE | | UNIQUE com operacao_id |
| total_receita_original / total_avulso_original / total_mensalista_original | NUMERIC | | Valores brutos |
| ajuste_receita / ajuste_avulso / ajuste_mensalista | NUMERIC | | Ajustes manuais |
| total_receita_ajustada / total_avulso_ajustado / total_mensalista_ajustado | NUMERIC | | Finais |
| total_geral | NUMERIC | | Soma de todos |
| resumo_por_tipo_json / resumo_por_forma_pagamento_json | JSONB | | Breakdowns |
- **Fonte oficial para dashboards e metas** ✅

#### `faturamento_ajustes`
- Ajustes manuais com `tipo_ajuste`, `valor`, `sinal` (+/-), `status`, `motivo`
- **Trigger:** Row-level sync → re-calcula resumo diário ✅

#### `faturamento_query_templates`
- Templates SQL configuráveis por sistema (PRESCON, PARCO, PERSONAL)
- Campos: `codigo` (UNIQUE), `sistema`, `sql_template`, `mapping_saida` ✅

### 3.3 Alertas de Faturamento ✅

| Tabela | Finalidade | Campos Chave |
|--|--|--|
| `faturamento_operacao_calendario` | Dias operacionais | `domingo..sabado` (booleans) |
| `faturamento_feriados` | Feriados | `data`, `nome`, `abrangencia` |
| `faturamento_regras_alerta` | Regras configuráveis | `codigo`, `severidade`, `score_base`, `parametros` |
| `faturamento_alertas` | Instâncias de alerta | `operacao_id`, `data_referencia`, `regra_id`, `status` |
| `faturamento_alertas_feedback` | Histórico de tratativas | `alerta_id`, `usuario_id`, `acao`, `comentario` |
| `faturamento_alertas_v2_status` | Status do job global | `status_execucao`, `quantidade_processada` |

⚠️ **Naming:** Estas tabelas usam `criado_at`/`atualizado_at` (diferente do padrão `_em`)

### 3.4 Metas de Faturamento ✅

| Tabela | Finalidade | Campos Chave |
|--|--|--|
| `metas_faturamento` | Cadastro de metas | `operacao_id`, `ano`, `mes`, `valor_meta` — UNIQUE(op, ano, mes) |
| `metas_faturamento_apuracoes` | Snapshots | `valor_realizado`, `status_apuracao`, `confianca_apuracao` |
| `metas_faturamento_apuracoes_diarias` | Granular/dia | 🔄 Schema SQL não encontrado localmente |
| `metas_faturamento_alertas` | Alertas de meta | `tipo_alerta`, `criticidade`, `status` |
| `metas_faturamento_tratativas` | Tratativas auditáveis | `auditor_responsavel_id`, `categoria_causa`, `causa_raiz` |

### 3.5 Central de Solicitações ✅

| Tabela | Finalidade |
|--|--|
| `central_departamentos` | TI, RH, Financeiro, Operações (seed) |
| `central_status` | Novo, Em Triagem, Em Atendimento, Aguardando Solicitante, Concluído, Cancelado |
| `central_prioridades` | Baixa, Normal, Alta, Urgente |
| `central_categorias` | Categorias por departamento com SLA configurável |
| `central_subcategorias` | Subdivisões de categorias |
| `central_campos_dinamicos` | Campos configuráveis por depto/categoria |
| `central_solicitacoes` | Solicitações — protocolo auto `SOL-ANO-SEQ` |
| `central_campos_valores` | Valores dos campos dinâmicos |
| `central_interacoes` | Timeline/chat com tipo de interação |
| `central_anexos` | Anexos de solicitação |
| `central_departamentos_responsaveis` | Responsáveis/gestores por departamento |

### 3.6 Governança ✅

| Tabela | Finalidade |
|--|--|
| `configuracoes_sistema` | Chave-valor com categorias e sensibilidade |
| `perfis_permissoes` | Matriz perfil × módulo com nível de acesso |
| `perfis_sistema` | Cadastro dinâmico de perfis |
| `modulos_sistema` | Catálogo de módulos com identificador, nome, categoria |
| `auditoria_administrativa` | Log centralizado (destino de triggers e logs manuais) |

---

## 4. RPCs E FUNCTIONS 🔄

| Função | Tipo | Definição Local | Status |
|--|--|--|--|
| `fn_auditoria_global_automatica()` | TRIGGER FUNCTION | ✅ `evolution_auditoria_v2_global.sql` | ✅ |
| `sp_ativar_auditoria_tabela(text)` | PROCEDURE | ✅ Idem | ✅ |
| `fn_registrar_acesso_negado(uuid, varchar, text)` | FUNCTION | ✅ Idem | ✅ |
| `update_atualizado_em()` | TRIGGER FUNCTION | ✅ `schema.sql` | ✅ |
| `purgar_faturamento_antigo()` | FUNCTION | ✅ `evolution_faturamento_v5` | ✅ |
| `faturamento_consolidar_dia_v2(uuid, date)` | RPC | ❌ Não encontrada | 🔄 |
| `reprocessar_metas_diarias(uuid)` | RPC | ❌ Não encontrada | 🔄 |

---

## 5. SCRIPTS SQL (ORDEM CRONOLÓGICA) ✅

| # | Arquivo | Conteúdo |
|--|--|--|
| 1 | `schema.sql` | Schema base: enums, usuarios, operacoes, sinistros, anexos, historico |
| 2 | `evolution_sinistros.sql` | Novos enums, inconsistencias, prevenção, SLA |
| 3 | `evolution_operacoes.sql` | 30+ campos estruturais na operação |
| 4 | `evolution_configuracoes_v1.sql` | configuracoes_sistema, perfis_permissoes, auditoria_administrativa |
| 5 | `evolution_auditoria_v2_global.sql` | fn_auditoria_global_automatica, sp_ativar_auditoria |
| 6 | `evolution_governanca_v2.sql` | modulos_sistema, perfis_sistema, escopo |
| 7 | `evolution_tarifarios_v1.sql` | Solicitações, anexos, histórico de tarifários |
| 8 | `evolution_automacoes_v1.sql` | automacoes_catalogo, operacoes_automacao |
| 9 | `evolution_faturamento_v1.sql` | faturamento_movimentos (base) |
| 10 | `evolution_faturamento_v5_resumo_ajustes.sql` | faturamento_resumo_diario, ajustes, triggers |
| 11 | `evolution_faturamento_v7_hybrid_architecture.sql` | Templates SQL, logs importação, deduplicação |
| 12 | `evolution_faturamento_alertas_v1.sql` | Calendário, feriados, regras, alertas |
| 13 | `evolution_metas_faturamento_v1.sql` | Metas, apurações, alertas de meta, tratativas |
| 14 | `evolution_central_solicitacoes_v1.sql` | 11 tabelas da central, seeds |
| 15 | `evolution_sinistros_rls_v1.sql` | RLS em sinistros e tabelas filhas |
