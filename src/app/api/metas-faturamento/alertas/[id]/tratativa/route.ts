import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const POST = withAudit(async (req, session, context) => {
  const userId = session.user.id as string;
  const perfil = (session.user as any).perfil;
  const { id } = await context.params; // alerta_id
  
  if (perfil !== 'auditoria' && perfil !== 'administrador') {
    return NextResponse.json({ error: 'Acesso negado. Apenas Auditoria pode tratar alertas.' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  // 1. Verificar se já existe uma tratativa para este alerta
  const { data: existing } = await supabase
    .from('metas_faturamento_tratativas')
    .select('id')
    .eq('alerta_id', id)
    .maybeSingle();

  let resTratativa;
  if (existing) {
    // Atualizar
    resTratativa = await supabase
      .from('metas_faturamento_tratativas')
      .update({
        ...body,
        auditor_responsavel_id: userId,
        concluida_em: ['concluida', 'sem_procedencia'].includes(body.status) ? new Date().toISOString() : null,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    // Criar (caso não tenha sido gerada automaticamente)
    resTratativa = await supabase
      .from('metas_faturamento_tratativas')
      .insert({
        ...body,
        alerta_id: id,
        auditor_responsavel_id: userId,
        concluida_em: ['concluida', 'sem_procedencia'].includes(body.status) ? new Date().toISOString() : null
      })
      .select()
      .single();
  }

  if (resTratativa.error) {
    return NextResponse.json({ error: resTratativa.error.message }, { status: 500 });
  }

  // 2. Sincronizar status do Alerta
  await supabase
    .from('metas_faturamento_alertas')
    .update({ 
        status: body.status === 'pendente' ? 'aberto' : 
                ['concluida', 'sem_procedencia'].includes(body.status) ? 'concluido' : 'em_analise'
    })
    .eq('id', id);

  return NextResponse.json(resTratativa.data);
});
