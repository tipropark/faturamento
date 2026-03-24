# Motor de Alertas e Auditoria de Faturamento

## 1. Objetivo
Implementar um sistema de monitoramento automático de metas e desvios operacionais para o módulo de faturamento do LEVE ERP. O foco é garantir a integridade dos dados, detectar anomalias e permitir uma auditoria proativa e justificada.

## 2. Escopo
- Detecção de anomalias em resumos diários.
- Gestão de score e severidade.
- Fluxo de tratamento de alertas (justificativa, auditoria, descarte).
- Supressão contextual baseada em calendários e feriados.

## 3. Fontes de Dados
- **Tabela Primária:** `faturamento_resumo_diario` (Consolidação oficial).
- **Metas:** `metas_faturamento` (Configuração mensal).
- **Contexto:** `faturamento_operacao_calendario` e `faturamento_feriados`.

## 4. Regras Implementadas (MVP)

| Código | Nome | Critério | Severidade | Score Base |
| :--- | :--- | :--- | :--- | :--- |
| `DIA_ZERADO` | Faturamento Zerado | Valor = 0 em dia operacional | Crítico | 50 |
| `SEQUENCIA_ABAIXO_META` | Seq. Abaixo Meta | 3 dias seguidos < Meta Diária | Alerta | 30 |
| `DESVIO_META_DIARIA` | Desvio Significativo | Desvio > 25% da Meta Diária | Insight | 15 |
| `QUEDA_BRUSCA_HIST` | Queda Brutal | Queda > 35% vs média histórica | Alerta | 25 |

## 5. Critérios de Score e Severidade
- **Insight (Score < 20):** Desvios leves, servem para monitoramento de tendência.
- **Alerta (Score 20-40):** Desvios significativos que requerem atenção da supervisão.
- **Crítico (Score > 40):** Indícios de falha operacional grave ou interrupção de serviço.

## 6. Supressão e Falsos Positivos
O sistema aplica supressão automática nos seguintes casos:
1. **Feriados:** Se a data constar na tabela `faturamento_feriados`.
2. **Dias Não Operacionais:** Se o calendário da unidade indicar que a operação está fechada naquele dia da semana.
3. **Descarte Manual:** Auditor pode marcar o alerta como "Falso Positivo" com justificativa técnica.

## 7. Exemplos Práticos
- **Exemplo 1:** Operação Assai Alcantara fecha aos domingos. O sistema detecta faturamento zero no domingo, mas suprime o alerta consultando o `faturamento_operacao_calendario`.
- **Exemplo 2:** Operação fatura R$ 1.000 (Meta R$ 2.000). Alerta de `DESVIO_META_DIARIA` gerado com score 15.

## 8. Limitações
- Depende da sincronização correta do agente local.
- Resumos devem estar atualizados para que as regras de sequência funcionem.

## 9. Versionamento
- **v1.0 (Março/2026):** Lançamento do Motor Core e UI de auditoria.
