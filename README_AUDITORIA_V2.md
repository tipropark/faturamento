# Nova Arquitetura de Alertas - Auditoria de Metas V2

## Arquitetura de Performance
Para melhorar o desempenho, o processamento de alertas foi desacoplado da abertura da tela. 

1. **Processamento Prioritário**: Agora os alertas são calculados em background via Job.
2. **Dashboard de Leitura Rápida**: A tela agora lê apenas dados persistidos na tabela `faturamento_alertas`.
3. **Cache de Status**: Monitoramento do último processamento via tabela `faturamento_alertas_v2_status`.

## Componentes Implementados

- **`src/lib/faturamento-alertas.ts`**: Adicionado o método `processarJobGlobal()` que avalia todas as operações com metas no mês.
- **`src/app/api/faturamento/alertas/processar/route.ts`**: Endpoint de trigger para o Job.
- **`src/app/api/faturamento/alertas/route.ts`**: Alterado o modo `list` para apenas consulta e adicionado modo `status`.
- **`src/app/(dashboard)/admin/auditoria/metas/page.tsx`**: Interface atualizada para exibir a data da última atualização.

## Como Configurar a Rotina Agendada (Cron)

Para que os alertas sejam atualizados a cada 4 horas, você deve configurar um serviço de Cron externo para chamar o endpoint:

`GET /api/faturamento/alertas/processar?token=SEU_TOKEN`

### Opção A: Vercel Cron (Recomendado)
Adicione no seu `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/faturamento/alertas/processar?token=SEU_TOKEN",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

### Opção B: GitHub Actions
Crie um arquivo `.github/workflows/alertas_cron.yml`:
```yaml
name: Alertas Cron
on:
  schedule:
    - cron: '0 */4 * * *'
jobs:
  run-alert-job:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Job
        run: curl -X GET "https://seu-dominio.com/api/faturamento/alertas/processar?token=${{ secrets.CRON_TOKEN }}"
```

### Variáveis de Ambiente Necessárias
- `CRON_SECRET`: Token de segurança para o job.
- `SUPABASE_SERVICE_ROLE_KEY`: Necessária para o engine gravar os dados.
