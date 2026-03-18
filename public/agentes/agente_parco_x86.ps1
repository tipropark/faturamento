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

# x86 systems often prefer string-based dates in query
# Sincronizamos os últimos 3 dias para garantir performance e evitar travamentos
$HojeInicio = (Get-Date).AddDays(-3).ToString("yyyy-MM-dd 00:00:00.000")
$HojeFim = (Get-Date).ToString("yyyy-MM-dd 23:59:59.997")

$SqlQuery = @"
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
    WHERE p.Pagamento >= '$HojeInicio' AND p.Pagamento <= '$HojeFim'
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
    WHERE pm.Pagamento >= '$HojeInicio' AND pm.Pagamento <= '$HojeFim'
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
    WHERE rd.Data >= '$HojeInicio' AND rd.Data <= '$HojeFim'
      AND ISNULL(rd.Cancelado, 0) = 0
      AND rd.TipoLancamento IN (1, 2)
) x ORDER BY data_saida;
"@

# ------------------------------------------------------------------------------
# CAMADA DE EXECUÇÃO MODULAR (x86 Optimized)
# ------------------------------------------------------------------------------
function Write-Log($msg, $color = "Gray") {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$timestamp] $msg" -ForegroundColor $color
}

function Send-To-Supabase($Table, $Payload) {
    # Adicionamos on_conflict para evitar duplicatas se a tabela tiver constraints
    $Url = "$SupabaseUrl/rest/v1/$Table"
    if ($Table -eq "faturamento_movimentos") {
        $Url += "?on_conflict=operacao_id,ticket_id"
    }

    $Headers = @{ 
        "apikey" = $SupabaseKey; 
        "Authorization" = "Bearer $SupabaseKey"; 
        "Content-Type" = "application/json; charset=utf-8";
        "Prefer" = "resolution=merge-duplicates" # Esta linha faz o "UPSERT"
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
Write-Host "   LEVE ERP - AGENTE COLETOR (SISTEMA PARCO - x86)           " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # 1. Conexão SQL Server - Smart Fallback (x86 legacy machines often have named instances like SQLEXPRESS)
    $Connection = $null
    $Instances = @()
    if ($LocalServer -and $LocalServer -ne "localhost" -and $LocalServer -ne "127.0.0.1") { $Instances += $LocalServer }
    $Instances += "127.0.0.1"
    $Instances += ".\SQLEXPRESS"
    $Instances += ".\ARCO"
    $Instances += "(local)"
    
    foreach ($Instance in $Instances) {
        Write-Log "Tentando conectar em: $Instance ..." "Gray"
        
        $ConnStr = if ([string]::IsNullOrEmpty($SqlUser)) {
            "Data Source=$Instance;Initial Catalog=master;Integrated Security=SSPI;Connect Timeout=5"
        } else {
            "Data Source=$Instance;Initial Catalog=master;User Id=$SqlUser;Password=$SqlPassword;Connect Timeout=5"
        }

        try {
            $testConn = New-Object System.Data.SqlClient.SqlConnection($ConnStr)
            $testConn.Open()
            $Connection = $testConn
            Write-Log "Conectado com sucesso à instância: $Instance" "Green"
            break
        } catch {
            # Se falhar, tentamos a próxima silenciosamente
            if ($testConn) { $testConn.Dispose() }
        }
    }

    if ($null -eq $Connection) {
        throw "Não foi possível conectar a nenhuma instância do SQL Server (Testadas: $($Instances -join ', ')). Verifique se o serviço SQL Server está rodando."
    }
    
    $UseCmd = $Connection.CreateCommand()
    $UseCmd.CommandText = "USE [$LocalDatabase]"
    $UseCmd.ExecuteNonQuery()
    Write-Log "Banco de Dados Selecionado: $LocalDatabase" "Green"

    # 2. Execução da Query Padronizada
    Write-Log "Executando Query Unificada (Avulso + Mensal + Receitas/Despesas)..."
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = $SqlQuery
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
    
    # 4. Registro de Log de Sucesso (Opcional - pode-se criar tabela logs no erp)
    Write-Log "Sincronização concluída com sucesso!" "Green"

} catch {
    $Stopwatch.Stop()
    Write-Log "ERRO: $($_.Exception.Message)" "Red"
}


