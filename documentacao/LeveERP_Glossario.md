# Glossário — Leve Mobilidade / Leve ERP

---

## OPERACIONAL

### Unidade / Filial
**Categoria:** Operacional
**Definição:** Uma localidade física de estacionamento operada pela Leve Mobilidade. Cada unidade tem sua própria equipe (supervisor, operadores), sistema de pátio local, infraestrutura de cancelas e CFTV. É a entidade geográfica fundamental da empresa.
**Contexto de uso:** No sistema, representa a tabela `operacoes`. Cada dado de faturamento, sinistro e colaborador está vinculado a uma operação. O agente Windows roda dentro da unidade.
**Termos relacionados:** Operação, Bandeira, Supervisor, Agente Windows, Faturamento

---

### Operação
**Categoria:** Operacional
**Definição:** Termo interno da Leve para designar um contrato de gestão de estacionamento em uma localidade específica. Uma operação é a unidade básica de negócio — possui código único, bandeira de cliente, tipo de local, cidade, número de vagas e equipe alocada.
**Contexto de uso:** Tabela `operacoes` no banco de dados. Campo `codigo_operacao` é o identificador único. Usado em todos os módulos: sinistros, faturamento, patrimônio, colaboradores, metas.
**Termos relacionados:** Unidade / Filial, Bandeira, Supervisor, Código de Operação

---

### Bandeira
**Categoria:** Operacional
**Definição:** O cliente/rede varejista ou instituição cujo estacionamento a Leve Mobilidade opera. Uma bandeira pode ter múltiplas operações em diferentes cidades.
**Contexto de uso:** ENUM `bandeira_operacao` no banco: `GPA` (Grupo Pão de Açúcar), `Assaí`, `Carrefour`, `TriCeplo`, `Outros`. Usado como filtro no grid de operações.
**Termos relacionados:** Operação, Tipo de Operação

---

### Tipo de Operação
**Categoria:** Operacional
**Definição:** A natureza do local onde a operação é realizada.
**Contexto de uso:** ENUM `tipo_operacao`: `supermercado`, `shopping`, `hospital`, `predio_comercial`, `estacionamento`, `outro`.
**Termos relacionados:** Operação, Bandeira

---

### Caixa
**Categoria:** Operacional
**Definição:** O ponto de pagamento físico de uma unidade onde o cliente paga o ticket de estacionamento. Pode ser uma cabine com operador ou uma máquina de autoatendimento.
**Contexto de uso:** [A PREENCHER — não há tabela de caixa diretamente no esquema atual; os pagamentos chegam via agente como `faturamento_movimentos`]
**Termos relacionados:** TEF, Ticket, Operador, Forma de Pagamento

---

### Ticket
**Categoria:** Operacional
**Definição:** O comprovante (físico ou digital) emitido para cada veículo que entra no estacionamento. Contém data/hora de entrada, data/hora de saída e valor cobrado. É a unidade atômica de receita.
**Contexto de uso:** Campo `ticket_id` em `faturamento_movimentos`. A chave de deduplicação `(operacao_id, ticket_id)` garante que o mesmo ticket não seja contado duas vezes.
**Termos relacionados:** Faturamento, Movimento, Forma de Pagamento, Ticket Avulso, Mensalista

---

### Ticket Avulso
**Categoria:** Operacional / Financeiro
**Definição:** Pagamento do estacionamento por rotatividade — clientes que não têm mensalidade. É o tipo mais comum de receita.
**Contexto de uso:** Campo `tipo_movimento = 'Avulso'` nos movimentos. Agregado em `total_avulso_ajustado` no resumo diário.
**Termos relacionados:** Ticket, Mensalista, Receita Diária, Forma de Pagamento

---

### Mensalista
**Categoria:** Operacional / Financeiro
**Definição:** Cliente com contrato mensal de uso do estacionamento. Paga uma mensalidade fixa, diferente do avulso que paga por rotatividade.
**Contexto de uso:** `tipo_movimento = 'Mensalista'` nos movimentos; agregado em `total_mensalista_ajustado` no resumo diário.
**Termos relacionados:** Ticket Avulso, Receita Diária, Convênio

---

### Convênio
**Categoria:** Operacional / Financeiro
**Definição:** Acordo comercial entre a Leve Mobilidade e uma empresa ou instituição que concede desconto ou isenção de cobrança para portadores de credencial do conveniado (funcionários, clientes).
**Contexto de uso:** Módulo "Tarifários e Convênios". Tabela `solicitacoes_tarifario` com `tipo = 'cadastro_novo_convenio'`.
**Termos relacionados:** Tarifário, Desconto, Ticket Avulso

---

### Tarifário
**Categoria:** Operacional
**Definição:** Tabela de preços de uma operação — define o valor cobrado por frações de hora, valor máximo diário e outras categorias de cobrança.
**Contexto de uso:** Módulo dedicado com tabela `solicitacoes_tarifario`. Alterações de tarifário requerem aprovação da Diretoria e execução pelo TI.
**Termos relacionados:** Convênio, Solicitação Tarifário, Aprovação de Tarifário

---

### Receita Diária
**Categoria:** Financeiro / Operacional
**Definição:** O total de valores cobrados a clientes em uma unidade dentro de um dia específico. Compõe a base de comparação com a meta mensal.
**Contexto de uso:** Tabela `faturamento_resumo_diario` com campos `total_receita_ajustada`, `total_avulso_ajustado`, `total_mensalista_ajustado`. Calculada automaticamente pela função `faturamento_consolidar_dia_v2()`.
**Termos relacionados:** Faturamento, Meta, Movimento, Consolidação

---

### Faturamento
**Categoria:** Financeiro / Operacional
**Definição:** O conjunto de receitas coletadas por uma ou mais operações em um período. No sistema, faturamento abrange tanto os movimentos brutos (tickets individuais) quanto os resumos consolidados por dia e por mês.
**Contexto de uso:** Módulo principal com tabelas `faturamento_movimentos`, `faturamento_resumo_diario`, `faturamento_resumo_importado`. Acessado em `/admin/faturamento`.
**Termos relacionados:** Receita Diária, Meta de Faturamento, Movimento, Consolidação, Agente Windows

---

### Movimento de Faturamento
**Categoria:** Financeiro / Operacional
**Definição:** Registro individual de uma transação financeira (entrada de dinheiro) de uma operação em um momento específico. Corresponde a um ticket pago.
**Contexto de uso:** Tabela `faturamento_movimentos` com campos: `ticket_id`, `data_entrada`, `data_saida`, `valor`, `forma_pagamento`, `tipo_movimento`.
**Termos relacionados:** Ticket, Receita Diária, Agente Windows, Deduplicação

---

### Forma de Pagamento
**Categoria:** Operacional / Financeiro
**Definição:** O meio utilizado pelo cliente para pagar o ticket: dinheiro, cartão de crédito, cartão de débito, PIX, convênio ou outros.
**Contexto de uso:** Campo `forma_pagamento` em `faturamento_movimentos`. Valores mapeados pelo agente do sistema local: `DINHEIRO`, `PIX`, `CARTAO - MASTERCARD`, `CONVENIO`, etc.
**Termos relacionados:** TEF, Ticket, Faturamento

---

### TEF (Terminal de Pagamento Eletrônico)
**Categoria:** Operacional / Tecnológico
**Definição:** Dispositivo físico (máquina de cartão) conectado ao sistema de pátio que processa pagamentos por cartão de crédito/débito e PIX nas cabines de pagamento.
**Contexto de uso:** Indiretamente monitorado via volume de `forma_pagamento` nos movimentos de faturamento. Não há módulo dedicado no ERP atual — falhas são detectadas por queda de volume de pagamentos eletrônicos.
**Termos relacionados:** Forma de Pagamento, Caixa, Faturamento

---

### CFTV
**Categoria:** Operacional / Patrimônio
**Definição:** Sistema de Circuito Fechado de TV — câmeras de segurança das unidades. Campo `possui_cftv` na tabela `operacoes` indica se a unidade possui esse recurso, relevante para documentação de sinistros.
**Contexto de uso:** Campo `possui_cftv BOOLEAN` em `operacoes`. Influencia a capacidade de coletar evidências em sinistros.
**Termos relacionados:** Sinistro, Operação, Evidências

---

### Sinistro
**Categoria:** Operacional / Jurídico
**Definição:** Ocorrência de dano a veículo dentro da área de estacionamento operada pela Leve Mobilidade. Pode incluir amassados, riscos, furtos ou outros danos reclamados pelo cliente. Gera um processo formal de análise e possível pagamento de indenização.
**Contexto de uso:** Tabela `sinistros` com campos de cliente (nome, CPF, telefone), veículo (placa, modelo, marca), ocorrência (data, danos) e tratativa financeira.
**Termos relacionados:** PR (Processo de Risco), Protocolo de Sinistro, Analista de Sinistro, CFTV, Indenização

---

### PR (Processo de Risco)
**Categoria:** Operacional / Jurídico
**Definição:** Número identificador único de um sinistro no sistema. Gerado automaticamente no formato `PR-YYYY-NNNNN`.
**Contexto de uso:** Campo `pr` na tabela `sinistros`. Exemplo: `PR-2026-00123`. Serve como referência oficial em comunicações com o cliente.
**Termos relacionados:** Sinistro, Protocolo

---

### Protocolo de Sinistro
**Categoria:** Operacional / Jurídico
**Definição:** Segundo identificador de um sinistro, distinto do PR. Pode ser gerado externamente ou seguir outra numeração.
**Contexto de uso:** Campo `protocolo VARCHAR(50) UNIQUE` na tabela `sinistros`.
**Termos relacionados:** PR, Sinistro

---

### Protocolo de Solicitação (SOL)
**Categoria:** Operacional
**Definição:** Número identificador de um chamado aberto na Central de Solicitações (Helpdesk interno). Formato: `SOL-YYYY-NNNN`.
**Contexto de uso:** Campo `protocolo` na tabela `central_solicitacoes`. Gerado via sequência `central_solicitacoes_protocolo_seq`.
**Termos relacionados:** Central de Solicitações, Chamado, SLA

---

### Supervisor
**Categoria:** Pessoas / Operacional
**Definição:** Responsável direto por uma operação de estacionamento. É o ponto de contato da equipe de campo com a sede. Abre sinistros, acompanha operadores e reporta ocorrências.
**Contexto de uso:** Perfil `supervisor` na tabela `usuarios`. Campo `supervisor_id` em `operacoes` e `sinistros`. Vê apenas dados da sua própria operação (escopo filtrado por RLS).
**Termos relacionados:** Operação, Operador, Gerente de Operações, RLS

---

### Operador
**Categoria:** Pessoas / Operacional
**Definição:** Funcionário da unidade que trabalha no caixa ou na cancela do estacionamento. Nível mais base da hierarquia operacional de campo.
**Contexto de uso:** Registrado na tabela `colaboradores` com `cargo = 'Operador'`. Pode ter vínculo CLT, PJ ou Temporário.
**Termos relacionados:** Colaborador, Supervisor, Turno, Caixa

---

### Turno
**Categoria:** Operacional
**Definição:** Período de trabalho de um colaborador na unidade (ex: turno da manhã, tarde, noite). [A PREENCHER — não há tabela de turnos implementada no sistema atual]
**Contexto de uso:** [A PREENCHER]
**Termos relacionados:** Colaborador, Operador, Escala

---

### Vaga
**Categoria:** Operacional
**Definição:** Espaço físico para estacionamento de um veículo. O número total de vagas é um dado cadastral da operação.
**Contexto de uso:** Campo `quantidade_vagas INTEGER` na tabela `operacoes`. Também há campos para vagas de moto em evoluções posteriores do schema.
**Termos relacionados:** Operação, Cancela

---

### Cancela
**Categoria:** Operacional / Patrimônio
**Definição:** Barreira física (cancela ou portão) que controla a entrada e saída de veículos em uma unidade. É um ativo de patrimônio monitorado.
**Contexto de uso:** Campo `quantidade_cancelas_entrada` / `quantidade_cancelas_saida` nas evoluções da tabela `operacoes`. Registrada como ativo em `patrimonios`.
**Termos relacionados:** Operação, Patrimônio, CFTV

---

## FINANCEIRO

### Meta de Faturamento
**Categoria:** Financeiro
**Definição:** O valor alvo de receita que uma operação (ou o conjunto global) deve atingir em um mês específico. Definida pela diretoria/gestão financeira mensalmente.
**Contexto de uso:** Tabela `metas_faturamento` com campos `valor_meta`, `ano`, `mes`, `tipo_meta` (`operacao` ou `global`). Constraint UNIQUE impede dupla meta para mesma operação no mesmo período.
**Termos relacionados:** Apuração de Meta, Alerta de Meta, Ritmo, Desvio

---

### Apuração de Meta
**Categoria:** Financeiro
**Definição:** O processo de comparar o faturamento realizado com a meta definida para calcular o percentual de atingimento, status de ritmo e projeção de fechamento.
**Contexto de uso:** Tabelas `metas_faturamento_apuracoes` (consolidado mensal) e `metas_faturamento_apuracoes_diarias` (dia a dia). Calculado pela função `reprocessar_metas_diarias()`.
**Termos relacionados:** Meta de Faturamento, Ritmo, Projeção, Percentual de Atingimento

---

### Ritmo
**Categoria:** Financeiro
**Definição:** Indicador que compara o faturamento acumulado até o dia de hoje com a meta parcial esperada proporcionalmente ao período decorrido do mês. Representa "se continuar nesse ritmo, fechará acima ou abaixo da meta?".
**Contexto de uso:** Campo `status_apuracao` em `metas_faturamento_apuracoes`: `no_ritmo`, `levemente_atrasada`, `em_recuperacao`, `critica`.
**Termos relacionados:** Meta de Faturamento, Apuração de Meta, Alerta de Meta

---

### Projeção de Fechamento
**Categoria:** Financeiro
**Definição:** Estimativa do faturamento total ao fim do mês, calculada com base na média diária realizada até o momento: `(acumulado / dias_passados) × total_dias_mês`.
**Contexto de uso:** Campo `valor_projetado` em `metas_faturamento_apuracoes`. Exibido no gráfico de linha da tela de detalhe de meta.
**Termos relacionados:** Meta de Faturamento, Ritmo, Apuração de Meta

---

### Alerta de Meta
**Categoria:** Financeiro
**Definição:** Notificação gerada automaticamente quando uma operação está em ritmo `critica` ou `levemente_atrasada` em relação à sua meta do mês. Requer análise e tratativa pela equipe financeira.
**Contexto de uso:** Tabela `metas_faturamento_alertas`. Tipos: `nao_atingimento`, `risco_nao_atingimento`, `apuracao_inconclusiva`. Criticidade: `baixa`, `media`, `alta`, `critica`.
**Termos relacionados:** Meta de Faturamento, Ritmo, Tratativa de Alerta, Causa Raiz

---

### Tratativa de Alerta
**Categoria:** Financeiro
**Definição:** O processo formal de investigação de um alerta de meta: identificação de causa raiz, registro de ação corretiva e conclusão da análise.
**Contexto de uso:** Tabela `metas_faturamento_tratativas` com campos `categoria_causa`, `descricao_analise`, `causa_raiz`, `acao_corretiva`, `parecer_final`.
**Termos relacionados:** Alerta de Meta, Causa Raiz, Financeiro

---

### Causa Raiz
**Categoria:** Financeiro
**Definição:** A razão identificada para o não-atingimento ou risco de não-atingimento de uma meta. Categorias padronizadas: `queda_movimento`, `despesa_elevada`, `falha_sincronizacao`, `inconsistencia_dados`, `erro_operacional`, `outros`.
**Contexto de uso:** Campo `categoria_causa` em `metas_faturamento_tratativas`.
**Termos relacionados:** Tratativa de Alerta, Alerta de Meta

---

### Conciliação
**Categoria:** Financeiro
**Definição:** Processo de conferir se os dados de faturamento recebidos pelo ERP (via agente) correspondem ao que o sistema de pátio registrou localmente. [A PREENCHER — não há módulo formal de conciliação implementado]
**Contexto de uso:** [A PREENCHER]
**Termos relacionados:** Faturamento, Agente Windows, Fechamento de Caixa

---

### Fechamento de Caixa
**Categoria:** Financeiro / Operacional
**Definição:** O processo de encerramento das movimentações financeiras do dia em uma unidade, totalizando receitas por forma de pagamento para conferência.
**Contexto de uso:** [A PREENCHER — dados chegam consolidados no `faturamento_resumo_diario`; não há módulo dedicado de fechamento de caixa]
**Termos relacionados:** Receita Diária, Caixa, Faturamento, Consolidação

---

### Consolidação
**Categoria:** Financeiro / Técnico
**Definição:** O processo automático que agrupa todos os movimentos individuais de tickets de um dia e de uma operação em um único registro de resumo diário. Executado pela função RPC `faturamento_consolidar_dia_v2()`.
**Contexto de uso:** Tabela `faturamento_resumo_diario`. Executado automaticamente após cada ingestão de dados pelo agente.
**Termos relacionados:** Faturamento, Receita Diária, Agente Windows

---

### Inadimplência
**Categoria:** Financeiro
**Definição:** [A PREENCHER — não há módulo de inadimplência implementado no sistema atual]
**Contexto de uso:** [A PREENCHER]
**Termos relacionados:** Mensalista, Receita Diária

---

### Repasse
**Categoria:** Financeiro
**Definição:** [A PREENCHER — não há módulo de repasse financeiro para clientes (bandeiras) implementado]
**Contexto de uso:** [A PREENCHER]
**Termos relacionados:** Bandeira, Faturamento, Conciliação

---

### Ajuste de Faturamento
**Categoria:** Financeiro
**Definição:** Correção manual aplicada ao valor consolidado de faturamento de um dia/operação para refletir deduções, estornos ou correções de dados.
**Contexto de uso:** Tabela acessada via `/api/faturamento/ajustes`. Campos `total_receita_ajustada`, `total_avulso_ajustado`, `total_mensalista_ajustado` no resumo diário já incorporam esses ajustes.
**Termos relacionados:** Faturamento, Consolidação, Movimento de Faturamento

---

### SLA (Service Level Agreement)
**Categoria:** Operacional / Tecnológico
**Definição:** Prazo acordado para resposta e resolução de chamados na Central de Solicitações. Definido por categoria de solicitação.
**Contexto de uso:** Campos `sla_primeira_resposta_horas` e `sla_conclusao_horas` na tabela `central_categorias`. Calculados como `data_abertura + sLA_horas`.
**Termos relacionados:** Central de Solicitações, Chamado, Prioridade

---

## TECNOLÓGICO

### PRISM / Portal do TI
**Categoria:** Tecnológico
**Definição:** Nomes internos do Leve ERP — "PRISM" é o codinome do projeto, "Portal do TI" é como os usuários operacionais o chamam. O sistema é acessado em `dashboard.levemobilidade.com.br`.
**Contexto de uso:** Usado em comunicações internas. No código, aparece como `leve-erp` (nome do projeto npm).
**Termos relacionados:** Leve ERP, Dashboard

---

### Agente Windows
**Categoria:** Tecnológico
**Definição:** Script (Python ou executável) instalado localmente nas máquinas das unidades operacionais que extrai dados do sistema de pátio local e os envia ao Leve ERP via HTTPS. Opera de forma autônoma e periódica (agendado via Windows Task Scheduler).
**Contexto de uso:** Referenciado como `agente_id` nos logs. Endpoints: `/api/integracoes/cloudpark/receber-movimentos`, `/api/faturamento/importar-movimentos`, `/api/faturamento/importar-resumo-personal`.
**Termos relacionados:** Sistema de Pátio, CloudPark, Senior, Personal, Control-XRM, Faturamento, token_integracao

---

### Sistema de Pátio
**Categoria:** Tecnológico
**Definição:** Software de gestão de estacionamento instalado localmente em cada unidade. Controla tickets, cancelas, formas de pagamento e emite relatórios. Diferentes unidades podem usar sistemas distintos.
**Contexto de uso:** Identificado pelo campo `automacao_sistema` em `operacoes`. Sistemas conhecidos: CloudPark, Senior, Personal, Prescon, Parco, Control-XRM.
**Termos relacionados:** Agente Windows, CloudPark, Senior, Personal, Prescon, Parco

---

### CloudPark
**Categoria:** Tecnológico
**Definição:** Sistema de pátio usado por algumas unidades da Leve. Integrado ao ERP via agente com Bearer Token global (`CLOUDPARK_API_TOKEN`). O agente lê os tickets do banco local e os envia com hash SHA-256 para deduplicação.
**Contexto de uso:** Identificador: `cloudpark` em `integracao_faturamento_tipo`. Logs em `faturamento_integracao_cloudpark_logs`. Template de query `CLOUDPARK_PADRAO` na tabela `faturamento_query_templates`.
**Termos relacionados:** Agente Windows, CLOUDPARK_API_TOKEN, Sistema de Pátio

---

### Senior
**Categoria:** Tecnológico
**Definição:** Sistema de pátio usado por algumas unidades da Leve. Integração via `POST /api/faturamento/importar-movimentos` com autenticação por `token_integracao` por operação.
**Contexto de uso:** Identificado por `agente_id = 'SENIOR_SYNC'` nos logs de sincronização.
**Termos relacionados:** Agente Windows, Sistema de Pátio, token_integracao

---

### Personal (Sistema de Pátio)
**Categoria:** Tecnológico
**Definição:** Sistema de pátio com banco Firebird. Diferente dos outros sistemas, o Personal não exporta tickets individuais — apenas totalizadores diários. Usa uma integração específica de "resumo diário".
**Contexto de uso:** `faturamento_modo_integracao = 'personal_resumo_diario'` em `operacoes`. Endpoint dedicado: `/api/faturamento/importar-resumo-personal`. Template SQL personalizado para Firebird incluído em `faturamento_query_templates`.
**Termos relacionados:** Agente Windows, Sistema de Pátio, Resumo Diário

---

### Control-XRM
**Categoria:** Tecnológico
**Definição:** Sistema legado de gestão de estacionamentos, integrado via ETL (script separado que conecta ao SQL Server local). Possui logs de execução dedicados visíveis no hub "Tecnologia & IA".
**Contexto de uso:** Tabela `control_xrm_logs` com etapas: `INICIO`, `EXTRACAO`, `TRANSFORMACAO`, `CARGA`, `FIM`.
**Termos relacionados:** Agente Windows, Sistema de Pátio, ETL

---

### Prescon / Parco
**Categoria:** Tecnológico
**Definição:** Outros sistemas de pátio com templates de query registrados no sistema. Representam futuras integrações ou unidades em fase de onboarding.
**Contexto de uso:** Templates `PRESCON_PADRAO` e `PARCO_PADRAO` na tabela `faturamento_query_templates`.
**Termos relacionados:** Sistema de Pátio, Agente Windows, faturamento_query_templates

---

### RLS (Row Level Security)
**Categoria:** Tecnológico
**Definição:** Recurso do PostgreSQL que restringe quais linhas de uma tabela um usuário pode ver ou modificar, com base em políticas definidas no banco. Funciona como uma segunda camada de segurança além da validação na API.
**Contexto de uso:** Habilitado em `sinistros`, `anexos`, `historico_sinistros`, `inconsistencias`, `control_xrm_logs`. Políticas baseadas em `fn_get_current_user_perfil()` e `fn_get_current_user_id()`.
**Termos relacionados:** Role, Política de Segurança, Supabase, audit.current_user_id

---

### Supabase
**Categoria:** Tecnológico
**Definição:** Plataforma Backend-as-a-Service (BaaS) baseada em PostgreSQL usada como infraestrutura de banco de dados, storage de arquivos e execução de funções do Leve ERP. Projeto hospedado em `ckgqmgclopqomctgvhbq.supabase.co`.
**Contexto de uso:** Toda persistência de dados do sistema passa pelo Supabase. Acessado via `@supabase/supabase-js` no Next.js.
**Termos relacionados:** PostgreSQL, RLS, Service Role Key, Edge Function, Storage

---

### Service Role Key
**Categoria:** Tecnológico
**Definição:** Chave de acesso privilegiado ao Supabase que bypassa o Row Level Security. Usada exclusivamente no servidor Next.js (`createAdminClient()`) para operações que precisam de visão total dos dados. **Nunca deve ser exposta ao browser.**
**Contexto de uso:** Variável de ambiente `SUPABASE_SERVICE_ROLE_KEY`. Usada em todas as API Routes do ERP.
**Termos relacionados:** Supabase, RLS, NEXT_PUBLIC_SUPABASE_ANON_KEY

---

### Anon Key
**Categoria:** Tecnológico
**Definição:** Chave pública do Supabase com acesso limitado pelo RLS. É a `NEXT_PUBLIC_SUPABASE_ANON_KEY` — pode ser exposta ao browser pois o RLS filtra os dados.
**Contexto de uso:** Variável pública no `.env.local`. Usada raramente no projeto — a maioria das operações usa a Service Role Key via API Route.
**Termos relacionados:** Supabase, Service Role Key, RLS

---

### Edge Function
**Categoria:** Tecnológico
**Definição:** Funções serverless executadas na infraestrutura do Supabase, mais próximas do banco de dados. Permitem lógica de negócio no lado do servidor sem passar pelo Next.js.
**Contexto de uso:** **Não utilizadas no projeto atual.** Toda lógica de negócio é executada via Next.js API Routes.
**Termos relacionados:** Supabase, API Route

---

### API Route
**Categoria:** Tecnológico
**Definição:** Endpoint HTTP do Leve ERP implementado como arquivo `route.ts` no Next.js App Router. Funciona como backend seguro para todas as operações de dados — o browser nunca acessa o Supabase diretamente.
**Contexto de uso:** Pasta `src/app/api/`. Exemplos: `/api/sinistros`, `/api/faturamento`, `/api/operacoes`.
**Termos relacionados:** Edge Function, Next.js, Service Role Key

---

### token_integracao
**Categoria:** Tecnológico
**Definição:** Token de autenticação único por operação, usado pelos agentes Windows (Senior, Personal) para se identificar ao enviar dados via API. Diferente do `CLOUDPARK_API_TOKEN` que é global.
**Contexto de uso:** Campo `token_integracao` na tabela `operacoes`. Verificado como `eq('token_integracao', token)` na validação de cada requisição do agente.
**Termos relacionados:** Agente Windows, CLOUDPARK_API_TOKEN, Autenticação

---

### integracao_hash
**Categoria:** Técnico
**Definição:** Hash SHA-256 calculado pelo agente CloudPark para cada movimento, com base em `filial|payday|value|category|payment_method|description`. Garante que o mesmo ticket não seja inserido duas vezes.
**Contexto de uso:** Campo `integracao_hash` em `faturamento_movimentos`. Constraint UNIQUE previne duplicatas idempotentemente.
**Termos relacionados:** CloudPark, Deduplicação, Agente Windows

---

### AUTH_SECRET
**Categoria:** Técnico
**Definição:** Chave criptográfica usada pelo NextAuth para assinar e verificar tokens JWT de sessão. Se alterada, todos os usuários são deslogados instantaneamente.
**Contexto de uso:** Variável de ambiente `AUTH_SECRET`. Atualmente com valor fraco em desenvolvimento — deve ser rotacionada em produção.
**Termos relacionados:** JWT, NextAuth, Sessão

---

### JWT (JSON Web Token)
**Categoria:** Técnico
**Definição:** Token de autenticação criptografado emitido pelo NextAuth após login bem-sucedido. Contém `id`, `nome`, `email` e `perfil` do usuário. Validade de 8 horas.
**Contexto de uso:** Armazenado em cookie `httpOnly` no browser. Verificado pelo `auth()` do NextAuth em cada API Route e página protegida.
**Termos relacionados:** AUTH_SECRET, NextAuth, Sessão, Perfil de Acesso

---

### Role / Perfil de Acesso
**Categoria:** Tecnológico / Pessoas
**Definição:** Nível de permissão de um usuário do sistema. Define quais módulos e dados ele pode ver, criar, editar ou excluir.
**Contexto de uso:** Campo `perfil` na tabela `usuarios` (ENUM `perfil_usuario`). Injetado no JWT no login. Verificado em cada API Route e componente do menu.
**Termos relacionados:** RLS, Permissões, Perfis do Sistema, JWT

---

### Auditoria
**Categoria:** Técnico / Compliance
**Definição:** Registro automático de todas as ações realizadas no sistema (INSERT, UPDATE, DELETE) com identificação do usuário, timestamp, IP e diff dos dados alterados. Implementado via triggers PostgreSQL.
**Contexto de uso:** Tabela `auditoria_administrativa`. Trigger `fn_auditoria_global_automatica()`. Ativado por tabela via `sp_ativar_auditoria_tabela()`.
**Termos relacionados:** Criticidade, audit.current_user_id, withAudit()

---

### audit.current_user_id
**Categoria:** Técnico
**Definição:** Variável de sessão PostgreSQL que armazena o UUID do usuário logado. Permite que os triggers de auditoria e as políticas RLS identifiquem quem está executando a operação, mesmo quando o acesso é feito via Service Role Key.
**Contexto de uso:** Configurado via `SET LOCAL audit.current_user_id = '<uuid>'` nas API Routes. Lido por `fn_get_current_user_id()` e `fn_auditoria_global_automatica()`.
**Termos relacionados:** RLS, Auditoria, Service Role Key

---

### Google Drive
**Categoria:** Tecnológico
**Definição:** Serviço de armazenamento de arquivos do Google, integrado ao ERP para upload de documentos do módulo Tarifários. Alternativa ao Supabase Storage para documentos maiores ou que precisam de gestão documental.
**Contexto de uso:** Integração via `googleapis` npm. Credenciais gerenciadas em `/admin/configuracoes`.
**Termos relacionados:** Storage, Tarifários, Google Client ID

---

### Anthropic API / Claude
**Categoria:** Tecnológico
**Definição:** API de IA generativa da Anthropic (modelo Claude), integrada ao hub "Tecnologia & IA" do ERP. Usada para automações e features de inteligência artificial em desenvolvimento.
**Contexto de uso:** Variável `ANTHROPIC_API_KEY` no `.env.local`. Módulo de IA em planejamento.
**Termos relacionados:** Tecnologia & IA, Automações

---

## PESSOAS E ESTRUTURA

### Edvaldo
**Categoria:** Pessoas
**Definição:** Coordenador de TI da Leve Mobilidade. Responsável pela gestão e desenvolvimento do Leve ERP. Principal ponto de contato técnico interno.
**Contexto de uso:** Administrador do sistema. Executora das migrations SQL, responsável por atualizações do sistema.
**Termos relacionados:** TI, Administrador, Coordenador de TI

---

### Samuel
**Categoria:** Pessoas
**Definição:** Assistente de TI da Leve Mobilidade. Suporte à operação e manutenção do sistema.
**Contexto de uso:** Perfil `ti` ou `administrativo` no sistema.
**Termos relacionados:** TI, Assistente de TI

---

### Ivanildo
**Categoria:** Pessoas
**Definição:** Diretor da Leve Mobilidade. Nível executivo máximo da empresa. Aprova estratégias, metas e investimentos.
**Contexto de uso:** Perfil `diretoria` no sistema. Destinatário de relatórios executivos e alertas críticos.
**Termos relacionados:** Diretoria, Aprovação de Tarifário

---

### Iremar / i2 Soluções
**Categoria:** Pessoas
**Definição:** Agência parceira de desenvolvimento responsável por entregas específicas do Leve ERP. Responsável por partes do design e implementação do sistema.
**Contexto de uso:** Colaborador externo que contribui para o desenvolvimento. [A PREENCHER — papel específico no projeto]
**Termos relacionados:** Desenvolvimento, Agência Parceira

---

### Analista de Sinistro
**Categoria:** Pessoas
**Definição:** Usuário interno responsável por analisar e tratar sinistros registrados no sistema. Tem visão global de todos os sinistros e pode atualizar o status e registrar pareceres técnicos.
**Contexto de uso:** Perfil `analista_sinistro`. Visualiza campos `data_inicio_analise`, `obs_internas`, `resultado_final`.
**Termos relacionados:** Sinistro, Analista, Status do Sinistro

---

### Gerente de Operações
**Categoria:** Pessoas
**Definição:** Responsável por um conjunto de operações (unidades). Supervisiona vários supervisores e tem visão agregada das operações sob sua gestão.
**Contexto de uso:** Perfil `gerente_operacoes`. Campo `gerente_operacoes_id` em `operacoes` e `sinistros`. Vê dados filtrados por suas operações (não todas as unidades).
**Termos relacionados:** Supervisor, Operação, RLS

---

### Perfis do Sistema
**Categoria:** Tecnológico / Pessoas
**Definição:** Conjunto de perfis de acesso disponíveis no Leve ERP: `administrador`, `diretoria`, `gerente_operacoes`, `supervisor`, `analista_sinistro`, `financeiro`, `rh`, `dp`, `auditoria`, `ti`, `administrativo`.
**Contexto de uso:** Tabela `perfis_sistema` (evolutiva) e ENUM `perfil_usuario` (legado). Gerenciados em `/admin/permissoes`.
**Termos relacionados:** Role, RLS, Permissões, Matriz de Permissões

---

### Patrimônio
**Categoria:** Operacional / Financeiro
**Definição:** Bens físicos da empresa alocados nas operações: equipamentos de TI (computadores, servidores, câmeras), mobiliário (cadeiras, mesas), veículos, cancelas e outros itens inventariados.
**Contexto de uso:** Tabela `patrimonios` com campos `codigo_patrimonio` (único), `nome`, `categoria`, `status`, `condicao`.
**Termos relacionados:** Ativo, Categorias de Patrimônio, Manutenção de Patrimônio, Vistoria

---

### Colaborador
**Categoria:** Pessoas / Operacional
**Definição:** Funcionário ou prestador de serviço vinculado a uma ou mais operações da Leve Mobilidade. Registro funcional separado da conta de acesso ao sistema.
**Contexto de uso:** Tabela `colaboradores`. Vínculo com operações em `colaboradores_operacoes`. Tipos de vínculo: `CLT`, `PJ`, `Mei`, `Estágio`, `Temporário`, `Terceirizado`.
**Termos relacionados:** Operação, Supervisor, Operador, Usuário do Sistema
