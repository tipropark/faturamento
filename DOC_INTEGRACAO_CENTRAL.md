# LEVE ERP - Integração Manual Centralizada (V2)

Esta documentação descreve o fluxo de integração para operações que utilizam o modelo **API Manual**.

## Arquitetura
Diferente do modelo legado onde cada unidade possuía um endpoint, o novo modelo utiliza uma **API Única Centralizada**. A distinção dos dados é feita através de identificadores únicos passados no cabeçalho (Headers) da requisição.

### Endpoint Central
`POST https://seu-dominio.com/api/faturamento/importar-movimentos`

### Autenticação (Headers)
Para cada requisição, os seguintes cabeçalhos são obrigatórios:

| Header | Descrição | Origem |
| :--- | :--- | :--- |
| `x-operacao-id` | UUID único da operação no ERP | Cadastro da Unidade |
| `x-integration-token` | Token Secreto de Integração | Cadastro da Unidade |
| `Content-Type` | Deve ser `application/json` | - |

## Estrutura do Payload (JSON)
```json
{
  "movimentos": [
    {
      "ticket_id": "12345",
      "data_entrada": "2024-03-25T08:00:00",
      "data_saida": "2024-03-25T10:30:00",
      "valor": 25.50,
      "forma_pagamento": "CARTAO_CREDITO",
      "tipo_movimento": "RECEITA"
    }
  ]
}
```

## Como Configurar uma Nova Unidade
1. No ERP, acesse **Administração > Operações**.
2. Edite a unidade desejada.
3. Vá na aba **Automação**.
4. Ative a **Integração de Faturamento**.
5. Selecione o Modo: **API (Envio Seguro)**.
6. Copie o **Token de Integração** e a **URL Central**.
7. Configure o script PowerShell local da unidade com estas credenciais.

## Vantagens
- **Segurança**: Cada operação tem seu próprio token mas o tráfego é padronizado.
- **Manutenibilidade**: Uma única API para monitorar e dar manutenção.
- **Escalabilidade**: Fácil adição de novas unidades sem necessidade de novos deploys de API.

## Headers Opcionais *(Adicionado em 2026-03-26)*
| Header | Descrição | Obrigatório |
| :--- | :--- | :--- |
| `x-purge-today` | Se `true`, limpa movimentos do dia antes de inserir novos | Não |

## Referência
> ⚠️ Para documentação completa e atualizada, consulte `docs/leve_erp_documentacao_master_v3_0.md`
