# ------------------------------------------------------------------------------
# LEVE ERP - AGENTE COLETOR CENTRALIZADO (MODO API V2)
# ------------------------------------------------------------------------------
# Este script e o padrao para operacoes em modo 'API Manual'.
# Envia dados para o endpoint central do ERP usando autenticacao separada.
# ------------------------------------------------------------------------------

param(
    [string]$OperationID = "",    # Fornecido pelo ERP
    [string]$IntegrationToken = "", # Fornecido pelo ERP (Token Secreto)
    [string]$ApiBaseUrl = "https://seu-dominio.com",
    [string]$LocalDatabase = "C:\Caminho\Banco.FDB",
    [string]$SqlUser = "SYSDBA",
    [string]$SqlPassword = "masterkey"
)

# 1. Configuracoes de Seguranca (TLS 1.2)
[Net.ServicePointManager]::SecurityProtocol = 3072

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LEVE ERP - AGENTE COLETOR CENTRALIZADO (API V2)          " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($OperationID) -or [string]::IsNullOrEmpty($IntegrationToken)) {
    Write-Host "[ERRO] OperationID ou IntegrationToken nao fornecidos!" -ForegroundColor Red
    pause
    exit
}

try {
    # 2. Coletar Dados (Exemplo generico - Ajustar conforme o banco local)
    Write-Host "[LOG] Conectando ao Banco Local: $LocalDatabase..." -ForegroundColor DarkGray
    
    # [LOGICA DE COLETA AQUI - DEPENDE DO BANCO DA UNIDADE]
    # Simulando um array de movimentos (Substituir pela query real)
    $movimentos = @(
        # Exemplo: @{ ticket_id="1"; valor=15.50; data_saida="2024-03-25T14:30:00"; forma_pagamento="DINHEIRO" }
    )

    # 3. Preparar Envio
    if ($movimentos.Count -gt 0) {
        Write-Host "[LOG] Enviando $($movimentos.Count) registros para a API Central..." -ForegroundColor Cyan
        
        # Converter para JSON
        $payload = @{
            movimentos = $movimentos
        } | ConvertTo-Json -Depth 5

        # 4. Envio via API Centralizada
        $apiUrl = "$ApiBaseUrl/api/faturamento/importar-movimentos"
        
        $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
        $headers.Add("Content-Type", "application/json")
        $headers.Add("x-operacao-id", $OperationID)
        $headers.Add("x-integration-token", $IntegrationToken)

        # Usando Invoke-RestMethod para PS moderno ou WebClient para legados
        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $payload
        
        Write-Host "RESPOSTA ERP: Sincronizado com Sucesso!" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Nenhum registro novo para sincronizar." -ForegroundColor Yellow
    }

} catch {
    Write-Host "[ERRO CRITICO] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Sincronização concluída!" -ForegroundColor Green
pause
