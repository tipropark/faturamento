# Integração Faturamento: Resumo Diário Personal

Este documento descreve o protocolo de integração para envio de resumos diários de faturamento das operações que utilizam o sistema **PERSONAL**. Diferente da integração padrão, este fluxo não requer o envio de movimentos brutos por ticket.

---

## 1. Endpoint
`POST /api/faturamento/importar-resumo-personal`

---

## 2. Autenticação
A autenticação é realizada via Headers obrigatórios:

| Header | Descrição |
| :--- | :--- |
| `x-operacao-id` | UUID da operação no Leve ERP. |
| `x-integration-token` | Token de integração exclusivo da operação. |

> [!IMPORTANT]
> A operação deve estar configurada com `faturamento_modo_integracao = 'personal_resumo_diario'` para aceitar requisições neste endpoint.
## QUERY
## UPDATE operacoes SET faturamento_modo_integracao = 
## 'personal_resumo_diario' WHERE id = 'ID_DA_OPERACAO';
---

## 3. Estrutura do Payload (JSON)

### Campos Principais
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `schema_version` | String | Não | Versão do schema (padrão: `1.0.0`) |
| `agent_version` | String | Não | Versão do agente local executando a coleta |
| `integration_type` | String | Sim | Deve ser fixo: `personal_resumo_diario` |
| `data_referencia` | String | Sim | Data do faturamento (Formato: `YYYY-MM-DD`) |
| `resumo` | Object | Sim | Bloco com totais financeiros agregados |
| `resumo_por_forma_pagamento` | Object | Não | Detalhamento por forma de pagamento |
| `resumo_por_tipo` | Object | Não | Detalhamento por tipo (AVULSO, MENSALISTA, etc) |
| `metadata` | Object | Não | Informações de rastreabilidade (hostname, hash) |

### Bloco `resumo`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `total_receita_original` | Numeric | Soma total bruta de toda receita do dia |
| `total_avulso_original` | Numeric | Parcela referente a Avulsos |
| `total_mensalista_original` | Numeric | Parcela referente a Mensalistas |
| `total_geral` | Numeric | Total geral consolidado |

---

## 4. Regras de Negócio e Validação

1. **Unicidade de Datas**: Cada requisição deve conter apenas uma `data_referencia`.
2. **Idempotência**: O envio repetido do mesmo dia para a mesma operação sobrescreverá o registro anterior (`UPSERT`), garantindo que não haja duplicidade nos dashboards.
3. **Reflexo nos Dashboards**: Os dados são automaticamente sincronizados com a tabela `faturamento_resumo_diario`, que é a fonte oficial do ERP.
4. **Resiliência**: O agente local pode reenviar resumos a qualquer momento para corrigir divergências; o ERP priorizará o último envio recebido.

---

## 5. Exemplo Completo de Requisição

```json
{
  "schema_version": "1.0.0",
  "agent_version": "1.0.2",
  "integration_type": "personal_resumo_diario",
  "data_referencia": "2026-03-30",
  "resumo": {
    "total_receita_original": 15234.90,
    "total_avulso_original": 14800.50,
    "total_mensalista_original": 434.40,
    "total_geral": 15234.90
  },
  "resumo_por_forma_pagamento": {
    "DINHEIRO": 1200.00,
    "PIX": 3200.00,
    "CARTAO_CREDITO": 5400.00,
    "CARTAO_DEBITO": 2800.00,
    "CONVENIO": 2634.90
  },
  "resumo_por_tipo": {
    "AVULSO": 14800.50,
    "MENSALISTA": 434.40
  },
  "metadata": {
    "origem_sistema": "PERSONAL",
    "generated_at": "2026-03-30T22:15:00-03:00",
    "hostname": "PDV-REC-01",
    "hash_lote": "f2f5d0d4b2b7b7fa",
    "observacao": "Resumo diário consolidado pelo agente local"
  }
}
```

---

## 6. Respostas da API

### Sucesso (200 OK)
```json
{
  "success": true,
  "message": "Resumo diário processado com sucesso",
  "stats": {
    "data_referencia": "2026-03-30",
    "total_geral": 15234.90
  },
  "tempo_ms": 124
}
```

### Falha na Autenticação (401 Unauthorized)
```json
{
  "error": "Operação não cadastrada ou Token de Integração inválido."
}
```

### Erro de Configuração (403 Forbidden)
```json
{
  "error": "Operação não está configurada para resumo diário. Modo atual: movimentos_detalhados"
}
```
