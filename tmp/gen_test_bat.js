const fs = require('fs');

const op = {
    id: "test-id",
    id_legado: "test-legacy-id",
    nome_operacao: "Test Operation & Stuff",
    sql_server: "localhost",
    sql_database: "TestDB"
};

const sistema = "PARCO";
const arquitetura = "x64";
const auto = { sql_server: "", sql_database: "" };
const agentFile = `agente_parco_${arquitetura}.ps1`;

const batContent = `@echo off
chcp 65001 >nul
setlocal

:: ==============================================================================
:: LEVE ERP - DISPARADOR DO AGENTE COLETOR - CONFIGURADO PARA: "${op.nome_operacao}"
:: ==============================================================================

:: 1. Definição de Identificadores
set "OPERATION_ID=${op.id}"
set "AGENT_ID=${op.id_legado || op.id}"

:: 2. Configurações do Banco de Dados Local (SQL Server)
set "LOCAL_SERVER=${auto?.sql_server || op.sql_server || 'localhost'}"
set "LOCAL_DATABASE=${auto?.sql_database || op.sql_database || 'T4UPark'}"
set "SQL_USER="
set "SQL_PASSWORD="

echo.
echo ============================================================
echo   LEVE ERP - INICIANDO SINCRONIZACAO: "${op.nome_operacao}"
echo   SISTEMA: "${sistema}" - ARQUITETURA: "${arquitetura}"
echo ============================================================
echo.

:: Verificar se o arquivo do agente existe
if not exist "%~dp0${agentFile}" (
    echo [ERRO] Arquivo do agente nao encontrado: "${agentFile}"
    echo.
    echo Certifique-se de que o arquivo .bat esta na mesma pasta que 
    echo o script PowerShell ps1 correspondente.
    echo.
    pause
    exit /b
)

:: 3. Execução do PowerShell (Tudo em uma linha para evitar erros de sintaxe do CMD)
powershell.exe -ExecutionPolicy Bypass -File "%~dp0${agentFile}" -OperationID "%OPERATION_ID%" -AgentID "%AGENT_ID%" -LocalServer "%LOCAL_SERVER%" -LocalDatabase "%LOCAL_DATABASE%" -SqlUser "%SQL_USER%" -SqlPassword "%SQL_PASSWORD%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha na execucao do agente. Verifique os logs acima.
) else (
    echo.
    echo [SUCESSO] Sincronizacao finalizada.
)

echo.
pause
`;

fs.writeFileSync('tmp/test_agent.bat', batContent.replace(/\r?\n/g, '\r\n'));
console.log('Saved tmp/test_agent.bat');
