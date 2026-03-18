import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session, context) => {
  const userId = session.user.id as string;
  const { id } = await context.params;
  const supabase = await getAuditedClient(userId);

  const { data: alerta, error } = await supabase
    .from('metas_faturamento_alertas')
    .select(`
      *,
      meta:metas_faturamento(*),
      operacao:operacoes!operacao_id(*),
      apuracao:metas_faturamento_apuracoes!apuracao_id(*),
      tratativa:metas_faturamento_tratativas!alerta_id(
        *,
        auditor:usuarios!auditor_responsavel_id(id, nome)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !alerta) return NextResponse.json({ error: 'Alerta não encontrado' }, { status: 404 });
  
  return NextResponse.json(alerta);
});
