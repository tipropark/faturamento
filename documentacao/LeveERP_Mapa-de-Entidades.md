# Mapa de Entidades — Leve ERP (PRISM)

---

## ENTIDADES DE LOCALIZAÇÃO E OPERAÇÃO

### Unidade Operacional (Operação)
**No mundo real:** Uma localidade física de estacionamento gerida pela Leve Mobilidade — ex: "Assaí Boa Viagem", "GPA Recife". Possui endereço, cancelas, operadores e sistema de pátio instalado.
**No sistema (tabela/campo):**
- Tabela: `operacoes`
- Campos-chave: `id UUID`, `nome_operacao`, `codigo_operacao` (UNIQUE), `bandeira`, `tipo_operacao`, `cidade`, `uf`, `quantidade_vagas`, `possui_cftv`
- Integração: `cloudpark_ativo`, `cloudpark_filial_codigo`, `token_integracao`, `integracao_faturamento_tipo`, `ultima_sincronizacao`
- Financeiro: `metas_faturamento.operacao_id`, `faturamento_movimentos.operacao_id`
**Relacionamentos:**
- 1:N com `sinistros` (cada sinistro pertence a uma operação)
- 1:N com `faturamento_movimentos` (receitas da operação)
- 1:N com `patrimonios` (ativos alocados)
- 1:N com `colaboradores_operacoes` (equipe da operação)
- N:1 com `usuarios` via `supervisor_id` e `gerente_operacoes_id`
- 1:N com `metas_faturamento` (meta mensal da operação)
- 1:N com `solicitacoes_tarifario` (pedidos de alteração tarifária)
**Quem interage:** `administrador`, `gerente_operacoes` (edição), `supervisor` (leitura da sua operação), `financeiro` (faturamento), `ti` (configuração de integração)

---

### Bandeira (Cliente da Operação)
**No mundo real:** A rede varejista ou instituição cujo estacionamento a Leve opera — Grupo Pão de Açúcar (GPA), Assaí, Carrefour, TriCeplo.
**No sistema (tabela/campo):**
- Campo: `operacoes.bandeira` (ENUM `bandeira_operacao`)
- Valores: `GPA`, `Assaí`, `Carrefour`, `TriCeplo`, `Outros`
**Relacionamentos:**
- N:1 com `operacoes` (uma bandeira pode ter várias operações)
**Quem interage:** `administrador` (cadastro), `gerente_operacoes` (visualização agrupada por bandeira)

---

## ENTIDADES DE PESSOAS

### Usuário do Sistema
**No mundo real:** Colaborador interno da Leve Mobilidade (sede ou campo) com acesso ao ERP.
**No sistema (tabela/campo):**
- Tabela: `usuarios`
- Campos-chave: `id UUID`, `nome`, `email VARCHAR UNIQUE`, `senha_hash`, `perfil` (ENUM), `status`, `ativo`, `gerente_operacoes_id`
- Perfis disponíveis: `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `analista_sinistro`, `financeiro`, `rh`, `dp`, `auditoria`, `ti`, `administrativo`
**Relacionamentos:**
- 1:1 com `colaboradores` via `usuario_id` (opcional — nem todo usuário tem ficha de colaborador)
- 1:N com `sinistros` via `criado_por_id`, `supervisor_id`, `analista_id`
- 1:N com `operacoes` via `supervisor_id`, `gerente_operacoes_id`
- 1:N com `metas_faturamento_tratativas` via `auditor_responsavel_id`
- 1:N com `central_solicitacoes` via `solicitante_id`, `responsavel_id`
- Auto-relacionamento: `gerente_operacoes_id → usuarios.id`
**Quem interage:** `administrador`, `administrativo` (CRUD), todos os perfis (leitura própria)

---

### Colaborador
**No mundo real:** Funcionário ou prestador de serviço vinculado às operações — operadores, líderes, supervisores (registro funcional, separado da conta de sistema).
**No sistema (tabela/campo):**
- Tabela: `colaboradores`
- Campos-chave: `id UUID`, `nome`, `cpf VARCHAR UNIQUE`, `matricula`, `cargo`, `departamento`, `tipo_vinculo` (ENUM: CLT, PJ, Mei, Estágio, Temporário, Terceirizado), `status` (ativo, afastado, ferias, desligado), `data_admissao`, `data_desligamento`, `usuario_id`
- Tabela de vínculo: `colaboradores_operacoes` — `colaborador_id`, `operacao_id`, `funcao_operacao`, `responsavel_principal`, `data_inicio`, `data_fim`
**Relacionamentos:**
- N:M com `operacoes` via `colaboradores_operacoes`
- 0:1 com `usuarios` via `usuario_id` (colaborador pode ou não ter conta no sistema)
**Quem interage:** `administrador`, `rh`, `dp`, `administrativo` (CRUD), `gerente_operacoes`, `supervisor` (leitura)

---

### Supervisor
**No mundo real:** Gestor de campo responsável por uma ou mais unidades. Acompanha operadores, abre sinistros e reporta ocorrências.
**No sistema (tabela/campo):**
- Campo: `usuarios.perfil = 'supervisor'`
- Referenciado em: `operacoes.supervisor_id`, `sinistros.supervisor_id`
- Escopo de dados: vê apenas a operação onde é `supervisor_id`
**Relacionamentos:**
- N:1 com `operacoes` (supervisor de uma operação específica)
- 1:N com `sinistros` (sinistros da sua operação)
- N:1 com `usuarios.gerente_operacoes_id` (reporta ao gerente)
**Quem interage:** Ele mesmo (leitura e criação de sinistros), `gerente_operacoes` (supervisiona), `administrador` (gestão)

---

## ENTIDADES DE SINISTROS

### Sinistro
**No mundo real:** Ocorrência de dano a um veículo dentro do estacionamento — amassado, risco, furto. Resulta em processo de análise e possível pagamento de indenização ao cliente.
**No sistema (tabela/campo):**
- Tabela: `sinistros`
- Campos-chave: `id UUID`, `pr VARCHAR UNIQUE` (ex: `PR-2026-00042`), `protocolo VARCHAR UNIQUE`, `status` (aberto, em_analise, aguardando_documentos, aprovado, reprovado, encerrado), `prioridade` (baixa, media, alta, urgente)
- Cliente: `cliente_nome`, `cliente_cpf`, `cliente_telefone`, `cliente_email`
- Veículo: `veiculo_placa`, `veiculo_modelo`, `veiculo_marca`
- Ocorrência: `data_ocorrencia`, `motivo`, `danos`, `possui_imagens`
- Tratativa: `analista_id`, `data_inicio_analise`, `obs_internas`
- Financeiro: `aprovado_pagamento`, `data_pagamento`, `obs_financeiro`
**Relacionamentos:**
- N:1 com `operacoes` via `operacao_id`
- 1:N com `anexos` (fotos e documentos do sinistro)
- 1:N com `historico_sinistros` (timeline de ações)
- 1:N com `inconsistencias` (divergências identificadas)
- N:1 com `usuarios` via `criado_por_id`, `supervisor_id`, `analista_id`, `gerente_operacoes_id`
**Quem interage:** `supervisor` (abre), `analista_sinistro` (analisa), `financeiro` (aprova pagamento), `diretoria`, `administrador`, `auditoria` (leitura)

---

### Anexo de Sinistro
**No mundo real:** Fotografia de dano, orçamento de conserto, boletim de ocorrência, comprovante de pagamento.
**No sistema (tabela/campo):**
- Tabela: `anexos`
- Campos: `sinistro_id`, `categoria` (imagens_ocorrencia, evidencias_adicionais, orcamento, documentos, comprovantes_financeiros), `nome_arquivo`, `url`, `tipo_mime`, `tamanho`
- Storage: Bucket `sinistros-anexos` no Supabase
**Relacionamentos:**
- N:1 com `sinistros`
- N:1 com `usuarios` (quem fez upload)
**Quem interage:** `supervisor` (upload), `analista_sinistro` (leitura), `financeiro` (comprovantes)

---

### Inconsistência de Sinistro
**No mundo real:** Divergência ou problema identificado durante a análise do sinistro — documentação faltante, informação contraditória, impossibilidade técnica.
**No sistema (tabela/campo):**
- Tabela: `inconsistencias`
- Campos: `sinistro_id`, `descricao`, `status`, `resolvida_em`
**Relacionamentos:**
- N:1 com `sinistros`
**Quem interage:** `analista_sinistro`, `administrador`, `gerente_operacoes`

---

## ENTIDADES DE FATURAMENTO

### Movimento de Faturamento
**No mundo real:** Um ticket de estacionamento pago por um cliente — evento unitário de receita.
**No sistema (tabela/campo):**
- Tabela: `faturamento_movimentos`
- Campos-chave: `id UUID`, `operacao_id`, `ticket_id VARCHAR`, `data_entrada`, `data_saida`, `valor NUMERIC`, `forma_pagamento`, `tipo_movimento` (RECEITA), `origem_sistema`, `integracao_hash`, `payload_original JSONB`
- Constraint UNIQUE: `(operacao_id, ticket_id)` ou `integracao_hash`
**Relacionamentos:**
- N:1 com `operacoes`
**Quem interage:** Agente Windows (escrita), `financeiro`, `diretoria`, `administrador` (leitura)

---

### Resumo Diário de Faturamento
**No mundo real:** O documento de fechamento financeiro do dia de uma unidade — total de receita, breakdown por avulso/mensalista, por forma de pagamento.
**No sistema (tabela/campo):**
- Tabela: `faturamento_resumo_diario`
- Campos: `operacao_id`, `data_referencia`, `total_receita_ajustada`, `total_avulso_ajustado`, `total_mensalista_ajustado`, `resumo_por_forma_pagamento` (JSONB)
- Gerado por: RPC `faturamento_consolidar_dia_v2()`
**Relacionamentos:**
- N:1 com `operacoes`
- Usado por `metas_faturamento_apuracoes_diarias` (base do cálculo de meta)
**Quem interage:** `financeiro`, `diretoria`, `administrador` (leitura)

---

### Meta de Faturamento
**No mundo real:** O objetivo financeiro mensal de cada unidade ou da empresa inteira.
**No sistema (tabela/campo):**
- Tabela: `metas_faturamento`
- Campos: `operacao_id` (NULL = global), `tipo_meta` (operacao/global), `ano`, `mes`, `valor_meta`, `percentual_tolerancia`, `status` (ativa/inativa/cancelada)
- Constraint: UNIQUE `(operacao_id, ano, mes)`
**Relacionamentos:**
- N:1 com `operacoes` (ou NULL para meta global)
- 1:1 com `metas_faturamento_apuracoes` (snapshot mensal)
- 1:N com `metas_faturamento_apuracoes_diarias`
- 1:N com `metas_faturamento_alertas`
**Quem interage:** `financeiro`, `administrador`, `diretoria` (CRUD), todos (leitura)

---

### Alerta de Meta
**No mundo real:** Sinal de que uma operação está em risco de não bater a meta do mês.
**No sistema (tabela/campo):**
- Tabela: `metas_faturamento_alertas`
- Campos: `meta_id`, `operacao_id`, `tipo_alerta`, `criticidade` (baixa/media/alta/critica), `status` (aberto/em_analise/encaminhado_auditoria/concluido/cancelado), `gerado_automaticamente`
**Relacionamentos:**
- N:1 com `metas_faturamento`
- 1:N com `metas_faturamento_tratativas`
**Quem interage:** Sistema (geração automática), `financeiro`, `auditoria`, `administrador` (tratativa)

---

## ENTIDADES DE TARIFÁRIOS E CONVÊNIOS

### Solicitação de Tarifário
**No mundo real:** Pedido formal de criação ou alteração de tabela de preços ou convênio de uma unidade. Requer aprovação da diretoria e execução pelo TI.
**No sistema (tabela/campo):**
- Tabela: `solicitacoes_tarifario`
- Campos: `operacao_id`, `solicitante_id`, `tipo` (cadastro_novo_tarifario, alteracao_tarifario_existente, cadastro_novo_convenio, alteracao_convenio_existente), `data_desejada`, `descricao`, `status` (pendente/aprovado/reprovado/em_execucao/concluido)
- Aprovação: `diretoria_id`, `data_parecer`, `parecer_diretoria`
- Execução: `tecnico_ti_id`, `data_inicio_execucao`, `data_conclusao`, `obs_tecnica`
**Relacionamentos:**
- N:1 com `operacoes`
- N:1 com `usuarios` (solicitante, diretoria aprovadora, técnico TI executor)
- 1:N com `tarifarios_anexos`
- 1:N com `tarifarios_historico`
**Quem interage:** `supervisor`, `gerente_operacoes`, `administrativo` (abertura), `diretoria`, `administrador` (aprovação), `ti` (execução)

---

## ENTIDADES DE PATRIMÔNIO

### Ativo de Patrimônio
**No mundo real:** Um bem físico inventariado da empresa — computador, câmera, cancela, veículo, cadeira, servidor.
**No sistema (tabela/campo):**
- Tabela: `patrimonios`
- Campos: `codigo_patrimonio VARCHAR UNIQUE`, `nome`, `categoria` (TI/Facilities/Operacional/Veículo/Mobiliário/Outros), `status` (Estoque/Ativo/Manutenção/Emprestado/Baixado/Extraviado), `condicao` (Excelente/Bom/Regular/Ruim/Inoperante), `operacao_id`, `responsavel_id`, `valor_compra`, `data_garantia`, `campos_especificos JSONB`
**Relacionamentos:**
- N:1 com `operacoes` (onde o ativo está alocado)
- N:1 com `usuarios` via `responsavel_id`
- 1:N com `patrimonio_movimentacoes`
- 1:N com `patrimonio_manutencoes`
- 1:N com `patrimonio_vistorias`
- 1:N com `patrimonio_alertas`
**Quem interage:** `ti`, `administrador`, `administrativo` (CRUD), `supervisor`, `gerente_operacoes` (leitura)

---

### Categoria de Patrimônio
**No mundo real:** Classificação do tipo de bem — TI, Facilities, Veículos, etc.
**No sistema (tabela/campo):**
- Tabela: `patrimonio_categorias` (evolution_patrimonio_categorias_v1.sql)
- Campos: `nome`, `descricao`, `ativo`, `ordem`, `icone`
**Relacionamentos:**
- 1:N com `patrimonios`
**Quem interage:** `administrador`, `ti` (CRUD)

---

### Movimentação de Patrimônio
**No mundo real:** Transferência de um ativo de uma unidade para outra ou entre responsáveis.
**No sistema (tabela/campo):**
- Tabela: `patrimonio_movimentacoes`
- Campos: `patrimonio_id`, `operacao_origem_id`, `operacao_destino_id`, `motivo`, `data_movimentacao`
**Relacionamentos:**
- N:1 com `patrimonios`
- N:1 com `operacoes` (origem e destino)
**Quem interage:** `ti`, `administrador`, `administrativo`

---

### Manutenção de Patrimônio
**No mundo real:** Serviço de reparo ou revisão de um ativo — preventiva ou corretiva.
**No sistema (tabela/campo):**
- Tabela: `patrimonio_manutencoes`
- Campos: `patrimonio_id`, `tipo` (Preventiva/Corretiva), `prestador`, `custo`, `data_inicio`, `data_conclusao`, `descricao`
**Relacionamentos:**
- N:1 com `patrimonios`
**Quem interage:** `ti`, `administrador`

---

## ENTIDADES DE CENTRAL DE SOLICITAÇÕES (HELPDESK)

### Chamado / Solicitação
**No mundo real:** Um pedido de suporte ou serviço interno aberto por qualquer colaborador — solicitação ao TI, RH, Financeiro ou Operações.
**No sistema (tabela/Campo):**
- Tabela: `central_solicitacoes`
- Campos: `protocolo VARCHAR UNIQUE` (SOL-YYYY-NNNN), `titulo`, `descricao`, `departamento_id`, `categoria_id`, `subcategoria_id`, `solicitante_id`, `operacao_id`, `status_id`, `prioridade_id`, `responsavel_id`
- SLA: `data_abertura`, `data_primeira_resposta`, `data_limite_conclusao`, `data_conclusao`
- Avaliação: `nota_avaliacao` (1–5), `comentario_avaliacao`
**Relacionamentos:**
- N:1 com `central_departamentos`
- N:1 com `central_categorias`
- N:1 com `central_subcategorias`
- N:1 com `operacoes` (opcional)
- N:1 com `usuarios` (solicitante e responsável)
- 1:N com `central_interacoes`
- 1:N com `central_anexos`
- 1:N com `central_campos_valores`
**Quem interage:** Todos os perfis (abertura), `ti`, `rh`, `financeiro`, `administrativo` (atendimento)

---

### Departamento (Helpdesk)
**No mundo real:** Área interna responsável por atender um tipo de solicitação — TI, RH, Financeiro, Operações.
**No sistema (tabela/campo):**
- Tabela: `central_departamentos`
- Campos: `nome`, `descricao`, `ativo`, `ordem`, `icone`, `cor`
- Seeds padrão: TI (azul), RH (rosa), Financeiro (verde), Operações (amarelo)
**Relacionamentos:**
- 1:N com `central_categorias`
- 1:N com `central_departamentos_responsaveis`
- 1:N com `central_solicitacoes`
**Quem interage:** `administrador`, `ti`, `administrativo` (gestão), todos (seleção no formulário)

---

## ENTIDADES DE AUDITORIA

### Log de Auditoria
**No mundo real:** Registro histórico de cada ação relevante feita no sistema — quem fez o quê, quando e com quais dados.
**No sistema (tabela/campo):**
- Tabela: `auditoria_administrativa`
- Campos: `tabela_nome`, `acao` (INSERT/UPDATE/DELETE), `modulo`, `registro_id`, `usuario_id`, `dados_anteriores JSONB`, `dados_novos JSONB`, `ip_address`, `criticidade` (baixa/media/alta/critica), `criado_em`
- Gerado por: Trigger automático `fn_auditoria_global_automatica()` em cada tabela auditada
**Relacionamentos:**
- N:1 com `usuarios` (via `usuario_id`)
- Vinculado a qualquer tabela auditada via `tabela_nome` + `registro_id`
**Quem interage:** `administrador`, `auditoria`, `diretoria` (leitura apenas)

---

### Log de Integração CloudPark
**No mundo real:** Registro de cada lote de dados recebido do agente CloudPark — quantos itens chegaram, quantos foram inseridos, quantos duplicados.
**No sistema (tabela/campo):**
- Tabela: `faturamento_integracao_cloudpark_logs`
- Campos: `operacao_id`, `status` (PROCESSANDO/COMPLETO/ERRO/PARCIAL), `total_recebido`, `total_inserido`, `total_duplicado`
**Relacionamentos:**
- N:1 com `operacoes`
**Quem interage:** `ti`, `administrador` (leitura)

---

### Log de Sincronização do Agente
**No mundo real:** Heartbeat de execução de qualquer agente — confirma que o agente rodou, quantos registros processou e quanto tempo levou.
**No sistema (tabela/campo):**
- Tabela: `faturamento_sincronizacoes`
- Campos: `operacao_id`, `agente_id` (ex: `SENIOR_SYNC`, `API_PERSONAL_RESUMO`, `LOCAL-SCRIPT`), `status` (SUCESSO/ALERTA/ERRO), `registros_processados`, `tempo_execucao_segundos`, `mensagem`
**Relacionamentos:**
- N:1 com `operacoes`
**Quem interage:** `ti`, `administrador` (monitoramento)

---

### Log Control-XRM
**No mundo real:** Registros de execução do ETL que extrai dados do sistema Control-XRM.
**No sistema (tabela/campo):**
- Tabela: `control_xrm_logs`
- Campos: `nivel` (INFO/WARN/ERROR), `etapa` (INICIO/EXTRACAO/TRANSFORMACAO/CARGA/FIM), `status_execucao` (SUCESSO/FALHA/PARCIAL), `mensagem`, `detalhes_json JSONB`
**Relacionamentos:**
- Independente (não vinculado a uma operação específica por linha)
**Quem interage:** `ti`, `administrador`, `auditoria`, `diretoria` (leitura)

---

## ENTIDADES DE CONFIGURAÇÃO E SISTEMA

### Configuração do Sistema
**No mundo real:** Parâmetros de infraestrutura do ERP — credenciais de integração, chaves de API parceiras.
**No sistema (tabela/campo):**
- Tabela: `configuracoes_sistema`
- Campos: `chave VARCHAR UNIQUE`, `valor TEXT`, `categoria` (google_drive, supabase, geral), `descricao`, `e_secreto`
**Relacionamentos:**
- Não relacionada a outras entidades
**Quem interage:** `administrador`, `ti` (CRUD), sistema (leitura em runtime)

---

### Perfil do Sistema
**No mundo real:** Um tipo de usuário com conjunto específico de permissões — Supervisor, TI, Financeiro, etc.
**No sistema (tabela/campo):**
- Tabela: `perfis_sistema`
- Campos: `identificador VARCHAR UNIQUE`, `nome`, `descricao`, `status`, `eh_modelo`, `perfil_base_id` (herança)
- Tabela de permissões: `perfis_permissoes` — `perfil_identificador`, `modulo_identificador`, `pode_ver`, `pode_criar`, `pode_editar`, `pode_deletar`, `escopo`, `operacoes_permitidas UUID[]`
**Relacionamentos:**
- 1:N com `perfis_permissoes`
- N:1 com `usuarios` via campo `perfil`
**Quem interage:** `administrador`, `ti` (gestão da matriz de permissões)

---

### Módulo do Sistema
**No mundo real:** Uma seção funcional do ERP — Sinistros, Faturamento, Patrimônio, etc.
**No sistema (tabela/campo):**
- Tabela: `modulos_sistema`
- Campos: `identificador VARCHAR UNIQUE`, `nome`, `categoria`, `ordem`, `ativo`, `visivel_menu`, `participa_matriz`
**Relacionamentos:**
- N:M com `perfis_sistema` via `perfis_permissoes`
**Quem inteira:** `administrador`, `ti` (configuração de visibilidade e permissões)

---

### Template de Query do Agente
**No mundo real:** O SQL customizado que o agente de cada sistema de pátio deve usar para extrair os dados corretos do banco local.
**No sistema (tabela/campo):**
- Tabela: `faturamento_query_templates`
- Campos: `codigo VARCHAR UNIQUE`, `sistema` (PRESCON, PARCO, PERSONAL, CLOUDPARK), `sql_template TEXT`, `mapping_saida JSONB`, `versao`, `ativo`
- Seeds: `PRESCON_PADRAO`, `PARCO_PADRAO`, `PERSONAL_PADRAO`
**Relacionamentos:**
- N:1 com `operacoes` via `query_template_id`
**Quem interage:** `ti`, `administrador` (configuração)

---

### Automação
**No mundo real:** Um processo automatizado configurável — envio de WhatsApp, alerta por email, relatório periódico.
**No sistema (tabela/campo):**
- Tabela: `automacoes_catalogo`
- Campos: [A PREENCHER — tabela criada mas schema não inspecionado]
- Endpoint: `GET /api/automacoes`
**Relacionamentos:**
- [A PREENCHER]
**Quem interage:** `administrador`, `ti` (configuração), sistema (execução)
