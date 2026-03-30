# ==========================================================
# LEVE ERP - AGENTE COLETOR (SISTEMA PARCO - MODO LEGADO x86)
# OPERACAO: AEROPORTO VELHO PINTO MARTINS
# ID: 6fee0a3b-57ba-4831-aca2-8cfbd97279ec
# CPU: X86 / PS 2.0+
# ==========================================================

param(
    [string]$OperationID = "6fee0a3b-57ba-4831-aca2-8cfbd97279ec",
    [string]$LocalServer = "localhost\SQLEXPRESS",
    [string]$LocalDatabase = "T4UPark",
    [string]$SqlUser = "",
    [string]$SqlPassword = ""
)

# 1. Configurar Protocolo Seguro (TLS 1.2)
[Net.ServicePointManager]::SecurityProtocol = 3072

# Configuração Supabase (Legado)
$SupabaseUrl = "https://ckgqmgclopqomctgvhbq.supabase.co"
$SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8"

# Funções Auxiliares
function Escape-JSON($str) {
    if ($null -eq $str) { return "null" }
    $s = $str.ToString().Trim()
    $s = $s.Replace('\', '\\')
    $s = $s.Replace('"', '\"')
    $s = $s.Replace("`n", '\n')
    $s = $s.Replace("`r", '\r')
    $s = $s.Replace("`t", '\t')
    return '"' + $s + '"'
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE COLETOR (PARCO x86 LEGADO)             " -ForegroundColor Cyan
Write-Host "   AEROPORTO VELHO - ID: $OperationID" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

# Datas: Últimos 3 dias (Formato Robusto yyyyMMdd)
$HojeInicio = (Get-Date).AddDays(-3).ToString("yyyyMMdd")
$HojeFim = (Get-Date).AddDays(1).ToString("yyyyMMdd")

Write-Host "[DEBUG] Janela de Coleta: $HojeInicio ate $HojeFim (Exclusivo)" -ForegroundColor Yellow

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
    WHERE p.Pagamento >= '$HojeInicio' AND p.Pagamento < '$HojeFim'
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
    WHERE pm.Pagamento >= '$HojeInicio' AND pm.Pagamento < '$HojeFim'
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
    WHERE rd.Data >= '$HojeInicio' AND rd.Data < '$HojeFim'
      AND ISNULL(rd.Cancelado, 0) = 0
      AND rd.TipoLancamento IN (1, 2)
) x ORDER BY data_saida;
"@

try {
    # 2. Conexão SQL Server com Auto-Scan
    $Instances = @($LocalServer, "localhost\SQLEXPRESS", ".\SQLEXPRESS", ".\ARCO", ".", "(local)", "127.0.0.1")
    $Connection = $null
    $ErrorMsg = ""

    foreach ($Instance in $Instances) {
        if ([string]::IsNullOrEmpty($Instance)) { continue }
        
        $ConnStr = if ([string]::IsNullOrEmpty($SqlUser)) {
            "Data Source=$Instance;Initial Catalog=$LocalDatabase;Integrated Security=SSPI;Connect Timeout=3"
        } else {
            "Data Source=$Instance;Initial Catalog=$LocalDatabase;User Id=$SqlUser;Password=$SqlPassword;Connect Timeout=3"
        }

        try {
            Write-Host "[LOG] Tentando instancia: $Instance ..." -ForegroundColor Gray
            $testConn = New-Object System.Data.SqlClient.SqlConnection($ConnStr)
            $testConn.Open()
            $Connection = $testConn
            Write-Host "[LOG] CONECTADO com sucesso em: $Instance" -ForegroundColor Green
            break
        } catch {
            $ErrorMsg = $_.Exception.Message
            if ($testConn) { $testConn.Dispose() }
        }
    }

    if ($null -eq $Connection) {
        throw "Nao foi possivel localizar o SQL Server. Erro: $ErrorMsg"
    }

    $Cmd = $Connection.CreateCommand()

    # --- NOVO: Diagnostico de Tabelas Alternativas ---
    try {
        $Cmd.CommandText = "SELECT COUNT(*) FROM PagamentoAvulsoOSA WHERE Pagamento >= (SELECT CAST(GETDATE() AS DATE))"
        $OsaCount = $Cmd.ExecuteScalar()
        Write-Host "[DEBUG] Pagamentos OSA hoje: $OsaCount" -ForegroundColor Cyan

        $Cmd.CommandText = "SELECT COUNT(*) FROM PagamentoConvenio WHERE Data >= (SELECT CAST(GETDATE() AS DATE))"
        $ConvCount = $Cmd.ExecuteScalar()
        Write-Host "[DEBUG] Pagamentos Convenio hoje: $ConvCount" -ForegroundColor Cyan
    } catch { }
    # -----------------------------------------------

    Write-Host "[LOG] Executando Query de Coleta..." -ForegroundColor DarkGreen
    $Cmd.CommandText = $SqlQuery
    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Host "[LOG] Coletados $Count registros locais no periodo total." -ForegroundColor White

    # --- Auditoria Local de Dados ---
    $Stats = @{}
    foreach ($Row in $DataTable) {
        $dt = $Row["data_saida"]
        if ($dt -is [DateTime]) {
            $key = $dt.ToString("yyyy-MM-dd")
            if (-not $Stats.ContainsKey($key)) { $Stats[$key] = 0 }
            $Stats[$key] = $Stats[$key] + 1
        }
    }
    Write-Host "[LOG] Detalhamento por data:" -ForegroundColor Gray
    foreach ($key in ($Stats.Keys | Sort-Object)) {
        Write-Host "      -> $key : $($Stats[$key]) registros" -ForegroundColor Gray
    }

    # 3. Processar e Enviar via WebClient
    if ($Count -gt 0) {
        Write-Host "[LOG] Preparando pacote para Supabase..." -ForegroundColor Cyan
        
        $DistinctDates = @{}
        $LatestMove = [DateTime]::MinValue
        $wc = New-Object System.Net.WebClient
        $wc.Encoding = [System.Text.Encoding]::UTF8
        $wc.Headers.Add("apikey", $SupabaseKey)
        $wc.Headers.Add("Authorization", "Bearer $SupabaseKey")
        $wc.Headers.Add("Content-Type", "application/json")
        $wc.Headers.Add("Prefer", "resolution=merge-duplicates")
        
        $jsonItems = @()
        foreach ($Row in $DataTable) {
            $ticketId = Escape-JSON($Row["ticket_id"])
            $label = Escape-JSON($Row["ticket_label"])
            $valorRaw = $Row["valor"]
            $valor = "0.00"
            if ($null -ne $valorRaw) {
                $valor = [string]::Format([System.Globalization.CultureInfo]::InvariantCulture, "{0:F2}", $valorRaw)
            }
            $dtSaida = $Row["data_saida"]
            $dataSaidaStr = "null"
            if ($dtSaida -is [DateTime]) {
                $dataSaidaStr = '"' + $dtSaida.ToString("yyyy-MM-ddTHH:mm:ss") + '"'
                $DistinctDates[$dtSaida.ToString("yyyy-MM-dd")] = $true
                if ($dtSaida -gt $LatestMove) { $LatestMove = $dtSaida }
            }
            $dataEntradaStr = "null"
            if ($Row["data_entrada"] -and ($Row["data_entrada"] -is [DateTime])) {
                $dataEntradaStr = '"' + $Row["data_entrada"].ToString("yyyy-MM-ddTHH:mm:ss") + '"'
            }
            
            # Construindo JSON em uma unica linha para garantir compatibilidade com PS 2.0
            $forma = Escape-JSON($Row["forma_pagamento"])
            $tipo = Escape-JSON($Row["tipo_movimento"])
            $desc = Escape-JSON($Row["descricao"])
            $item = '{"operacao_id":"' + $OperationID + '","ticket_id":' + $ticketId + ',"ticket_label":' + $label + ',"data_saida":' + $dataSaidaStr + ',"data_entrada":' + $dataEntradaStr + ',"valor":' + $valor + ',"forma_pagamento":' + $forma + ',"tipo_movimento":' + $tipo + ',"descricao":' + $desc + '}'
            $jsonItems += $item
        }

        # Enviar em lotes
        $BatchSize = 50
        for ($i = 0; $i -lt $jsonItems.Count; $i += $BatchSize) {
            $end = [Math]::Min($i + $BatchSize - 1, $jsonItems.Count - 1)
            $batch = $jsonItems[$i..$end]
            $payload = "[" + ($batch -join ",") + "]"
            $endpoint = "$SupabaseUrl/rest/v1/faturamento_movimentos?on_conflict=operacao_id,ticket_id"
            try { $wc.UploadString($endpoint, "POST", $payload) | Out-Null } catch { }
        }
        Write-Host ">>> SUCESSO na sincronizacao!" -ForegroundColor Green

        # Forçar Consolidacao
        $HojeStr = (Get-Date).ToString("yyyy-MM-dd")
        $OntemStr = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
        $DistinctDates[$HojeStr] = $true
        $DistinctDates[$OntemStr] = $true
        foreach ($d in $DistinctDates.Keys) {
            if ($null -eq $d) { continue }
            try {
                $rpcUrl = "$SupabaseUrl/rest/v1/rpc/reprocessar_faturamento_dia"
                $rpcJson = '{"p_operacao_id":"' + $OperationID + '","p_data":"' + $d + '"}'
                $wc.UploadString($rpcUrl, "POST", $rpcJson) | Out-Null
            } catch { }
        }
    } else {
        Write-Host ">>> Nenhum movimento novo." -ForegroundColor Yellow
    }
} catch {
    Write-Host "!!! ERRO NO PROCESSO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ">>> Finalizado. Fechando em 5 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 5
exit
