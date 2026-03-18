import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const { id } = session.params;
  const supabase = await getAuditedClient(userId);

  const { data: alerta, error } = await supabase
    .from('metas_faturamento_alertas')
    .select(`
      *,
      meta:metas_faturamento(*),
      operacao:operacoes!operacao_id(id, nome_operacao, bandeira, supervisor_id, gerente_operacoes_id, ultima_sincronizacao),
      apuracao:metas_faturamento_apuracoes!apuracao_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Buscar tratativa
  const { data: tratativa } = await supabase
    .from('metas_faturamento_tratativas')
    .select(`
      *,
      auditor:usuarios!auditor_responsavel_id(id, nome)
    `)
    .eq('alerta_id', id)
    .single();

  return NextResponse.json({ ...alerta, tratativa });
});

export const PUT = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const { id } = session.params; // id do alerta
  const body = await req.json(); // { status, tratativaParams }
  const supabase = await getAuditedClient(userId);

  // 1. Atualizar Alerta
  if (body.status_alerta) {
    await supabase
        .from('metas_faturamento_alertas')
        .update({ status: body.status_alerta })
        .eq('id', id);
  }

  // 2. Upsert Tratativa
  const { tratativa } = body;
  if (tratativa) {
      const { data: existing } = await supabase
        .from('metas_faturamento_tratativas')
        .select('id')
        .eq('alerta_id', id)
        .single();
        
      if (existing) {
          await supabase
            .from('metas_faturamento_tratativas')
            .update({ 
                ...tratativa, 
                atualizado_em: new Date().toISOString() 
            })
            .eq('id', existing.id);
      } else {
          await supabase
            .from('metas_faturamento_tratativas')
            .insert({ 
                ...tratativa, 
                alerta_id: id,
                criado_em: new Date().toISOString() 
            });
      }
  }

  return NextResponse.json({ success: true });
});
