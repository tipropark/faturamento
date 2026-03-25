# ------------------------------------------------------------------------------
# LEVE ERP - AGENTE COLETOR PERSONAL (FIREBIRD x86) - ULTRA COMPATIBLE (PS 2.0+)
# OPERAÇÃO: SAMS CAXIAS DO SUL
# API ID: bd7e163f-6457-46aa-9cd0-721181331291
# ------------------------------------------------------------------------------

param(
    [string]$OperationID = "bd7e163f-6457-46aa-9cd0-721181331291",
    [string]$IntegrationToken = "SEU_TOKEN_INTEGRACAO_AQUI", 
    [string]$ApiBaseUrl = "https://erp.levemobilidade.com.br", 
    [string]$LocalDatabase = "C:\SgpWin\SGP.FDB",
    [string]$SqlUser = "SYSDBA",
    [string]$SqlPassword = "masterkey",
    [string]$FbClientPath = ""
)

# 1. Configuracoes de Seguranca e Ambiente (Compativeis com PS 2.0)
try { [Net.ServicePointManager]::SecurityProtocol = 3072 } catch { } # TLS 1.2
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Log($msg, $color = "Gray") {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$timestamp] $msg" -ForegroundColor $color
}

# Funcao de Envio legada para compatibilidade com PowerShell 2.0 (Windows XP/7)
function Invoke-LegacyPost($Url, $HeaderDict, $Payload) {
    $wc = New-Object System.Net.WebClient
    $wc.Encoding = [System.Text.Encoding]::UTF8
    
    foreach ($key in $HeaderDict.Keys) {
        $wc.Headers.Add($key, $HeaderDict[$key])
    }
    
    try {
        $response = $wc.UploadString($Url, "POST", $Payload)
        return $response
    } catch {
        $ex = $_.Exception
        Write-Log "ERRO NA API: $($ex.Message)" "Red"
        if ($ex.InnerException) { Write-Log "Inner: $($ex.InnerException.Message)" "Yellow" }
        throw $ex
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE SAMS CAXIAS DO SUL (FIREBIRD x86)      " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Bitness = [IntPtr]::Size * 8
Write-Log "Arquitetura do Script: $Bitness bits" "Yellow"

try {
    # 2. Localizar fbclient.dll manual (Evita caminhos falhos no Windows 7)
    if ([string]::IsNullOrEmpty($FbClientPath)) {
        $Paths = @("C:\Windows\System32\fbclient.dll", "C:\SgpWin\fbclient.dll", "C:\fbclient.dll")
        foreach ($P in $Paths) { if (Test-Path $P) { $FbClientPath = $P; break; } }
    }

    # 3. Conexao Firebird via ODBC
    $ConnStr = "Driver={Firebird/InterBase(r) driver};Dbname=$LocalDatabase;User=$SqlUser;Password=$SqlPassword"
    if ($FbClientPath) { $ConnStr += ";Client=$FbClientPath" }

    Write-Log "Conectando ao Firebird (ODBC)..." "DarkGray"
    $Connection = New-Object System.Data.Odbc.OdbcConnection($ConnStr)
    $Connection.Open()
    
    # 4. Coleta de Dados (Standard SGP)
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = "SELECT CAST(m.CODENTRA AS VARCHAR(50)) AS ticket_label, m.DT_ENTRA, m.HR_ENTRA, m.DT_SAIDA, m.HR_SAIDA, m.VALOR_BAI AS valor, m.COBRANCA, m.DESCCARTAO, 'Avulso' AS tipo_movimento FROM MOVIMENTACAO m WHERE m.DT_SAIDA >= ? AND m.DT_SAIDA <= ? AND m.DT_SAIDA IS NOT NULL"
    
    $ini = (Get-Date).Date.AddDays(-3).ToString("yyyy-MM-dd")
    $fim = (Get-Date).Date.AddDays(1).ToString("yyyy-MM-dd")
    $Cmd.Parameters.Add("I", [System.Data.Odbc.OdbcType]::Date).Value = $ini
    $Cmd.Parameters.Add("F", [System.Data.Odbc.OdbcType]::Date).Value = $fim

    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader)
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Log "Coletados $Count registros." "Green"

    if ($Count -gt 0) {
        Write-Log "Formatando dados para API V2..." "Cyan"
        $movimentos = @()
        foreach ($Row in $DataTable) {
            # Mapeamento Legacy (Sem [ordered] para compatibilidade PS 2.0)
            $m = @{
                ticket_label = $Row["ticket_label"].ToString()
                valor = [double]$Row["valor"]
                tipo_movimento = "Avulso"
                data_saida = [DateTime]::Parse($Row["dt_saida"].ToString()).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
            
            # Logica de Forma de Pagamento
            $cob = $Row["COBRANCA"].ToString().Trim()
            $desc = if ($Row["DESCCARTAO"] -eq [DBNull]::Value) { "" } else { $Row["DESCCARTAO"].ToString().Trim() }
            
            if ($cob -eq "1") { $m["forma_pagamento"] = "DINHEIRO" }
            elseif ($cob -eq "2") { $m["forma_pagamento"] = "PIX" }
            elseif ($cob -eq "4") { $m["forma_pagamento"] = "CONVENIO" }
            elseif ($cob -match "5|P1") { $m["forma_pagamento"] = if ($desc) { "CARTAO - $desc" } else { "CARTAO" } }
            else { $m["forma_pagamento"] = "OUTROS" }

            # ID Unico para evitar duplicatas
            $idBase = "$($m.ticket_label)-$($m.valor)-$($m.data_saida)-$($OperationID)"
            $Hash = [System.Security.Cryptography.MD5]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($idBase))
            $m["ticket_id"] = "PER-" + ([System.BitConverter]::ToString($Hash) -replace "-","").ToLower()

            $movimentos += $m
        }

        # 5. Serializacao JSON Legada e Envio
        $JsonList = @()
        foreach ($mov in $movimentos) {
            # Montagem manual minima de JSON (Muito mais seguro em scripts legados)
            $item = "{""ticket_label"":""$($mov.ticket_label)"",""valor"":$($mov.valor.ToString().Replace(',','.')),""forma_pagamento"":""$($mov.forma_pagamento)"",""data_saida"":""$($mov.data_saida)"",""tipo_movimento"":""Avulso"",""ticket_id"":""$($mov.ticket_id)""}"
            $JsonList += $item
        }
        $FullPayload = "{""movimentos"": [" + ($JsonList -join ",") + "]}"

        $headers = @{
            "Content-Type" = "application/json"
            "x-operacao-id" = $OperationID
            "x-integration-token" = $IntegrationToken
        }

        Write-Log "Sincronizando via WebClient (Modo Legado V2)..." "Yellow"
        $response = Invoke-LegacyPost "$ApiBaseUrl/api/faturamento/importar-movimentos" $headers $FullPayload
        Write-Log "SUCESSO: Sincronizado com API Centralizada!" "Green"
    }

} catch {
    Write-Log "ERRO: $($_.Exception.Message)" "Red"
}

Write-Log "Processo finalizado. Pressione qualquer tecla no Batch para sair." "DarkCyan"
