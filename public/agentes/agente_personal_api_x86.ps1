# ------------------------------------------------------------------------------
# LEVE ERP - AGENTE COLETOR PERSONAL (MODO API / PS 2.0 / FB ROBUST)
# ------------------------------------------------------------------------------
# Versao refinada para Windows 7 / x86 / Firebird / Mapeamento Dinamico
# ------------------------------------------------------------------------------

param(
    [string]$OperationID = "af22ae06-9955-4923-9328-e152ba112fd9", # ID Manual se o .bat nao enviar
    [string]$AgentID = "",
    [string]$LocalServer = "localhost",
    [string]$LocalDatabase = "C:\SgpWin\SGP.FDB",
    [string]$SqlUser = "SYSDBA",
    [string]$SqlPassword = "masterkey",
    [string]$ApiBaseUrl = "https://dashboard.levemobilidade.com.br",
    [string]$FbClientPath = ""
)

# 1. Configurar Protocolo Seguro (3072 = TLS 1.2) - Silencioso
[Net.ServicePointManager]::SecurityProtocol = 3072

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE COLETOR PERSONAL (API x86)             " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # 2. Localizar Bibliotecas Firebird (fbclient.dll ou gds32.dll)
    if ([string]::IsNullOrEmpty($FbClientPath)) {
        $dllNames = @("fbclient.dll", "gds32.dll")
        $searchFolders = @(
            "C:\SgpWin",
            "C:\Windows\System32",
            "C:\Windows\SysWOW64",
            "C:\Program Files (x86)\Firebird\Firebird_2_5\bin",
            "C:\Program Files (x86)\Firebird\Firebird_2_1\bin"
        )
        foreach ($folder in $searchFolders) {
            foreach ($dll in $dllNames) {
                $path = Join-Path $folder $dll
                if (Test-Path $path) {
                    $FbClientPath = $path
                    break
                }
            }
            if (-not [string]::IsNullOrEmpty($FbClientPath)) { break }
        }
    }

    # 3. Buscar Configuração via WebClient
    $wc = New-Object System.Net.WebClient
    $wc.Encoding = [System.Text.Encoding]::UTF8
    
    $configUrl = "$ApiBaseUrl/api/operacoes/$OperationID/agente-config?format=json"
    $configRaw = $wc.DownloadString($configUrl)
    
    # Extrair SQL (Regex simples para PS 2.0)
    $sqlTemplate = ""
    if ($configRaw -match '"sql_template":"([^"]+)"') {
        $sqlTemplate = $matches[1] -replace '\\n', "`n" -replace '\\"', '"'
    }

    if ([string]::IsNullOrEmpty($sqlTemplate)) {
        Write-Host "[LOG] SQL Template nao encontrado. Usando padrao de seguranca." -ForegroundColor Yellow
        $sqlTemplate = "SELECT CAST(CODENTRA AS VARCHAR(50)) as ticket_id, DT_SAIDA as data_saida, VALOR_BAI as valor, COBRANCA as forma_pagamento FROM MOVIMENTACAO WHERE DT_SAIDA >= '{data_inicio}'"
    }

    # DATAS AGRESSIVAS (ULTIMOS 30 DIAS)
    $data_inicio = (Get-Date).Date.AddDays(-30).ToString("yyyy-MM-dd")
    $data_fim = (Get-Date).Date.AddDays(1).ToString("yyyy-MM-dd")
    
    $sqlFinal = $sqlTemplate -replace '\{data_inicio\}', $data_inicio -replace '\{data_fim\}', $data_fim
    Write-Host "[LOG] SQL Preparado (Datas: $data_inicio ate $data_fim)" -ForegroundColor DarkGray

    # 4. Conexão Firebird via ODBC (32-bit Driver)
    # Alguns Firebirds exigem o prefixo localhost: ou ignoram. Aqui usamos o padrao direto.
    $ConnStr = "Driver={Firebird/InterBase(r) driver};Dbname=$LocalDatabase;User=$SqlUser;Password=$SqlPassword"
    if (-not [string]::IsNullOrEmpty($FbClientPath)) {
        $ConnStr += ";Client=$FbClientPath"
    }
    
    Write-Host "[LOG] Conectando ao Banco..."
    $Connection = New-Object System.Data.Odbc.OdbcConnection($ConnStr)
    $Connection.Open()
    
    Write-Host "[LOG] Conexao OK! Executando Query..." -ForegroundColor Green
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = $sqlFinal
    
    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Host "[LOG] Coletados $Count registros locais." -ForegroundColor White

    # 5. Processar e Enviar via POST
    if ($Count -gt 0) {
        Write-Host "[LOG] Enviando dados para o ERP..." -ForegroundColor Cyan
        $movimentosJson = @()
        
        foreach ($Row in $DataTable) {
            $ticketId = if ($DataTable.Columns.Contains("ticket_id")) { $Row["ticket_id"].ToString().Trim() } else { $Row[0].ToString().Trim() }
            $valor = if ($DataTable.Columns.Contains("valor")) { $Row["valor"].ToString().Replace(',', '.') } else { "0.00" }
            $dataSaida = if ($DataTable.Columns.Contains("data_saida") -and $Row["data_saida"] -is [DateTime]) { $Row["data_saida"].ToString("yyyy-MM-ddTHH:mm:ss") } else { (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") }
            $forma = if ($DataTable.Columns.Contains("forma_pagamento")) { $Row["forma_pagamento"].ToString().Trim() } else { "OUTROS" }
            
            $jsonItem = '{"ticket_id":"' + $ticketId + '","data_saida":"' + $dataSaida + '","valor":' + $valor + ',"forma_pagamento":"' + $forma + '"}'
            $movimentosJson += $jsonItem
        }

        # Payload Final
        $finalPayload = '{"operacao_id":"' + $OperationID + '","movimentos":[' + ($movimentosJson -join ",") + ']}'
        
        $importUrl = "$ApiBaseUrl/api/faturamento/importar-movimentos"
        $wc.Headers.Add("Content-Type", "application/json")
        $response = $wc.UploadString($importUrl, "POST", $finalPayload)
        
        Write-Host "RESPOSTA ERP: Sincronizado com Sucesso!" -ForegroundColor Green
    }

    $Stopwatch.Stop()
    Write-Host "Sincronização concluída!" -ForegroundColor Green

} catch {
    $Stopwatch.Stop()
    Write-Output "ERRO: $($_.Exception.Message)"
}

Write-Host "Pressione qualquer tecla para sair..."
pause
