# ==========================================================
# AGENTE DE COLETA LEVE ERP - SISTEMA PARKO (SQL SERVER)
# OPERACAO: CONDOMINIO CECON
# ==========================================================

$OPERACAO_ID = "3b67a82f-4f34-44c6-8a3e-85d1c52f2b06"
$TOKEN = "99c80ed0-0fda-4d6a-940c-2367193f6891"
$DATABASE_SERVER = ".\SQLEXPRESS" # Alterar conforme o servidor local
$DATABASE_NAME = "PARK_SISTEMA" # Alterar para o nome real do banco PARKO

$API_URL = "https://erp.levemobilidade.com.br/api/faturamento/importar-movimentos"

Write-Host ">>> Iniciando Coleta PARKO - Unidade CECON ($OPERACAO_ID)" -ForegroundColor Cyan

# Query SQL Server (Busca movimentos de hoje e ontem)
$query = @"
SELECT 
    CAST(m.ID AS VARCHAR(50)) as ticket_id,
    m.DataEntrada as entry_day,
    m.DataSaida as payday,
    m.ValorPago as value,
    'AVULSO' as category,
    fp.Descricao as payment_method,
    'PARKO_X86_AUTO' as description
FROM mov_f_recebimento m
LEFT JOIN mv_f_meiof_pagto fp ON m.MeioPagamentoID = fp.ID
WHERE m.DataSaida >= CAST(GETDATE() - 1 AS DATE)
"@

try {
    # Definindo a Connection String
    $conString = "Server=$DATABASE_SERVER;Database=$DATABASE_NAME;Integrated Security=True;"
    $con = New-Object System.Data.SqlClient.SqlConnection($conString)
    
    Write-Host ">>> Conectando ao Banco PARKO..." -ForegroundColor Yellow
    $con.Open()
    
    $cmd = $con.CreateCommand()
    $cmd.CommandText = $query
    $reader = $cmd.ExecuteReader()
    
    $movimentos = New-Object System.Collections.Generic.List[Object]
    while ($reader.Read()) {
        $mov = @{
            ticket_id = $reader["ticket_id"]
            data_entrada = $reader["entry_day"]
            data_saida = $reader["payday"]
            valor = $reader["value"]
            tipo_movimento = $reader["category"]
            forma_pagamento = $reader["payment_method"]
            descricao = $reader["description"]
        }
        $movimentos.Add($mov)
    }
    $con.Close()

    Write-Host ">>> Coletados $($movimentos.Count) registros localmente." -ForegroundColor Green

    if ($movimentos.Count -gt 0) {
        $body = @{
            operacao_id = $OPERACAO_ID
            movimentos = $movimentos
        } | ConvertTo-Json -Depth 5 -Compress

        $headers = @{
            "x-operacao-id" = $OPERACAO_ID
            "x-integration-token" = $TOKEN
            "Content-Type" = "application/json"
        }

        Write-Host ">>> Enviando $($movimentos.Count) itens para o Leve ERP..." -ForegroundColor Yellow
        $resp = Invoke-RestMethod -Uri $API_URL -Method Post -Headers $headers -Body $body
        Write-Host ">>> Sucesso: Mensagem do servidor: $($resp.message)" -ForegroundColor Green
    } else {
        Write-Host ">>> Nenhum movimento novo encontrado no banco PARKO." -ForegroundColor Gray
    }
} catch {
    Write-Host "!!! ERRO DURANTE A OPERACAO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ">>> Processo finalizado. Pressione qualquer tecla para sair..."
