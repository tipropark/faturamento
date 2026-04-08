# Regras de Negócio: Leve ERP (PRISM)

---

## 1. Regras de Acesso e Visibilidade

### RN-001 — Acesso baseado em perfil (RBAC)
Todo acesso a módulos, rotas e operações CRUD é controlado pelo campo `perfil` da tabela `usuarios`. O perfil é emitido no JWT no momento do login e verificado em cada requisição à API. Não há herança de perfis — cada perfil é explicitamente definido.

### RN-002 — Filtragem de menu por perfil
O menu lateral (`Sidebar`) filtra dinamicamente os itens visíveis com base no `perfil` do usuário logado. Itens sem restrição de perfil são visíveis a todos. Itens com `perfis: [...array]` são ocultos para perfis não listados. A filtragem ocorre no client-side, mas as APIs sempre validam novamente no servidor.

### RN-003 — Escopo de dados por hierarquia
- **`supervisor`:** Vê apenas dados (sinistros, colaboradores, operações) vinculados à sua unidade (`supervisor_id = user_id`).
- **`gerente_operacoes`:** Vê dados das operações onde `gerente_operacoes_id = user_id`.
- **`administrador` / `diretoria`:** Visão irrestrita de todos os dados.
- **`financeiro`:** Acesso aos dados financeiros de todas as operações, mas sem acesso a configurações técnicas.

### RN-004 — Rotas públicas do sistema de integração
Os endpoints `/api/integracoes/cloudpark/*`, `/api/control-xrm/*` e `/api/faturamento/importar-movimentos` são **exceções de autenticação de usuário**. Eles validam um Bearer Token de sistema (`CLOUDPARK_API_TOKEN`) independentemente da sessão.

### RN-005 — Sessão expira em 8 horas
Sessões JWT têm `maxAge: 8 * 60 * 60` (8 horas). Após expirar, o usuário é redirecionado para `/login` automaticamente pelo middleware.

---

## 2. Regras do Módulo Operações e Agente Windows

### RN-006 — Token obrigatório para ingresso de dados via agente
**Condição:** Toda requisição do agente CloudPark deve incluir `Authorization: Bearer <CLOUDPARK_API_TOKEN>`.
**Resultado:** Token ausente ou inválido → `401 Não autorizado`. Registro **não** é processado.

### RN-007 — Operação deve estar com integração ativa
**Condição:** O campo `cloudpark_ativo` da operação deve ser `TRUE`.
**Resultado:** `cloudpark_ativo = FALSE` → `403`. Dados ignorados silenciosamente pelo agente.

### RN-008 — Deduplicação obrigatória via hash
**Condição:** Para cada item recebido, um hash SHA-256 é calculado com base em `filial|payday|value|category|payment_method|description`.
**Resultado:** Se o hash já existir em `faturamento_movimentos`, o item é ignorado via `ON CONFLICT DO NOTHING`. Duplicatas nunca são inseridas, mesmo em reenvios por falha de rede.

### RN-009 — Re-consolidação após ingestão
**Condição:** Após cada lote recebido com sucesso, para cada data distinta presente nos itens, a função `faturamento_consolidar_dia_v2(operacao_id, data)` é chamada via RPC.
**Resultado:** O resumo diário é recalculado imediatamente, garantindo que os dashboards de metas reflitam os dados mais recentes.

### RN-010 — Registro de log para todo recebimento
**Condição:** Independente de sucesso ou falha, todo recebimento de dados externos gera um registro em `faturamento_integracao_cloudpark_logs`.
**Resultado:** Status pode ser `PROCESSANDO`, `COMPLETO`, `ERRO` ou `PARCIAL`. Erros incluem mensagem descritiva.

---

## 3. Regras do Módulo Financeiro (Metas e Faturamento)

### RN-011 — Uma meta por operação por período
**Constraint no banco:** `UNIQUE (operacao_id, ano, mes)` na tabela `metas_faturamento`.
**Resultado:** Tentativa de criar segunda meta para a mesma operação no mesmo mês gera erro de conflito. Administrador deve editar a meta existente.

### RN-012 — Meta global exige operacao_id nulo
**Constraint no banco:** `CHECK ((tipo_meta = 'global' AND operacao_id IS NULL) OR (tipo_meta = 'operacao' AND operacao_id IS NOT NULL))`.
**Resultado:** Impossível criar meta global vinculada a uma operação, ou meta por operação sem vinculação.

### RN-013 — Valor da meta não pode ser negativo
**Constraint no banco:** `CHECK (valor_meta >= 0)`.
**Resultado:** INSERT ou UPDATE com `valor_meta < 0` retorna erro de constraint.

### RN-014 — Mês válido entre 1 e 12
**Constraint no banco:** `CHECK (mes BETWEEN 1 AND 12)`.

### RN-015 — Cálculo de meta diária
**Regra:** `meta_diaria = valor_meta / total_dias_do_mes`. O cálculo usa o total de dias corridos do mês, independentemente de dias úteis (exceto quando `considera_dias_semana = TRUE`).

### RN-016 — Status diário da apuração
Comparação entre `realizado_dia` e `meta_diaria_calculada` com **tolerância de 5%**:
- `realizado_dia = 0` → **`sem_dados`**
- `realizado_dia >= meta_diaria * 1.05` → **`acima_da_meta`**
- `realizado_dia >= meta_diaria * 0.95` → **`dentro_da_meta`**
- `realizado_dia < meta_diaria * 0.95` → **`abaixo_da_meta`**

### RN-017 — Status mensal da apuração (ritmo)
Comparação entre `valor_acumulado` e `meta_parcial_esperada` (proporcional ao dia do mês):
- `acumulado >= parcial_esperada` → **`no_ritmo`**
- `acumulado >= parcial_esperada * 0.90` → **`levemente_atrasada`**
- `acumulado >= parcial_esperada * 0.75` → **`em_recuperacao`**
- `acumulado < parcial_esperada * 0.75` → **`critica`**

### RN-018 — Projeção de fechamento mensal
**Cálculo:** `projecao = (acumulado / dias_passados) * total_dias_mes`. Apenas calculada se `dias_passados > 0`.

### RN-019 — Alerta gerado automaticamente
**Condição:** Quando o status calculado é `critica` ou `levemente_atrasada` e ainda não existe alerta aberto para a meta.
**Tipos de alerta:** `nao_atingimento`, `risco_nao_atingimento`, `apuracao_inconclusiva`.
**Criticidade:** `baixa`, `media`, `alta`, `critica` (mapeada ao grau de desvio).

### RN-020 — Fluxo de tratativa de alertas
Um alerta sempre inicia com `status = 'aberto'` e percorre:
`aberto → em_analise → encaminhado_auditoria → concluido | cancelado`

**Quem pode tratar:** `financeiro`, `auditoria`, `administrador`.
**Campos obrigatórios na tratativa:** `categoria_causa`, `descricao_analise`.

### RN-021 — Aprovação financeira de sinistros
**Condição:** Apenas `financeiro`, `diretoria` e `administrador` podem alterar `aprovado_pagamento` e `data_pagamento`.
**Restrição:** Campos financeiros são somente leitura para `supervisor` e `analista_sinistro` (apenas leitura do valor, sem poder de aprovar).

---

## 4. Regras do Módulo Patrimônio

### RN-022 — Campos obrigatórios no cadastro de ativo
| Campo | Tipo | Obrigatório |
|---|---|---|
| `codigo_patrimonio` | VARCHAR(50) UNIQUE | ✅ Sim |
| `nome` | VARCHAR(255) | ✅ Sim |
| `categoria` | ENUM (`TI`, `Facilities`, `Operacional`, `Veículo`, `Mobiliário`, `Outros`) | ✅ Sim |
| `status` | ENUM | ✅ Sim (default: `Estoque`) |
| `operacao_id` | UUID FK | ✅ Sim |
| `responsavel_id` | UUID FK `usuarios` | ❌ Opcional |
| `valor_compra` | NUMERIC | ❌ Opcional |
| `data_garantia` | DATE | ❌ Opcional |

### RN-023 — Código de patrimônio é único no sistema
**Constraint:** `codigo_patrimonio VARCHAR(50) UNIQUE NOT NULL`.
**Resultado:** Tentativa de cadastrar ativo com código duplicado retorna erro 400 com mensagem de conflito.

### RN-024 — Estados possíveis de um ativo e transições
```
Estoque ──► Ativo ──► Manutenção ──► Ativo
                 └──► Emprestado ──► Ativo
                 └──► Baixado (terminal)
                 └──► Extraviado (terminal)
```
Um ativo `Baixado` ou `Extraviado` **não pode ser reativado** — deve-se criar um novo registro se o item for recuperado.

### RN-025 — Condição do ativo
ENUM `condicao_patrimonio`: `Excelente`, `Bom`, `Regular`, `Ruim`, `Inoperante`. Sempre atualizado em cada vistoria registrada em `patrimonio_vistorias`.

### RN-026 — Movimentação exige operação de destino
**Obrigatório:** `operacao_destino_id` (NOT NULL). `operacao_origem_id` é nullable (primeiro registro de alocação pode não ter origem).

### RN-027 — Auditoria automática em todas as operações de patrimônio
Trigger `trg_audit_patrimonios` registra INSERT/UPDATE/DELETE em `auditoria_administrativa` com diff completo via `fn_auditoria_global_automatica()`.

---

## 5. Regras do Módulo Central de Solicitações (Helpdesk)

### RN-028 — Protocolo único gerado por sequência
**Formato:** `SOL-YYYY-NNNN` (ex: `SOL-2026-1042`). Gerado automaticamente via `DEFAULT ('SOL-' || EXTRACT(YEAR FROM NOW()) || '-' || NEXTVAL('central_solicitacoes_protocolo_seq'))`.

### RN-029 — Vinculação de operação é configurável por categoria
O campo `exige_operacao` da tabela `central_categorias` define:
- `'obrigatoria'` → solicitação **deve** informar uma operação.
- `'opcional'` → campo de operação aparece mas não é obrigatório.
- `'dispensada'` → campo de operação não aparece no formulário.

### RN-030 — Campos obrigatórios no formulário de abertura de chamado
- `titulo` (VARCHAR 255, NOT NULL)
- `descricao` (TEXT, NOT NULL)
- `departamento_id` (NOT NULL — Step 1 do Wizard)
- `categoria_id` (NOT NULL — Step 2 do Wizard)
- `status_id` (NOT NULL — preenchido automaticamente com `'novo'`)
- `prioridade_id` (NOT NULL — padrão `'normal'` se não informado)

### RN-031 — Status `finaliza_solicitacao` bloqueia reabertura
**Regra:** Status com `finaliza_solicitacao = TRUE` (`Concluído`, `Cancelado`) marcam o chamado como encerrado. Somente `administrador` ou responsável do departamento pode reabrir.

### RN-032 — SLA calculado pela categoria
**Regra:** `data_limite_primeira_resposta = data_abertura + sla_primeira_resposta_horas` e `data_limite_conclusao = data_abertura + sla_conclusao_horas` (configurados por categoria em horas).

### RN-033 — Avaliação restrita ao solicitante
**Regra:** `nota_avaliacao` (1 a 5) e `comentario_avaliacao` só podem ser preenchidos pelo `solicitante_id` após o chamado atingir status `finaliza_solicitacao = TRUE`.
**Constraint no banco:** `CHECK (nota_avaliacao >= 1 AND nota_avaliacao <= 5)`.

### RN-034 — Departamentos e categorias visíveis apenas se ativos
**Filtro:** A API `/api/central-solicitacoes/config` retorna apenas registros onde `ativo = TRUE`. Departamentos ou categorias desativados não aparecem no Wizard.

---

## 6. Regras do Módulo Tarifários e Convênios

### RN-035 — Tipos de solicitação tarifário
ENUM `tipo_solicitacao_tarifario`: `cadastro_novo_tarifario`, `alteracao_tarifario_existente`, `cadastro_novo_convenio`, `alteracao_convenio_existente`. **Todos os 4 tipos** são tratados pelo mesmo fluxo de aprovação.

### RN-036 — Fluxo obrigatório de aprovação bidimensional
```
pendente → aprovado (por diretoria/admin)
         └→ reprovado (por diretoria/admin) [terminal]

aprovado → em_execucao (por ti/admin)
         → concluido (por ti/admin) [terminal]
```
**Regra:** TI **não pode** iniciar execução sem aprovação prévia da diretoria. A API verifica o `status` atual antes de aceitar mudança de status.

### RN-037 — Campos de aprovação só editáveis pela diretoria/admin
`diretoria_id`, `data_parecer`, `parecer_diretoria` — preenchidos exclusivamente por `diretoria` ou `administrador`.

### RN-038 — Campos de execução só editáveis por TI/admin
`tecnico_ti_id`, `data_inicio_execucao`, `data_conclusao`, `obs_tecnica` — preenchidos exclusivamente por `ti` ou `administrador`.

### RN-039 — Campos obrigatórios na abertura
- `operacao_id` (NOT NULL)
- `tipo` (ENUM, NOT NULL)
- `data_desejada` (DATE, NOT NULL)
- `descricao` (TEXT, NOT NULL)

---

## 7. Regras de Auditoria e Logs

### RN-040 — Auditoria automática por trigger em tabelas críticas
O sistema instala automaticamente um trigger `AFTER INSERT OR UPDATE OR DELETE` em qualquer tabela registrada via `CALL sp_ativar_auditoria_tabela('<tabela>')`.

**Tabelas com auditoria ativa:**
`usuarios`, `operacoes`, `sinistros`, `anexos`, `inconsistencias`, `solicitacoes_tarifario`, `tarifarios_anexos`, `configuracoes_sistema`, `perfis_sistema`, `perfis_permissoes`, `patrimonios`, `patrimonio_movimentacoes`, `patrimonio_manutencoes`, `colaboradores`, `faturamento_movimentos`, `metas_faturamento`, `metas_faturamento_alertas`, `metas_faturamento_tratativas`.

### RN-041 — Dados capturados em cada evento de auditoria
- **INSERT:** `dados_novos = to_jsonb(NEW)`
- **UPDATE:** `dados_anteriores = to_jsonb(OLD)`, `dados_novos = to_jsonb(NEW)`. **Não grava log se dados forem idênticos.**
- **DELETE:** `dados_anteriores = to_jsonb(OLD)`

### RN-042 — Criticidade dos eventos de auditoria
- **DELETE** → sempre `'alta'`
- **INSERT / UPDATE** → `'media'`
- **Acesso negado (403)** → `'alta'` (registrado pelo `withAudit()`)
- **Erro crítico de API** → `'critica'` (registrado pelo `withAudit()`)

### RN-043 — Quem pode visualizar logs de auditoria
- **`auditoria_administrativa`:** `administrador`, `auditoria`, `diretoria`.
- **`control_xrm_logs`:** Via RLS explícita: `administrador`, `auditoria`, `diretoria`, `ti`.
- **Logs de configurações:** Exibidos na aba de auditoria em `/admin/configuracoes` (mesmos perfis da auditoria geral).

### RN-044 — Retenção de logs
Não há política de retenção automática implementada atualmente. Todos os logs são mantidos indefinidamente. **Ponto de atenção:** `control_xrm_logs` pode crescer rapidamente em produção sem archiving.

### RN-045 — Identificação do usuário nos logs automáticos
A função `fn_auditoria_global_automatica()` obtém o ID do usuário via `COALESCE(current_setting('audit.current_user_id', true)::UUID, auth.uid())`. O contexto `audit.current_user_id` deve ser configurado via `SET LOCAL` pelo backend antes de cada operação relevante.

---

## 8. Regras de Cadastro de Usuários

### RN-046 — Apenas admin e administrativo criam usuários
**Validação na API:** `POST /api/usuarios` verifica se o perfil do solicitante é `administrador` ou `administrativo`. Outros perfis recebem `403 Sem permissão`.

### RN-047 — Email deve ser único por usuário
**Constraint no banco:** `email VARCHAR(255) UNIQUE NOT NULL`.
**Resultado:** Tentativa de criar conta com email já existente retorna erro de conflito do banco.

### RN-048 — Senha nunca armazenada em texto puro
**Regra obrigatória:** Toda senha é hasheada com `bcrypt.hash(senha, 10)` antes do INSERT. O campo `senha_hash` **nunca** armazena texto puro.

### RN-049 — Senha temporária sem validação de força
**Limitação atual:** A API `/api/usuarios` não valida complexidade de senha (tamanho mínimo, caracteres especiais). TI deve seguir política interna ao criar senhas.

### RN-050 — Usuário criado com status ativo por padrão
**Padrão:** `{ status: 'ativo', ativo: true }` no INSERT. Não há processo de aprovação ou confirmação de email.

### RN-051 — Dois mecanismos de desativação
1. `ativo = false` → bloqueio imediato no próximo login (verificado no `authorize()`).
2. `status = 'inativo'` → bloqueio equivalente.
**Sessões ativas permanecem válidas** até o JWT expirar (máximo 8h).

### RN-052 — Não há auto-registro público
**Regra de design:** O sistema não expõe página de cadastro pública. Toda criação de conta é feita pelo TI/Administrativo via painel interno.

### RN-053 — Não há recuperação automática de senha
**Limitação atual:** Não há fluxo de `forgot password` ou reset por email. Recuperação é feita manualmente pelo TI via painel do Supabase ou atualização direta do `senha_hash`.

---

## 9. Validações de Formulários

### Formulário: Novo Sinistro (`/sinistros/novo`)
| Campo | Validação | Mensagem de erro |
|---|---|---|
| `operacao_id` | Obrigatório, UUID válido | "Selecione uma operação" |
| `cliente_nome` | Obrigatório, VARCHAR(255) | "Nome do cliente é obrigatório" |
| `cliente_cpf` | Obrigatório, VARCHAR(14) | "CPF é obrigatório" |
| `cliente_telefone` | Obrigatório, VARCHAR(20) | "Telefone é obrigatório" |
| `veiculo_placa` | Obrigatório, VARCHAR(10) | "Placa do veículo é obrigatória" |
| `veiculo_modelo` | Obrigatório | "Modelo é obrigatório" |
| `veiculo_marca` | Obrigatório | "Marca é obrigatória" |
| `data_ocorrencia` | Obrigatório, DATE | "Data da ocorrência é obrigatória" |
| `motivo` | Obrigatório, TEXT | "Motivo é obrigatório" |
| `danos` | Obrigatório, TEXT | "Descrição dos danos é obrigatória" |

### Formulário: Nova Solicitação Tarifário (`/tarifarios/novo`)
| Campo | Validação | Mensagem de erro |
|---|---|---|
| `operacao_id` | Obrigatório | "Selecione uma operação" |
| `tipo` | Obrigatório, ENUM | "Selecione o tipo de solicitação" |
| `data_desejada` | Obrigatório, DATE | "Data desejada é obrigatória" |
| `descricao` | Obrigatório, TEXT | "Descrição é obrigatória" |

### Formulário: Cadastro de Meta (`/admin/faturamento/metas`)
| Campo | Validação | Mensagem de erro |
|---|---|---|
| `operacao_id` | Obrigatório para `tipo='operacao'` | "Selecione uma operação" |
| `ano` | Obrigatório, INTEGER > 0 | "Ano é obrigatório" |
| `mes` | Obrigatório, entre 1 e 12 | "Mês inválido" |
| `valor_meta` | Obrigatório, NUMERIC >= 0 | "Valor da meta não pode ser negativo" |
| Unicidade | `(operacao_id, ano, mes)` UNIQUE | "Já existe uma meta para esta operação neste período" |

### Formulário: Cadastro de Patrimônio (`/admin/patrimonio/novo`)
| Campo | Validação | Mensagem de erro |
|---|---|---|
| `codigo_patrimonio` | Obrigatório, UNIQUE | "Código de patrimônio é obrigatório e deve ser único" |
| `nome` | Obrigatório | "Nome do ativo é obrigatório" |
| `categoria` | Obrigatório, ENUM válida | "Selecione uma categoria" |
| `operacao_id` | Obrigatório | "Selecione a operação de custódia" |

### Formulário: Abertura de Chamado (`/central-solicitacoes/nova`)
| Etapa | Campo | Validação |
|---|---|---|
| Step 1 | `departamento_id` | Obrigatório para avançar |
| Step 2 | `categoria_id` | Obrigatório para avançar |
| Step 3 | `subcategoria_id` | Opcional (só exibido se existirem subcategorias) |
| Step 4 | `titulo` | Obrigatório, VARCHAR(255) |
| Step 4 | `descricao` | Obrigatório, TEXT |
| Step 4 | `operacao_id` | Condicional: obrigatório se `exige_operacao = 'obrigatoria'` |
| Step 4 | `prioridade_id` | Padrão `'normal'` se não informado |

### Formulário: Cadastro de Usuário (`/admin/usuarios`)
| Campo | Validação | Mensagem de erro |
|---|---|---|
| `nome` | Obrigatório | "Nome é obrigatório" |
| `email` | Obrigatório, formato de email, UNIQUE | "Email já cadastrado" |
| `senha` | Obrigatório (mínimo não configurado) | "Senha é obrigatória" |
| `perfil` | Obrigatório, ENUM válida | "Selecione um perfil" |

### Formulário: Cadastro de Colaborador (`/admin/colaboradores/novo`)
| Campo | Validação | Mensagem de erro |
|---|---|---|
| `nome` | Obrigatório | "Nome é obrigatório" |
| `cpf` | Obrigatório, UNIQUE | "CPF já cadastrado" |
| `tipo_vinculo` | Obrigatório, ENUM | "Selecione o tipo de vínculo" |
| `data_admissao` | Obrigatório, DATE | "Data de admissão é obrigatória" |
