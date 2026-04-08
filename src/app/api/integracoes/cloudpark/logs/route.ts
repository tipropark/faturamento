import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const dataFilter = searchParams.get('data'); // YYYY-MM-DD

    // Primeiro buscar sem join para diagnóstico
    let query = supabase
      .from('faturamento_integracao_cloudpark_logs')
      .select('*, operacao:operacoes(nome_operacao)', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status_processamento', status.toUpperCase());

    if (dataFilter) {
      // Ajuste fuso Brasil (UTC-3): dia civil começa 03:00 UTC
      const nextDate = new Date(dataFilter + 'T00:00:00Z');
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      const nextDayStr = nextDate.toISOString().split('T')[0];

      query = query
        .gte('criado_em', `${dataFilter}T03:00:00.000Z`)
        .lte('criado_em', `${nextDayStr}T02:59:59.999Z`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[CLOUDPARK_LOGS_API]', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data, count, pagination: { limit, offset, total: count } });

  } catch (err: any) {
    console.error('[CLOUDPARK_LOGS_API_CATCH]', err);
    return NextResponse.json({ error: 'Erro interno ao listar logs.', message: err.message }, { status: 500 });
  }
}
