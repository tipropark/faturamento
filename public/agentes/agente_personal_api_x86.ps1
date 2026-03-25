# ------------------------------------------------------------------------------
# LEVE ERP - AGENTE COLETOR PERSONAL (MODO API / PS 2.0 COMPATIBLE)
# ------------------------------------------------------------------------------
# Versao para Windows 7 / x86 / ODBC Firebird
# ------------------------------------------------------------------------------

param(
    [string]$OperationID = "", 
    [string]$AgentID = "",
    [string]$LocalServer = "localhost",
    [string]$LocalDatabase = "C:\SgpWin\SGP.FDB",
    [string]$SqlUser = "SYSDBA",
    [string]$SqlPassword = "masterkey",
    [string]$ApiBaseUrl = "http://hub.levemobilidade.com.br"
)

# 1. Configurar Protocolo Seguro (3072 = TLS 1.2 para .NET 4.0/4.5)
[Net.ServicePointManager]::SecurityProtocol = 3072
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Log($msg, $color = "Gray") {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$timestamp] $msg" -ForegroundColor $color
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE COLETOR PERSONAL (API x86)             " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # 2. Buscar Configuração Dinâmica (Template + Parâmetros) via WebClient
    Write-Log "Buscando configuracao no ERP em: $ApiBaseUrl" "Yellow"
    $wc = New-Object System.Net.WebClient
    $wc.Encoding = [System.Text.Encoding]::UTF8
    
    $configUrl = "$ApiBaseUrl/api/operacoes/$OperationID/agente-config?format=json"
    $configRaw = $wc.DownloadString($configUrl)
    
    # Extrair SQL do JSON manualmente (para compatibilidade PS 2.0)
    # Procuramos o campo "sql_template" dentro do objeto query_template
    $sqlTemplate = ""
    if ($configRaw -match '"sql_template":"([^"]+)"') {
        $sqlTemplate = $matches[1] -replace '\\n', "`n" -replace '\\"', '"'
    }

    if ([string]::IsNullOrEmpty($sqlTemplate)) {
        # Fallback caso a regex falhe ou o template nao esteja cadastrado
        Write-Log "AVISO: SQL Template nao encontrado via API. Usando query padrao." "Yellow"
        $sqlTemplate = "SELECT CAST(CODENTRA AS VARCHAR(50)) as ticket_id, DT_SAIDA as data_saida, VALOR_BAI as valor FROM MOVIMENTACAO WHERE DT_SAIDA >= CURRENT_DATE - 1"
    }

    # 3. Conexão Firebird via ODBC (32-bit Driver)
    $TargetDb = if ($LocalServer -eq "localhost") { $LocalDatabase } else { "$LocalServer`:$LocalDatabase" }
    $ConnStr = "Driver={Firebird/InterBase(r) driver};Dbname=$TargetDb;User=$SqlUser;Password=$SqlPassword"
    
    Write-Log "Conectando ao Firebird (ODBC x86)..."
    $Connection = New-Object System.Data.Odbc.OdbcConnection($ConnStr)
    $Connection.Open()
    
    Write-Log "Executando Query..."
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = $sqlTemplate
    
    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Log "Coletados $Count registros locais." "Green"

    # 4. Processar e Enviar via POST
    if ($Count -gt 0) {
        Write-Log "Formatando dados para envio..."
        $movimentosJson = @()
        
        foreach ($Row in $DataTable) {
            $ticketId = $Row["ticket_id"].ToString().Trim()
            $valor = $Row["valor"].ToString().Replace(',', '.')
            $dataSaida = if ($Row["data_saida"] -is [DateTime]) { $Row["data_saida"].ToString("yyyy-MM-ddTHH:mm:ss") } else { $Row["data_saida"].ToString() }
            
            # Montagem manual do objeto JSON (PS 2.0 nao tem ConvertTo-Json)
            $jsonItem = '{"ticket_id":"' + $ticketId + '","data_saida":"' + $dataSaida + '","valor":' + $valor + '}'
            $movimentosJson += $jsonItem
        }

        # Montar o Payload Final
        $finalPayload = '{"operacao_id":"' + $OperationID + '","movimentos":[' + ($movimentosJson -join ",") + ']}'
        
        Write-Log "Sincronizando com o ERP..." "Cyan"
        $importUrl = "$ApiBaseUrl/api/faturamento/importar-movimentos"
        
        # Upload via POST
        $wc.Headers.Add("Content-Type", "application/json")
        $response = $wc.UploadString($importUrl, "POST", $finalPayload)
        
        Write-Log "RESPOSTA ERP: $response" "Green"
    }

    $Stopwatch.Stop()
    Write-Log "Sincronização concluída com sucesso em $($Stopwatch.Elapsed.TotalSeconds)s!" "Green"

} catch {
    $Stopwatch.Stop()
    $err = $_.Exception.Message
    Write-Log "ERRO CRITICO: $err" "Red"
    
    # Reportar Falha ao ERP
    try {
        $reportUrl = "$ApiBaseUrl/api/faturamento/report-execucao"
        $logJson = '{"operacao_id":"' + $OperationID + '","status":"falha","mensagem":"Erro no Agente x86: ' + $err.Replace('"',"'") + '"}'
        $wc.Headers.Add("Content-Type", "application/json")
        $wc.UploadString($reportUrl, "POST", $logJson)
    } catch {}
}

Write-Host "Pressione qualquer tecla para sair..."
pause
