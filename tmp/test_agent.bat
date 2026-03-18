@echo off
chcp 65001 >nul
setlocal

:: ==============================================================================
:: LEVE ERP - DISPARADOR DO AGENTE COLETOR - CONFIGURADO PARA: "Test Operation & Stuff"
:: ==============================================================================

:: 1. Definição de Identificadores
set "OPERATION_ID=test-id"
set "AGENT_ID=test-legacy-id"

:: 2. Configurações do Banco de Dados Local (SQL Server)
set "LOCAL_SERVER=localhost"
set "LOCAL_DATABASE=TestDB"
set "SQL_USER="
set "SQL_PASSWORD="

echo.
echo ============================================================
echo   LEVE ERP - INICIANDO SINCRONIZACAO: "Test Operation & Stuff"
echo   SISTEMA: "PARCO" - ARQUITETURA: "x64"
echo ============================================================
echo.

:: Verificar se o arquivo do agente existe
if not exist "%~dp0agente_parco_x64.ps1" (
    echo [ERRO] Arquivo do agente nao encontrado: "agente_parco_x64.ps1"
    echo.
    echo Certifique-se de que o arquivo .bat esta na mesma pasta que 
    echo o script PowerShell ps1 correspondente.
    echo.
    pause
    exit /b
)

:: 3. Execução do PowerShell (Tudo em uma linha para evitar erros de sintaxe do CMD)
powershell.exe -ExecutionPolicy Bypass -File "%~dp0agente_parco_x64.ps1" -OperationID "%OPERATION_ID%" -AgentID "%AGENT_ID%" -LocalServer "%LOCAL_SERVER%" -LocalDatabase "%LOCAL_DATABASE%" -SqlUser "%SQL_USER%" -SqlPassword "%SQL_PASSWORD%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha na execucao do agente. Verifique os logs acima.
) else (
    echo.
    echo [SUCESSO] Sincronizacao finalizada.
)

echo.
pause
