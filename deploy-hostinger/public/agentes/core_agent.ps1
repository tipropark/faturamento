param(
    # Identificação Única desta Operação no LEVE ERP
    [string]$OperationID = "", 
    [string]$AgentID = "",

    # Configuração de Conexão Local do Estacionamento
    [string]$LocalServer = "localhost",
    [string]$LocalDatabase = "T4UPark",
    [string]$SqlUser = "",
    [string]$SqlPassword = ""
)

# ------------------------------------------------------------------------------
# CONFIGURAÇÃO CENTRALIZADA (REGRAS DE NEGÓCIO - LEVE ERP - BASE ATUAL)
# ------------------------------------------------------------------------------
$SupabaseUrl = "https://ckgqmgclopqomctgvhbq.supabase.co"
$SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# x86 systems often prefer string-based dates in query
# Reduzindo para 10 dias no ERP (mais perfomático e os dados antigos já migraram)
$HojeInicio = (Get-Date).AddDays(-10).ToString("yyyy-MM-dd 00:00:00.000")
$HojeFim = (Get-Date).ToString("yyyy-MM-dd 23:59:59.997")

$SqlQuery = @"
SELECT * FROM (
    SELECT
        'A-' + CAST(p.Codigo AS VARCHAR(50)) AS 'ticket_id',
        CAST(m.Ticket AS VARCHAR(50)) AS 'ticket_label',
        m.Entrada AS 'data_entrada',
        p.Pagamento AS 'data_saida',
        p.Valor AS 'valor',
        ISNULL(fp.Descricao, CAST(p.FormaPagamentoCodigo AS VARCHAR)) AS 'forma_pagamento',
        'Avulso' AS 'tipo_movimento',
        NULL AS 'descricao'
    FROM Movimento m
    INNER JOIN PagamentoAvulso p ON p.MovimentoCodigo = m.Codigo
    LEFT JOIN FormaPagamento fp ON fp.Codigo = p.FormaPagamentoCodigo
    WHERE p.Pagamento >= '$HojeInicio' AND p.Pagamento <= '$HojeFim'
      AND ISNULL(p.Cancelado, 0) = 0

    UNION ALL

    SELECT
        'M-' + CAST(pm.Codigo AS VARCHAR(50)) AS 'ticket_id',
        'MENSAL' AS 'ticket_label',
        NULL AS 'data_entrada',
        pm.Pagamento AS 'data_saida',
        pm.Valor AS 'valor',
        ISNULL(fp.Descricao, CAST(pm.FormaPagamentoCodigo AS VARCHAR)) AS 'forma_pagamento',
        'Mensalista' AS 'tipo_movimento',
        NULL AS 'descricao'
    FROM PagamentoMensal pm
    LEFT JOIN FormaPagamento fp ON fp.Codigo = pm.FormaPagamentoCodigo
    WHERE pm.Pagamento >= '$HojeInicio' AND pm.Pagamento <= '$HojeFim'
      AND ISNULL(pm.Cancelado, 0) = 0

    UNION ALL

    SELECT
        'REC-' + CAST(rd.Codigo AS VARCHAR(50)) AS 'ticket_id',
        'AVULSO' AS 'ticket_label',
        NULL AS 'data_entrada',
        rd.Data AS 'data_saida',
        rd.Valor AS 'valor',
        ISNULL(fp.Descricao, CAST(rd.FormaPagamentoCodigo AS VARCHAR)) AS 'forma_pagamento',
        CASE WHEN rd.TipoLancamento = 1 THEN 'Receita' ELSE 'Despesa' END AS 'tipo_movimento',
        rd.Descricao AS 'descricao'
    FROM ReceitaDespesa rd
    LEFT JOIN FormaPagamento fp ON fp.Codigo = rd.FormaPagamentoCodigo
    WHERE rd.Data >= '$HojeInicio' AND rd.Data <= '$HojeFim'
      AND ISNULL(rd.Cancelado, 0) = 0
      AND rd.TipoLancamento IN (1, 2)
) x ORDER BY data_saida;
"@

# ------------------------------------------------------------------------------
# CAMADA DE EXECUÇÃO MODULAR
# ------------------------------------------------------------------------------
function Write-Log($msg, $color = "Gray") {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$timestamp] $msg" -ForegroundColor $color
}

function Send-To-Supabase($Table, $Payload) {
    # Evitar duplicatas através da chave Composta (Operacao_ID e Ticket_ID) no UPSERT
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
        throw $_
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "      LEVE ERP - AGENTE COLETOR DE CAIXAS                   " -ForegroundColor Cyan
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

    # 2. Execução da Query Padronizada
    Write-Log "Executando Query Unificada de Extração de Caixa..."
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = $SqlQuery
    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Log "Coletados $Count registros locais." "Green"

    # 3. Processamento e Envio para o Módulo de Faturamento
    if ($Count -gt 0) {
        Write-Log "Formatando matriz financeira para o Leve ERP..."
        $Payload = @()
        $Culture = [System.Globalization.CultureInfo]::InvariantCulture
        
        foreach ($Row in $DataTable) {
            $currentOpId = $null
            if (-not [string]::IsNullOrWhiteSpace($OperationID) -and $OperationID -notlike "*SEU_ID*") {
                $currentOpId = $OperationID.Trim()
            }
            
            $Obj = [ordered]@{
                operacao_id = $currentOpId
                data_importacao = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            }
            foreach ($Col in $DataTable.Columns) {
                # Se houver sujeira/coluna sobrando que não deve subir
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

        Write-Log "Enviando malote para Cloud Subabase..."
        $JsonPayload = ConvertTo-Json -InputObject $Payload -Depth 10 -Compress
        if (-not $JsonPayload.StartsWith("[")) { $JsonPayload = "[$JsonPayload]" }
        
        # Inserção no Faturamento
        Send-To-Supabase "faturamento_movimentos" $JsonPayload
    }

    $Stopwatch.Stop()
    
    # 4. Registro de Saúde do Agente (Sync Logs)
    $finalAgentId = $null
    if (-not [string]::IsNullOrWhiteSpace($AgentID) -and $AgentID -notlike "*SEU_ID*" -and $AgentID -ne "00000000-0000-0000-0000-000000000000") {
        $finalAgentId = $AgentID
    }

    $finalOpId = $null
    if (-not [string]::IsNullOrWhiteSpace($OperationID) -and $OperationID -notlike "*SEU_ID*") {
        $finalOpId = $OperationID
    }

    $LogObj = @{
        operacao_id = $finalOpId
        agente_id = $finalAgentId
        status = "sucesso"
        registros_processados = $Count
        tempo_execucao_segundos = [Math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)
        mensagem = "Rotina diária finalizada com êxito (Leve ERP Agent)."
    }
    
    Send-To-Supabase "faturamento_sincronizacoes" (ConvertTo-Json -InputObject $LogObj -Compress)
    Write-Log "Concluído!" "Green"

} catch {
    $Stopwatch.Stop()
    Write-Log "FALHA CRÍTICA: $($_.Exception.Message)" "Red"
}
