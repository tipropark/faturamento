import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { FaturamentoAlertEngine } from '@/lib/faturamento-alertas';

/**
 * Endpoint para disparar o re-processamento global de alertas (Job)
 * Pode ser chamado por um cron externo (Vercel Cron, GitHub Actions, etc)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Proteção simples por token (Ideal: usar headers de autorização ou chave de API interna)
  if (token !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const engine = new FaturamentoAlertEngine();
  const startTime = Date.now();

  try {
    const result = await engine.processarJobGlobal();
    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
        success: true,
        message: 'Processamento global concluído',
        duration_seconds: duration,
        details: result
    });
  } catch (error: any) {
    return NextResponse.json({
        success: false,
        error: error.message
    }, { status: 500 });
  }
}
