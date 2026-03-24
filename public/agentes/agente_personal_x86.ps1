param(
    # Identificação Única desta Operação
    [string]$OperationID = "", 
    [string]$AgentID = "",

    # Configuração de Conexão Local (Firebird)
    [string]$LocalServer = "localhost",
    [string]$LocalDatabase = "C:\SgpWin\SGP.FDB",
    [string]$SqlUser = "SYSDBA",
    [string]$SqlPassword = "masterkey",
    
    # Caminho opcional do cliente Firebird (fbclient.dll)
    [string]$FbClientPath = "" # Se vazio, o script tentará encontrar automaticamente
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
        agente_id = if ($AgentID) { $AgentID } else { "LOCAL-SCRIPT-PERSONAL" };
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
Write-Host "   LEVE ERP - AGENTE COLETOR (PERSONAL FIREBIRD - x86)       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$Bitness = [IntPtr]::Size * 8
Write-Log "Arquitetura do Processo: $Bitness bits" "Yellow"

try {
    # 1. Localizar fbclient.dll se não for fornecido
    if ([string]::IsNullOrEmpty($FbClientPath)) {
        Write-Log "Procurando fbclient.dll automaticamente..." "DarkGray"
        $CommonPaths = @(
            "C:\Windows\System32\fbclient.dll",
            "C:\Program Files\Firebird\Firebird_3_0\fbclient.dll",
            "C:\Program Files\Firebird\Firebird_2_5\bin\fbclient.dll",
            "C:\Program Files (x86)\Firebird\Firebird_2_5\bin\fbclient.dll",
            "C:\fbclient.dll"
        )
        foreach ($Path in $CommonPaths) {
            if (Test-Path $Path) {
                $FbClientPath = $Path
                Write-Log "Cliente encontrado em: $FbClientPath" "DarkGray"
                break
            }
        }
    }

    # 1. Conexão Firebird via ODBC
    # Se for localhost, usamos apenas o caminho do banco (evita erros em algumas versões de driver)
    $TargetDb = if ($LocalServer -eq "localhost" -or [string]::IsNullOrEmpty($LocalServer)) { $LocalDatabase } else { "$LocalServer`:$LocalDatabase" }
    
    $ConnStr = "Driver={Firebird/InterBase(r) driver};Dbname=$TargetDb;User=$SqlUser;Password=$SqlPassword"
    if (-not [string]::IsNullOrEmpty($FbClientPath)) {
        $ConnStr += ";Client=$FbClientPath"
    }

    $MaskedConnStr = $ConnStr -replace "Password=[^;]+", "Password=********"
    Write-Log "Usando Conexao: $MaskedConnStr" "DarkGray"
    
    Write-Log "Conectando ao Firebird (ODBC)..."
    $Connection = New-Object System.Data.Odbc.OdbcConnection($ConnStr)
    $Connection.Open()
    Write-Log "Conectado com sucesso!" "Green"

    Write-Log "Executando Query PERSONAL (Firebird)..."
    $Cmd = $Connection.CreateCommand()
    
    # Mapeamento da query PERSONAL para o padrão LEVE ERP
    # No Firebird, usamos || para concatenação e ? para parâmetros posicionais no ODBC
    $Cmd.CommandText = @"
    SELECT
        CAST(m.CODENTRA AS VARCHAR(50)) AS "ticket_label",
        -- Concatenacao de Data + Hora no Firebird
        CAST(m.DT_ENTRA || ' ' || m.HR_ENTRA AS TIMESTAMP) AS "data_entrada",
        CAST(m.DT_SAIDA || ' ' || m.HR_SAIDA AS TIMESTAMP) AS "data_saida",
        m.VALOR_BAI AS "valor",
        -- LOGICA DE MAPEAMENTO DE FORMA DE PAGAMENTO (SOLICITADA PELO USUARIO)
        CASE
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = '1' THEN 'DINHEIRO'
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = '2' THEN 'PIX'
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = '4' THEN 'CONVENIO'
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) IN ('5', 'P1') THEN
                CASE
                    WHEN TRIM(COALESCE(CAST(m.DESCCARTAO AS VARCHAR(30)), '')) <> '' THEN
                        'CARTAO - ' || TRIM(CAST(m.DESCCARTAO AS VARCHAR(30)))
                    ELSE 'CARTAO'
                END
            ELSE 'OUTROS'
        END AS "forma_pagamento",
        'Avulso' AS "tipo_movimento",
        NULL AS "descricao"
    FROM MOVIMENTACAO m
    WHERE m.DT_SAIDA >= ? AND m.DT_SAIDA <= ?
      AND m.DT_SAIDA IS NOT NULL
      AND m.HR_SAIDA IS NOT NULL
    ORDER BY 3
"@
    
    # Parâmetros posicionais para as datas
    $inicio = (Get-Date).Date.AddDays(-3).ToString("yyyy-MM-dd")
    $fim    = (Get-Date).Date.AddDays(1).ToString("yyyy-MM-dd")
    
    $Cmd.Parameters.Add("Inicio", [System.Data.Odbc.OdbcType]::Date).Value = $inicio
    $Cmd.Parameters.Add("Fim", [System.Data.Odbc.OdbcType]::Date).Value = $fim

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
                $Val = $Row[$Col.ColumnName]
                
                # Normalização de nomes das colunas
                $colName = $Col.ColumnName.ToLower().Replace('"', '')
                
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
                
                $Obj.Add($colName, $Val)
            }
            
            # Geracao de ID Unica via Hash (MD5) - Evita estouro de 50 caracteres e garante unicidade
            $idBase = "$($Obj.ticket_label)-$($Obj.valor)-$($Obj.forma_pagamento)-$($Obj.data_saida)"
            $Bytes = [System.Text.Encoding]::UTF8.GetBytes($idBase)
            $HashArr = [System.Security.Cryptography.MD5]::Create().ComputeHash($Bytes)
            $UniqueId = "PER-" + ([System.BitConverter]::ToString($HashArr) -replace "-","").ToLower()
            $Obj.Add("ticket_id", $UniqueId)

            $Payload += New-Object PSObject -Property $Obj
        }

        # 4. Filtrar Duplicatas Locais (Evita Erro 500 no Supabase UPSERT)
        Write-Log "Limpando duplicatas locais para evitar erros de conflito..." "DarkGray"
        $UniquePayload = $Payload | Group-Object ticket_id | ForEach-Object { $_.Group | Select-Object -Last 1 }
        $CountUnique = $UniquePayload.Count
        Write-Log "Registros unicos a enviar: $CountUnique" "Green"

        Write-Log "Sincronizando com Supabase..."
        $JsonPayload = ConvertTo-Json -InputObject $UniquePayload -Depth 10 -Compress
        if (-not $JsonPayload.StartsWith("[")) { $JsonPayload = "[$JsonPayload]" }
        
        Send-To-Supabase "faturamento_movimentos" $JsonPayload
    }

    $Stopwatch.Stop()
    Write-Log "Sincronização PERSONAL concluída com sucesso!" "Green"
    Report-Status "sucesso" "Execução normal PERSONAL (Firebird). Dados sincronizados." $Count

} catch {
    $Stopwatch.Stop()
    Write-Log "ERRO: $($_.Exception.Message)" "Red"
    Report-Status "falha" "Erro na execução PERSONAL (Firebird): $($_.Exception.Message)" 0
}
