import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // Buscar dados da operação com as configurações de automação
  const { data: op, error } = await supabase
    .from('operacoes')
    .select(`
      *, 
      operacoes_automacao(
        automacao_id,
        arquitetura,
        habilitar_faturamento,
        ponto_bat,
        script_coleta,
        sistema:automacoes_catalogo(nome)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !op) {
    if (error) console.error('AGENT_CONFIG_ERROR:', error);
    return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
  }

  const auto = op.operacoes_automacao?.[0];
  const sistema = (auto?.sistema?.nome || op.automacao_sistema || '').toString().toUpperCase().trim();
  const arquitetura = (auto?.arquitetura || op.automacao_arquitetura || '').toString().trim();
  
  console.log(`DEBUG: Gerando script para Op: ${id}, Sistema: [${sistema}], Arq: [${arquitetura}]`);

  // Validação de Sistema Homologado (Atualmente apenas PARCO)
  if (sistema !== 'PARCO' || !arquitetura) {
    const errorMsg = `@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   ERRO: SCRIPT NAO DISPONIVEL
echo ============================================================
echo.
echo Operacao ID: ${op.id}
echo Sistema Capturado: "${sistema || 'Nao Selecionado'}"
echo Arquitetura Capturada: "${arquitetura || 'Nao Selecionada'}" 
echo.
echo O sistema ainda nao possui script de coleta homologado 
echo ou a arquitetura nao foi selecionada corretamente.
echo.
echo Por favor, salve as alteracoes da operacao e tente novamente.
echo Se o erro persistir, entre em contato com o suporte técnico.
echo.
pause
`;
    return new NextResponse(errorMsg.replace(/\r?\n/g, '\r\n'), {
      headers: {
        'Content-Type': 'application/x-bat',
        'Content-Disposition': `attachment; filename="aviso_script_nao_homologado.bat"`,
      },
    });
  }

  // Conteúdo do .bat configurado para PARCO
  const agentFile = `agente_parco_${arquitetura}.ps1`;
  const batContent = `@echo off
chcp 65001 >nul
setlocal

:: ==============================================================================
:: LEVE ERP - DISPARADOR DO AGENTE COLETOR - CONFIGURADO PARA: ${op.nome_operacao}
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

`;

  return new NextResponse(batContent.replace(/\r?\n/g, '\r\n'), {
    headers: {
      'Content-Type': 'application/x-bat',
      'Content-Disposition': `attachment; filename="configurar_agente_${op.codigo_operacao || 'operacao'}.bat"`,
    },
  });
}
