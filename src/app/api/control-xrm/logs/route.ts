import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';


// ... (comentários omitidos no replace para brevidade)

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const systemApiKey = process.env.CONTROL_XRM_LOG_API_KEY; // Nota: Defina esta variável no seu .env

    let supabase;

    // 1. Validar Autenticação (API Key para Scripts OU Sessão para Usuários)
    if (apiKey && systemApiKey && apiKey === systemApiKey) {
      supabase = await createAdminClient(); // Usa service_role para scripts autorizados
    } else {
      const session = await auth();
      if (!session) {
        return NextResponse.json({
          error: 'Não autorizado. Forneça uma x-api-key válida ou esteja logado.'
        }, { status: 401 });
      }
      supabase = await createAdminClient();
    }

    const body = await req.json();

    // Extração e validação do payload técnico
    const {
      data_hora_log,
      nivel,
      etapa,
      mensagem,
      arquivo_nome,
      arquivo_caminho,
      quantidade_linhas,
      status_execucao,
      detalhes_json
    } = body;

    if (!mensagem || !etapa || !nivel) {
      return NextResponse.json({ error: 'Campos obrigatórios (mensgem, etapa, nivel) ausentes.' }, { status: 400 });
    }

    // Persistência isolada na tabela control_xrm_logs
    const { data: logEntry, error } = await supabase
      .from('control_xrm_logs')
      .insert({
        data_hora_log: data_hora_log || new Date().toISOString(),
        nivel: nivel.toUpperCase(),
        etapa: etapa.toUpperCase(),
        mensagem,
        arquivo_nome,
        arquivo_caminho,
        quantidade_linhas: Number(quantidade_linhas) || 0,
        status_execucao: status_execucao?.toUpperCase(),
        detalhes_json: detalhes_json || {},
        criado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[DATABASE ERROR] control_xrm_logs:', error);
      return NextResponse.json({ error: 'Erro ao persistir log técnico.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: logEntry.id }, { status: 201 });

  } catch (err: any) {
    console.error('[INTERNAL ERROR] control_xrm_logs_api:', err);
    return NextResponse.json({ error: 'Erro interno no processamento do log.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const systemApiKey = process.env.CONTROL_XRM_LOG_API_KEY;
    
    let supabase;

    if (apiKey && systemApiKey && apiKey === systemApiKey) {
      supabase = await createAdminClient();
    } else {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado. Forneça x-api-key ou faça login.' }, { status: 401 });
      }
      supabase = await createAdminClient();
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const nivel = searchParams.get('nivel');
    const etapa = searchParams.get('etapa');
    const dataFilter = searchParams.get('data'); // formato YYYY-MM-DD

    let query = supabase
      .from('control_xrm_logs')
      .select('*', { count: 'exact' })
      .order('data_hora_log', { ascending: false })
      .range(offset, offset + limit - 1);

    if (nivel) query = query.eq('nivel', nivel.toUpperCase());
    if (etapa) query = query.eq('etapa', etapa.toUpperCase());
    
    if (dataFilter) {
      // Ajuste para o fuso vindo do Brasil (UTC-3)
      // O dia civil no Brasil (ex: 01/04) em UTC começa às 03:00 do dia 01 e vai até as 02:59 do dia 02.
      const date = new Date(dataFilter + 'T00:00:00Z');
      const nextDate = new Date(date);
      nextDate.setUTCDate(date.getUTCDate() + 1);
      
      const nextDayStr = nextDate.toISOString().split('T')[0];

      query = query
        .gte('data_hora_log', `${dataFilter}T03:00:00.000Z`)
        .lte('data_hora_log', `${nextDayStr}T02:59:59.999Z`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count,
      pagination: {
        limit,
        offset,
        total: count
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno ao listar logs.' }, { status: 500 });
  }
}
