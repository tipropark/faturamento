import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const perfil = (session.user as any).perfil;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  const operacaoId = searchParams.get('operacao_id');
  const status = searchParams.get('status');
  const criticidade = searchParams.get('criticidade');

  let query = supabase
    .from('metas_faturamento_alertas')
    .select(`
      *,
      meta:metas_faturamento(ano, mes, valor_meta),
      operacao:operacoes!operacao_id(id, nome_operacao, bandeira),
      apuracao:metas_faturamento_apuracoes!apuracao_id(*),
      tratativa:metas_faturamento_tratativas!alerta_id(
        *,
        auditor:usuarios!auditor_responsavel_id(id, nome)
      )
    `)
    .order('gerado_em', { ascending: false });

  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (status) query = query.eq('status', status);
  if (criticidade) query = query.eq('criticidade', criticidade);
  
  // Escopo por perfil
  if (perfil === 'supervisor') {
    query = query.eq('operacoes.supervisor_id', userId);
  } else if (perfil === 'gerente_operacoes') {
    query = query.eq('operacoes.gerente_operacoes_id', userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
});
