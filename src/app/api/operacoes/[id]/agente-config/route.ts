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
      query_template:faturamento_query_templates(*),
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
    if (error) {
        console.error('AGENT_CONFIG_DB_ERROR:', error.message, error.details);
        return NextResponse.json({ error: `Erro no banco: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
  }

  const auto = op.operacoes_automacao?.[0];
  const sistema = (auto?.sistema?.nome || op.automacao_sistema || '').toString().toUpperCase().trim();
  const arquitetura = (auto?.arquitetura || op.automacao_arquitetura || '').toString().trim();
  const defaultDb = sistema === 'PERSONAL' && (!auto?.sql_database && op.sql_database === 'SGP' || !op.sql_database) 
    ? 'C:\\SgpWin\\SGP.FDB' 
    : (auto?.sql_database || op.sql_database || 'SGP');
  
  console.log(`DEBUG: Config Agent para Op: ${id}, Sistema: [${sistema}], Arq: [${arquitetura}], Tipo: [${op.integracao_faturamento_tipo}]`);

  // Suporte a JSON para o Novo Agente
  const isJson = req.headers.get('accept')?.includes('application/json') || req.nextUrl.searchParams.get('format') === 'json';
  if (isJson) {
    return NextResponse.json({
        id: op.id,
        nome: op.nome_operacao,
        integracao_faturamento_tipo: op.integracao_faturamento_tipo || 'legado_direto',
        automacao_sistema: sistema,
        sql_server: auto?.sql_server || op.sql_server || 'localhost',
        sql_database: defaultDb,
        sql_user: auto?.sql_user || 'SYSDBA',
        sql_password: auto?.sql_password || 'masterkey',
        query_template: op.query_template || null,
        parametros_query: op.parametros_query || {},
        usa_query_customizada: op.usa_query_customizada || false
    });
  }

  // Validação de Sistemas Homologados (Apenas para o BAT Legado)
  const sistemasHomologados = ['PARCO', 'PERSONAL'];
  if (!sistemasHomologados.includes(sistema) || !arquitetura) {
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

  // Nome do arquivo do agente baseado no sistema e arquitetura
  let agentFile = `agente_${sistema.toLowerCase()}_${arquitetura}.ps1`;
  
  // Se for Novo Modelo (API) para o sistema PERSONAL, usamos o script universal
  if (op.integracao_faturamento_tipo === 'api_agent' && sistema === 'PERSONAL') {
    agentFile = `agente_personal_api_x86.ps1`;
  }

  // Definir URL Base da API (Priorizando a informada pelo usuario)
  const host = req.headers.get('host') || 'dashboard.levemobilidade.com.br';
  const apiBaseUrl = host.includes('localhost') ? `http://${host}` : 'https://dashboard.levemobilidade.com.br';

  const batContent = `@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo   LEVE ERP - INICIANDO AGENTE: ${op.nome_operacao}
echo   SISTEMA: ${sistema} - ARQUITETURA: ${arquitetura}
echo   TIPO: ${op.integracao_faturamento_tipo || 'LEGADO'}
echo ============================================================
echo.

:: 1. Variaveis de Ambiente
set "OPERATION_ID=${op.id}"
set "AGENT_ID=${op.id_legado || op.id}"
set "LOCAL_SERVER=${auto?.sql_server || op.sql_server || 'localhost'}"
set "LOCAL_DATABASE=${defaultDb}"
set "SQL_USER=${auto?.sql_user || 'SYSDBA'}"
set "SQL_PASSWORD=${auto?.sql_password || 'masterkey'}"
set "API_BASE_URL=${apiBaseUrl}"

:: 2. Selecao da Arquitetura do PowerShell
set "PS_CMD=powershell.exe"
if /i "${arquitetura}" == "x86" set "PS_CMD=%SystemRoot%\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe"

echo [DEBUG] Script: "${agentFile}"
echo [DEBUG] PS: "%PS_CMD%"
echo.

:: 3. Verificacao de Arquivo
if not exist "%~dp0${agentFile}" (
    echo [ERRO] Arquivo nao encontrado: "${agentFile}"
    pause
    exit /b
)

:: 4. Execucao
"%PS_CMD%" -ExecutionPolicy Bypass -File "%~dp0${agentFile}" -OperationID "%OPERATION_ID%" -AgentID "%AGENT_ID%" -LocalServer "%LOCAL_SERVER%" -LocalDatabase "%LOCAL_DATABASE%" -SqlUser "%SQL_USER%" -SqlPassword "%SQL_PASSWORD%" -ApiBaseUrl "%API_BASE_URL%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha na execucao. Verifique os logs acima.
) else (
    echo.
    echo [SUCESSO] Sincronizacao finalizada.
)

echo.
pause
`;

  return new NextResponse(batContent.replace(/\r?\n/g, '\r\n'), {
    headers: {
      'Content-Type': 'application/x-bat',
      'Content-Disposition': `attachment; filename="configurar_agente_${op.codigo_operacao || 'operacao'}.bat"`,
    },
  });
}
