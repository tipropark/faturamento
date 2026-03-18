import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { tipo, config } = await req.json();

  if (tipo === 'google_drive') {
    return testGoogleDrive(config);
  } else if (tipo === 'supabase') {
    return testSupabase(config);
  }

  return NextResponse.json({ error: 'Tipo de teste inválido' }, { status: 400 });
}

async function testGoogleDrive(config: any) {
  const clientId = config.find((c: any) => c.chave === 'GOOGLE_CLIENT_ID')?.valor;
  const clientSecret = config.find((c: any) => c.chave === 'GOOGLE_CLIENT_SECRET')?.valor;
  const refreshToken = config.find((c: any) => c.chave === 'GOOGLE_REFRESH_TOKEN')?.valor;
  const folderId = config.find((c: any) => c.chave === 'GOOGLE_DRIVE_FOLDER_ID')?.valor;

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ 
      success: false, 
      message: 'Credenciais incompletas para teste.',
      status: 'erro_preenchimento'
    });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Teste 1: Tentar obter informações do token / Validar autenticação
    const tokenInfo = await oauth2Client.getAccessToken();
    if (!tokenInfo.token) {
      return NextResponse.json({ 
        success: false, 
        message: 'Falha ao obter access token. Verifique o Refresh Token e as credenciais.',
        status: 'token_invalido'
      });
    }

    // Teste 2: Validar acesso à pasta (se informada)
    if (folderId && folderId !== 'root') {
      try {
        const folder = await drive.files.get({
          fileId: folderId,
          fields: 'id, name, mimeType, trashed'
        });

        if (folder.data.trashed) {
           return NextResponse.json({ 
            success: false, 
            message: 'A pasta configurada está na lixeira.',
            status: 'pasta_na_lixeira'
          });
        }

        if (folder.data.mimeType !== 'application/vnd.google-apps.folder') {
          return NextResponse.json({ 
            success: false, 
            message: 'O ID informado não pertence a uma pasta.',
            status: 'id_invalido'
          });
        }
      } catch (fError: any) {
        return NextResponse.json({ 
          success: false, 
          message: `Pasta não encontrada ou sem permissão: ${fError.message}`,
          status: 'pasta_nao_encontrada'
        });
      }
    }

    // Teste 3: Listagem básica para validar API
    await drive.files.list({ pageSize: 1 });

    return NextResponse.json({ 
      success: true, 
      message: 'Conexão válida. Autenticação e acesso à API confirmados.',
      status: 'sucesso'
    });

  } catch (error: any) {
    let status = 'falha_comunicacao';
    let msg = error.message;

    if (msg.includes('invalid_client')) status = 'credenciais_invalidas';
    if (msg.includes('invalid_grant')) status = 'token_expirado';

    return NextResponse.json({ 
      success: false, 
      message: `Erro na comunicação com Google: ${msg}`,
      status
    });
  }
}

async function testSupabase(config: any) {
  const url = config.find((c: any) => c.chave === 'NEXT_PUBLIC_SUPABASE_URL')?.valor;
  const key = config.find((c: any) => c.chave === 'SUPABASE_SERVICE_ROLE_KEY')?.valor || 
              config.find((c: any) => c.chave === 'NEXT_PUBLIC_SUPABASE_ANON_KEY')?.valor;

  if (!url || !key) {
    return NextResponse.json({ 
      success: false, 
      message: 'Parâmetros mínimos (URL e Chave) não informados.',
      status: 'erro_preenchimento'
    });
  }

  try {
    // Validar URL básica
    new URL(url);

    const supabase = createClient(url, key);

    // Teste 1: Tentar uma consulta simples (ex: ler schema de uma tabela que deva existir, ou apenas bater no endpoint)
    // Usamos health check por auth ou pegando uma linha de usuarios (que sempre existe no schema deste ERP)
    const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });

    if (error) {
       return NextResponse.json({ 
        success: false, 
        message: `Erro ao autenticar no Supabase: ${error.message}`,
        status: error.code === '401' ? 'chave_invalida' : 'falha_autenticacao'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conexão válida. Acesso ao banco de dados confirmado.',
      status: 'sucesso'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: `Erro de conexão: ${error.message}`,
      status: error.message.includes('Invalid URL') ? 'url_invalida' : 'falha_comunicacao'
    });
  }
}
