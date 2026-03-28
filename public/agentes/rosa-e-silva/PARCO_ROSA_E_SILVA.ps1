# ==========================================================
# LEVE ERP - AGENTE COLETOR (SISTEMA PARCO - MODO LEGADO x86)
# OPERACAO: PA ROSA E SILVA
# ID: 3b67a82f-4f34-44c6-8a3e-85d1c52f2b06
# CPU: X86 / PS 2.0+
# ==========================================================

param(
    [string]$OperationID = "3b67a82f-4f34-44c6-8a3e-85d1c52f2b06",
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

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE COLETOR (PARCO x86 LEGADO)             " -ForegroundColor Cyan
Write-Host "   ROSA E SILVA - ID: $OperationID" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

# Datas: Últimos 3 dias
$HojeInicio = (Get-Date).AddDays(-3).ToString("yyyy-MM-dd 00:00:00.000")
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
    
    Write-Host "[LOG] Executando Query de Movimentacao..." -ForegroundColor DarkGreen
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = $SqlQuery
    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Host "[LOG] Coletados $Count registros locais." -ForegroundColor White

    # 3. Processar e Enviar via WebClient
    if ($Count -gt 0) {
        Write-Host "[LOG] Preparando pacote para Supabase..." -ForegroundColor Cyan
        
        # --- NOVO: Cálculo de Datas para Consolidação ---
        $DistinctDates = @{}
        $LatestMove = [DateTime]::MinValue

        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("apikey", $SupabaseKey)
        $wc.Headers.Add("Authorization", "Bearer $SupabaseKey")
        $wc.Headers.Add("Content-Type", "application/json")
        $wc.Headers.Add("Prefer", "resolution=merge-duplicates") # PostgREST 11+
        
        # Ativar TLS 1.2 explicito para Windows 7 / Legado (Utilizando valor numerico 3072 para PS v2)
        [Net.ServicePointManager]::SecurityProtocol = 3072
        
        $jsonItems = @()
        foreach ($Row in $DataTable) {
            $ticketId = $Row["ticket_id"].ToString().Trim()
            $label = $Row["ticket_label"].ToString().Trim()
            $valor = $Row["valor"].ToString().Replace(',', '.')
            
            $dtSaida = $Row["data_saida"]
            $dataSaidaStr = ""
            if ($dtSaida -is [DateTime]) {
                $dataSaidaStr = $dtSaida.ToString("yyyy-MM-ddTHH:mm:ss")
                $DistinctDates[$dtSaida.ToString("yyyy-MM-dd")] = $true
                if ($dtSaida -gt $LatestMove) { $LatestMove = $dtSaida }
            } else {
                $dataSaidaStr = $dtSaida.ToString()
            }

            $dataEntradaStr = "null"
            if ($Row["data_entrada"] -and ($Row["data_entrada"] -is [DateTime])) {
                $dataEntradaStr = '"' + $Row["data_entrada"].ToString("yyyy-MM-ddTHH:mm:ss") + '"'
            }

            $forma = $Row["forma_pagamento"].ToString().Trim().Replace('"', '\"')
            $tipo = $Row["tipo_movimento"].ToString().Trim().Replace('"', '\"')
            
            # Construção manual do JSON compatível com PS 2.0 (Linha única)
            $item = '{"operacao_id":"' + $OperationID + '","ticket_id":"' + $ticketId + '","ticket_label":"' + $label + '","data_saida":"' + $dataSaidaStr + '","data_entrada":' + $dataEntradaStr + ',"valor":' + $valor + ',"forma_pagamento":"' + $forma + '","tipo_movimento":"' + $tipo + '"}'
            $jsonItems += $item
        }

        # Enviar em lotes (chunks) para evitar limites de payload
        $BatchSize = 100
        $TotalSent = 0
        for ($i = 0; $i -lt $jsonItems.Count; $i += $BatchSize) {
            $batch = $jsonItems[$i..($i + $BatchSize - 1)] | Where-Object { $_ -ne $null }
            $payload = "[" + ($batch -join ",") + "]"
            $endpoint = "$SupabaseUrl/rest/v1/faturamento_movimentos?on_conflict=operacao_id,ticket_id"
            
            try {
                $wc.UploadString($endpoint, "POST", $payload) | Out-Null
                $TotalSent += $batch.Count
                Write-Host ">>> Lote $(($i/$BatchSize) + 1) enviado ($($batch.Count) registros)." -ForegroundColor DarkCyan
            } catch {
                Write-Host "!!! Erro no lote: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ">>> SUCESSO: $TotalSent registros sincronizados com Supabase!" -ForegroundColor Green

        # --- NOVO: Pós-Processamento (Saúde e Consolidação) ---
        Write-Host ">>> Sincronizando dashboard (Heal & Consolidate)..." -ForegroundColor Yellow
        
        # 1. Atualizar Operação (Timestamp de Sincronização)
        try {
            $statusUrl = "$SupabaseUrl/rest/v1/operacoes?id=eq.$OperationID"
            $nowStr = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            $lastMoveStr = if ($LatestMove -gt [DateTime]::MinValue) { $LatestMove.ToString("yyyy-MM-ddTHH:mm:ssZ") } else { $nowStr }
            
            $statusJson = '{' +
                '"ultima_sincronizacao":"' + $nowStr + '",' +
                '"ultimo_movimento_em":"' + $lastMoveStr + '",' +
                '"integracao_faturamento_ativa":true' +
            '}'
            $wc.Headers.Remove("Prefer")
            $wc.UploadString($statusUrl, "PATCH", $statusJson) | Out-Null
            Write-Host ">>> Dashboard: Status da Operacao atualizado." -ForegroundColor Green
        } catch {
            Write-Host "!!! Erro ao atualizar dashboard: $($_.Exception.Message)" -ForegroundColor Red
        }

        # 2. Chamar Consolidação para cada dia afetado
        foreach ($d in $DistinctDates.Keys) {
            Write-Host ">>> Consolidando resultados para o dia ${d}..." -ForegroundColor Cyan
            try {
                $rpcUrl = "$SupabaseUrl/rest/v1/rpc/reprocessar_faturamento_dia"
                $rpcJson = '{"p_operacao_id":"' + $OperationID + '", "p_data":"' + $d + '"}'
                $wc.UploadString($rpcUrl, "POST", $rpcJson) | Out-Null
            } catch {
                Write-Host "!!! Falha na consolidacao de ${d} - $($_.Exception.Message)" -ForegroundColor Red
            }
        }

    } else {
        Write-Host ">>> Nenhum movimento novo para o periodo." -ForegroundColor Yellow
    }

} catch {
    Write-Host "!!! ERRO NO PROCESSO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ">>> Processo finalizado com sucesso. Esta janela fechara em 5 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 5
exit
