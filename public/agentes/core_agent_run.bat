@echo off
setlocal

:: ==============================================================================
:: LEVE ERP - DISPARADOR DO AGENTE COLETOR
:: ==============================================================================

:: 1. Definição de Identificadores (Substitua pelos IDs da sua Operação no ERP)
set "OPERATION_ID=SEU_ID_OPERACAO"
set "AGENT_ID=SEU_ID_AGENTE"

:: 2. Configurações do Banco de Dados Local (SQL Server)
set "LOCAL_SERVER=localhost"
set "LOCAL_DATABASE=T4UPark"
set "SQL_USER="
set "SQL_PASSWORD="

echo.
echo ============================================================
echo   LEVE ERP - INICIANDO SINCRONIZACAO DE FATURAMENTO
echo ============================================================
echo.

:: 3. Execução do PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%~dp0core_agent.ps1" ^
    -OperationID "%OPERATION_ID%" ^
    -AgentID "%AGENT_ID%" ^
    -LocalServer "%LOCAL_SERVER%" ^
    -LocalDatabase "%LOCAL_DATABASE%" ^
    -SqlUser "%SQL_USER%" ^
    -SqlPassword "%SQL_PASSWORD%"

echo.
echo ============================================================
echo   PROCESSO FINALIZADO
echo ============================================================
echo.

pause
