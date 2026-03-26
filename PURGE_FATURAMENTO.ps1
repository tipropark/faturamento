$headers = @{ 
    "x-operacao-id" = "2a6ba4bb-d439-4aef-94d5-f53fdaece039"; 
    "x-integration-token" = "8d931f2e-0ebf-4023-8870-2c80d4e44804"; 
    "x-purge-today" = "true" 
}
$body = '{"movimentos": []}'
$url = "http://hub.levemobilidade.com.br/api/faturamento/importar-movimentos"

Write-Host "Limpando faturamento fantasma via API..."
$res = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ContentType "application/json"
$res | ConvertTo-Json
