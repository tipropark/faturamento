# ------------------------------------------------------------------------------
# LEVE ERP - AGENTE COLETOR PERSONAL (FIREBIRD x86) - GENÉRICO (PS 2.0+)
# ------------------------------------------------------------------------------

param(
    [string]$OperationID = "2a6ba4bb-d439-4aef-94d5-f53fdaece039",
    [string]$IntegrationToken = "8d931f2e-0ebf-4023-8870-2c80d4e44804", 
    [string]$ApiBaseUrl = "https://dashboard.levemobilidade.com.br", 
    [string]$LocalDatabase = "C:\SgpWin\SGP.FDB",
    [string]$SqlUser = "SYSDBA",
    [string]$SqlPassword = "masterkey",
    [string]$FbClientPath = ""
)

try { [Net.ServicePointManager]::SecurityProtocol = 3072 } catch { } 

function Write-Log($msg, $color = "Gray") {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$timestamp] $msg" -ForegroundColor $color
}

function Invoke-LegacyPost($Url, $HeaderDict, $Payload) {
    $wc = New-Object System.Net.WebClient
    $wc.Encoding = [System.Text.Encoding]::UTF8
    foreach ($key in $HeaderDict.Keys) { $wc.Headers.Add($key, $HeaderDict[$key]) }
    try {
        return $wc.UploadString($Url, "POST", $Payload)
    } catch {
        $ex = $_.Exception
        Write-Log "ERRO NA API: $($ex.Message)" "Red"
        throw $ex
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE PERSONAL (INTELIGÊNCIA DE CAIXA)       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    if ([string]::IsNullOrEmpty($FbClientPath)) {
        $Paths = @("C:\Windows\System32\fbclient.dll", "C:\SgpWin\fbclient.dll", "C:\fbclient.dll")
        foreach ($P in $Paths) { if (Test-Path $P) { $FbClientPath = $P; break; } }
    }

    $ConnStr = "Driver={Firebird/InterBase(r) driver};Dbname=$LocalDatabase;User=$SqlUser;Password=$SqlPassword"
    if ($FbClientPath) { $ConnStr += ";Client=$FbClientPath" }

    $Connection = New-Object System.Data.Odbc.OdbcConnection($ConnStr)
    $Connection.Open()
    
    $Query = @"
SELECT
    X.origem_tabela,
    X.ticket_label,
    X.data_entrada_data,
    X.data_entrada_hora,
    X.data_saida_data,
    X.data_saida_hora,
    X.valor,
    X.forma_pagamento,
    X.tipo_movimento,
    X.desc_cartao,
    X.descricao
FROM (

    SELECT
        'MOVIMENTACAO' AS origem_tabela,
        CAST(m.CODENTRA AS VARCHAR(50)) AS ticket_label,
        m.DT_ENTRA AS data_entrada_data,
        m.HR_ENTRA AS data_entrada_hora,
        m.DT_SAIDA AS data_saida_data,
        m.HR_SAIDA AS data_saida_hora,
        m.VALOR_BAI AS valor,
        CASE
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = '1' THEN 'DINHEIRO'
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = '2' THEN 'PIX'
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = '4' THEN 'CONVENIO'
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) IN ('5', 'P1') THEN
                CASE
                    WHEN UPPER(TRIM(COALESCE(m.DESCCARTAO, ''))) CONTAINING 'CRED' THEN 'CARTAO - CREDITO'
                    WHEN UPPER(TRIM(COALESCE(m.DESCCARTAO, ''))) CONTAINING 'DEB' THEN 'CARTAO - DEBITO'
                    WHEN TRIM(COALESCE(m.DESCCARTAO, '')) <> '' THEN
                        'CARTAO - ' || UPPER(TRIM(m.DESCCARTAO))
                    ELSE 'CARTAO'
                END
            ELSE 'OUTROS'
        END AS forma_pagamento,
        'Avulso' AS tipo_movimento,
        COALESCE(m.DESCCARTAO, '') AS desc_cartao,
        CAST('' AS VARCHAR(100)) AS descricao
    FROM MOVIMENTACAO m
    WHERE m.DT_SAIDA BETWEEN ? AND ?
      AND m.DT_SAIDA IS NOT NULL
      AND m.HR_SAIDA IS NOT NULL

    UNION ALL

    SELECT
        'MENSAL' AS origem_tabela,
        CAST(me.COD AS VARCHAR(50)) AS ticket_label,
        me.DATA_INC AS data_entrada_data,
        NULL AS data_entrada_hora,
        me.DATA_INC AS data_saida_data,
        NULL AS data_saida_hora,
        me.VALOR AS valor,
        COALESCE(me.DESCCARTAO, me.TIPOPGTO, me.TIPO, 'Mensal') AS forma_pagamento,
        'Mensalista' AS tipo_movimento,
        COALESCE(me.DESCCARTAO, '') AS desc_cartao,
        COALESCE(me.NOME, '') AS descricao
    FROM MENSAL me
    WHERE me.DATA_INC BETWEEN ? AND ?
      AND me.DATA_INC IS NOT NULL

    UNION ALL

    SELECT
        'CAIXA' AS origem_tabela,
        'CX-' || CAST(c.DATALANC AS VARCHAR(20)) || '-' || CAST(c.HORALANC AS VARCHAR(20)) AS ticket_label,
        c.DATALANC AS data_entrada_data,
        c.HORALANC AS data_entrada_hora,
        c.DATALANC AS data_saida_data,
        c.HORALANC AS data_saida_hora,
        CASE
            WHEN TRIM(COALESCE(c.TIPOLANC, '')) = 'E' THEN c.VALORBAI
            WHEN TRIM(COALESCE(c.TIPOLANC, '')) = 'S' THEN c.VALORBAI * -1
            ELSE 0.00
        END AS valor,
        'CAIXA' AS forma_pagamento,
        CASE
            WHEN TRIM(COALESCE(c.TIPOLANC, '')) = 'E' THEN 'Receita'
            WHEN TRIM(COALESCE(c.TIPOLANC, '')) = 'S' THEN 'Saida'
            ELSE 'Neutro'
        END AS tipo_movimento,
        CAST('' AS VARCHAR(30)) AS desc_cartao,
        COALESCE(c.HISTORIC, '') AS descricao
    FROM CAIXA c
    WHERE c.DATALANC BETWEEN ? AND ?
      AND c.DATALANC IS NOT NULL
      AND c.HORALANC IS NOT NULL

) X
ORDER BY X.data_saida_data, X.data_saida_hora, X.ticket_label
"@

    $ini = (Get-Date).Date.AddDays(0).ToString("yyyy-MM-dd")
    $fim = (Get-Date).Date.AddDays(1).ToString("yyyy-MM-dd")
    
    $Cmd = $Connection.CreateCommand()
    $Cmd.CommandText = $Query
    $Cmd.Parameters.Add("P1", [System.Data.Odbc.OdbcType]::Date).Value = $ini
    $Cmd.Parameters.Add("P2", [System.Data.Odbc.OdbcType]::Date).Value = $fim
    $Cmd.Parameters.Add("P3", [System.Data.Odbc.OdbcType]::Date).Value = $ini
    $Cmd.Parameters.Add("P4", [System.Data.Odbc.OdbcType]::Date).Value = $fim
    $Cmd.Parameters.Add("P5", [System.Data.Odbc.OdbcType]::Date).Value = $ini
    $Cmd.Parameters.Add("P6", [System.Data.Odbc.OdbcType]::Date).Value = $fim
    
    $Reader = $Cmd.ExecuteReader()
    $DataTable = New-Object System.Data.DataTable
    $DataTable.Load($Reader) | Out-Null
    $Connection.Close()

    $Count = $DataTable.Rows.Count
    Write-Log "Coletados $($Count) registros." "Green"
    
    if ($Count -gt 0) {
        $batchSize = 500
        for ($i = 0; $i -lt $Count; $i += $batchSize) {
            $currentBatch = [Math]::Floor($i / $batchSize) + 1
            $sb = New-Object System.Text.StringBuilder
            [void]$sb.Append("{""movimentos"": [")
            $first = $true
            $md5 = [System.Security.Cryptography.MD5]::Create()
            $limit = [Math]::Min($i + $batchSize, $Count)
            for ($j = $i; $j -lt $limit; $j++) {
                $Row = $DataTable.Rows[$j]
                if (-not $first) { [void]$sb.Append(",") }
                $first = $false
                $origem = $Row["origem_tabela"].ToString().Trim().Replace('"','')
                $ticket = $Row["ticket_label"].ToString().Trim().Replace('"','')
                $fp = $Row["forma_pagamento"].ToString().Trim().Replace('"','')
                $tm = $Row["tipo_movimento"].ToString().Trim().Replace('"','')
                $valor = $Row["valor"].ToString().Replace(',','.')
                
                $dtE = [DateTime]$Row["data_entrada_data"]
                $rawTimeE = $Row["data_entrada_hora"]
                if ($rawTimeE -is [System.TimeSpan]) { $dtE = $dtE.Add($rawTimeE) }
                $dtEntrada = $dtE.ToString("yyyy-MM-ddTHH:mm:ssZ")

                $dtS = [DateTime]$Row["data_saida_data"]
                $rawTimeS = $Row["data_saida_hora"]
                if ($rawTimeS -is [System.TimeSpan]) { $dtS = $dtS.Add($rawTimeS) }
                $dtSaida = $dtS.ToString("yyyy-MM-ddTHH:mm:ssZ")

                $idBase = "$origem-$ticket-$dtSaida-$OperationID"
                $hashBytes = $md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($idBase))
                $tid = "ASSAI-" + ([System.BitConverter]::ToString($hashBytes) -replace "-","").ToLower()

                $item = "{""ticket_id"":""$tid"",""data_entrada"":""$dtEntrada"",""data_saida"":""$dtSaida"",""valor"":$valor,""forma_pagamento"":""$fp"",""tipo_movimento"":""$tm"",""origem_sistema"":""PERSONAL-$origem""}"
                [void]$sb.Append($item)
            }
            [void]$sb.Append("]}")
            $md5.Dispose()
            $Payload = $sb.ToString()
            $Headers = @{ "x-operacao-id" = $OperationID; "x-integration-token" = $IntegrationToken }
            Invoke-LegacyPost "$ApiBaseUrl/api/faturamento/importar-movimentos" $Headers $Payload
            Write-Log "Lote $($currentBatch) OK." "Green"
        }
    }
} catch {
    Write-Log "ERRO: $($_.Exception.Message)" "Red"
}
