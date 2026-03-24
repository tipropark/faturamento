param(
    # Identificação Única desta Operação
    [string]$OperationID = "", 
    [string]$AgentID = "",

    # Configuração de Conexão Local
    [string]$LocalServer = "localhost",
    [string]$LocalDatabase = "T4UPark",
    [string]$SqlUser = "",
    [string]$SqlPassword = ""
)

# ------------------------------------------------------------------------------
# CONFIGURAÇÃO CENTRALIZADA (REGRAS DE NEGÓCIO)
# ------------------------------------------------------------------------------
$SupabaseUrl = "https://ckgqmgclopqomctgvhbq.supabase.co"
$SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ------------------------------------------------------------------------------
# CAMADA DE EXECUÇÃO MODULAR (x64 Optimized)
# ------------------------------------------------------------------------------
function Write-Log($msg, $color = "Gray") {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$timestamp] $msg" -ForegroundColor $color
}

function Send-To-Supabase($Table, $Payload) {
    # Suporte a UPSERT para evitar duplicatas financeiras
    $Url = "$SupabaseUrl/rest/v1/$Table"
    if ($Table -eq "faturamento_movimentos") {
        $Url += "?on_conflict=operacao_id,ticket_id"
    }

    $Headers = @{ 
        "apikey" = $SupabaseKey; 
        "Authorization" = "Bearer $SupabaseKey"; 
        "Content-Type" = "application/json; charset=utf-8";
        "Prefer" = "resolution=merge-duplicates"
    }
    
    $BodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Payload)
    
    try {
        return Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $BodyBytes
    } catch {
        $ex = $_.Exception
        Write-Log "ERRO NA TABELA $Table : $($ex.Message)" "Red"
        if ($ex.Response) {
            $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Log "RESPOSTA DO SERVIDOR: $responseBody" "Yellow"
        }
    }
}

function Report-Status($Status, $Msg, $Processed = 0) {
    Write-Log "Reportando saúde operacional diretamente ao Supabase..." "Cyan"
    
    $Payload = @{
        operacao_id = $OperationID;
        agente_id = if ($AgentID) { $AgentID } else { "LOCAL-SCRIPT-PARCO" };
        status = $Status;
        registros_processados = $Processed;
        tempo_execucao_segundos = [Math]::Round($Stopwatch.Elapsed.TotalSeconds, 2);
        mensagem = $Msg;
        criado_em = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json -Compress

    # Reutiliza a função de envio que já possui as chaves do Supabase
    Send-To-Supabase "faturamento_sincronizacoes" $Payload
}

# Forçar UTF8 no console para evitar erros de acentuação nos logs
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE COLETOR (SISTEMA PARCO - x64)           " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # 1. Conexão SQL Server
    $ConnStr = if ([string]::IsNullOrEmpty($SqlUser)) {
        "Server=$LocalServer;Database=master;Integrated Security=True;TrustServerCertificate=True"
    } else {
        "Server=$LocalServer;Database=master;User Id=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True"
    }

    $Connection = New-Object System.Data.SqlClient.SqlConnection($ConnStr)
    $Connection.Open()
    
    $UseCmd = $Connection.CreateCommand()
    $UseCmd.CommandText = "USE [$LocalDatabase]"
    $UseCmd.ExecuteNonQuery()
    Write-Log "Conectado ao Banco: $LocalDatabase" "Green"

    Write-Log "Executando Query Unificada (Avulso + Mensal + Receitas/Despesas)..."
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = @"
SELECT * FROM (
    SELECT
        'A-' + CAST(p.Codigo AS VARCHAR(50)) AS 'ticket_id',
        CAST(m.Ticket AS VARCHAR(50)) AS 'ticket_label',
        m.Entrada AS 'data_entrada',
        m.Saida AS 'data_saida_movimento',
        p.Pagamento AS 'data_saida',
        p.Valor AS 'valor',
        ISNULL(fp.Descricao, CAST(p.FormaPagamentoCodigo AS VARCHAR)) AS 'forma_pagamento',
        'Avulso' AS 'tipo_movimento',
        NULL AS 'descricao'
    FROM Movimento m
    INNER JOIN PagamentoAvulso p ON p.MovimentoCodigo = m.Codigo
    LEFT JOIN FormaPagamento fp ON fp.Codigo = p.FormaPagamentoCodigo
    WHERE p.Pagamento >= @Inicio AND p.Pagamento <= @Fim
      AND ISNULL(p.Cancelado, 0) = 0

    UNION ALL

    SELECT
        'M-' + CAST(pm.Codigo AS VARCHAR(50)) AS 'ticket_id',
        'MENSAL' AS 'ticket_label',
        NULL AS 'data_entrada',
        NULL AS 'data_saida_movimento',
        pm.Pagamento AS 'data_saida',
        pm.Valor AS 'valor',
        ISNULL(fp.Descricao, CAST(pm.FormaPagamentoCodigo AS VARCHAR)) AS 'forma_pagamento',
        'Mensalista' AS 'tipo_movimento',
        NULL AS 'descricao'
    FROM PagamentoMensal pm
    LEFT JOIN FormaPagamento fp ON fp.Codigo = pm.FormaPagamentoCodigo
    WHERE pm.Pagamento >= @Inicio AND pm.Pagamento <= @Fim
      AND ISNULL(pm.Cancelado, 0) = 0

    UNION ALL

    SELECT
        'REC-' + CAST(rd.Codigo AS VARCHAR(50)) AS 'ticket_id',
        'AVULSO' AS 'ticket_label',
        NULL AS 'data_entrada',
        NULL AS 'data_saida_movimento',
        rd.Data AS 'data_saida',
        rd.Valor AS 'valor',
        ISNULL(fp.Descricao, CAST(rd.FormaPagamentoCodigo AS VARCHAR)) AS 'forma_pagamento',
        CASE WHEN rd.TipoLancamento = 1 THEN 'Receita' ELSE 'Despesa' END AS 'tipo_movimento',
        rd.Descricao AS 'descricao'
    FROM ReceitaDespesa rd
    LEFT JOIN FormaPagamento fp ON fp.Codigo = rd.FormaPagamentoCodigo
    WHERE rd.Data >= @Inicio AND rd.Data <= @Fim
      AND ISNULL(rd.Cancelado, 0) = 0
      AND rd.TipoLancamento IN (1, 2)
) x ORDER BY data_saida;
"@
    $Cmd.Parameters.AddWithValue("@Inicio", (Get-Date).Date.AddDays(-3))
    $Cmd.Parameters.AddWithValue("@Fim", (Get-Date).Date.AddDays(1).AddTicks(-1))

    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Log "Coletados $Count registros." "Green"

    # 3. Processamento e Envio
    if ($Count -gt 0) {
        Write-Log "Processando e formatando dados..."
        $Payload = @()
        $Culture = [System.Globalization.CultureInfo]::InvariantCulture
        
        foreach ($Row in $DataTable) {
            $currentOpId = $null
            if (-not [string]::IsNullOrWhiteSpace($OperationID)) {
                $currentOpId = $OperationID.Trim()
            }
            
            $Obj = [ordered]@{
                operacao_id = $currentOpId
            }
            
            foreach ($Col in $DataTable.Columns) {
                if ($Col.ColumnName -eq "data_saida_movimento") { continue }
                $Val = $Row[$Col.ColumnName]
                
                if ($Val -is [DateTime]) { 
                    $Val = $Val.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") 
                }
                elseif ($Val -is [decimal] -or $Val -is [double] -or $Val -is [float]) {
                    $Val = [System.Convert]::ToDouble($Val).ToString($Culture)
                    $Val = [double]::Parse($Val, $Culture)
                }
                elseif ($Val -is [System.DBNull]) {
                    $Val = $null
                }
                
                $Obj.Add($Col.ColumnName, $Val)
            }
            $Payload += New-Object PSObject -Property $Obj
        }

        Write-Log "Sincronizando com Supabase..."
        $JsonPayload = ConvertTo-Json -InputObject $Payload -Depth 10 -Compress
        if (-not $JsonPayload.StartsWith("[")) { $JsonPayload = "[$JsonPayload]" }
        
        Send-To-Supabase "faturamento_movimentos" $JsonPayload
    }

    $Stopwatch.Stop()
    Write-Log "Sincronização concluída com sucesso!" "Green"
    Report-Status "sucesso" "Execução normal. Dados sincronizados." $Count

} catch {
    $Stopwatch.Stop()
    Write-Log "ERRO: $($_.Exception.Message)" "Red"
    Report-Status "falha" "Erro na execução: $($_.Exception.Message)" 0
}


