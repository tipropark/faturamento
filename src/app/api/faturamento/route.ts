import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('mode'); // 'dashboard', 'movimentos', 'operacao_detalhe'
  const filterOperacao = searchParams.get('operacao_id');
  const dStart = searchParams.get('data_inicio');
  const dEnd = searchParams.get('data_fim');

  if (mode === 'all_data') {
      // 1. Buscar operações permitidas
      let opsQuery = supabase.from('operacoes').select('*').eq('habilitar_faturamento', true).eq('status', 'ativa');
      if (perfil === 'supervisor') opsQuery = opsQuery.eq('supervisor_id', userId);
      if (perfil === 'gerente_operacoes') opsQuery = opsQuery.eq('gerente_operacoes_id', userId);
      const { data: operacoes, error: errOps } = await opsQuery;

      if (errOps || !operacoes || operacoes.length === 0) {
        return NextResponse.json({ operacoes: [], resumos: [], movimentos: [] });
      }

      const opIds = operacoes.map(o => o.id);

      // 2. Buscar Resumos Diários (Base oficial para Dashboards e Histórico)
      const dataLimiteResumo = new Date();
      dataLimiteResumo.setDate(dataLimiteResumo.getDate() - 90);
      const isoLimiteResumo = dataLimiteResumo.toISOString().split('T')[0];

      const { data: resumos, error: errResumo } = await supabase
         .from('faturamento_resumo_diario')
         .select('*')
         .in('operacao_id', opIds)
         .gte('data_referencia', isoLimiteResumo)
         .order('data_referencia', { ascending: false })
         .limit(20000); // 90 dias x 200 ops = 18k rows. Garantindo histórico completo.

      // 3. Buscar "Lite Summary Movements" foi REMOVIDO para escalabilidade.
      // A Dashboard agora confia 100% na tabela de resumo consolidada.
      // NENHUM registro bruto será transferido no carregamento inicial, evitando qualquer limite da API.

      // 4. Buscar Ajustes Financeiros
      const { data: ajustes, error: errAjustes } = await supabase
         .from('faturamento_ajustes')
         .select('*')
         .in('operacao_id', opIds)
         .gte('data_referencia', isoLimiteResumo)
         .order('criado_em', { ascending: false })
         .limit(10000);

      return NextResponse.json({
        operacoes,
        resumos: resumos || [],
        movimentos: [], // Garantindo que o dashboard inicial seja ultraleve
        ajustes: ajustes || []
      });
  }

  // Novo modo para detalhes sob demanda (Escalável - Evita carregar tudo de uma vez)
  if (mode === 'details') {
    const opId = searchParams.get('operacao_id');
    const date = searchParams.get('date');
    if (!opId || !date) return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });

    const { data: movs, error: errMov } = await supabase
       .from('faturamento_movimentos')
       .select('*')
       .eq('operacao_id', opId)
       .or(`data_saida.gte.${date}T00:00:00,data_entrada.gte.${date}T00:00:00,criado_em.gte.${date}T00:00:00`)
       .or(`data_saida.lte.${date}T23:59:59,data_entrada.lte.${date}T23:59:59,criado_em.lte.${date}T23:59:59`)
       .order('data_saida', { ascending: false, nullsFirst: false })
       .order('criado_em', { ascending: false })
       .limit(50000); 

    if (errMov) return NextResponse.json({ error: errMov.message }, { status: 500 });
    return NextResponse.json(movs);
  }

  // Fallback antigo caso chame histórico cru
  let query = supabase
    .from('faturamento_movimentos')
    .select(`*, operacao:operacoes!operacao_id(id, nome_operacao, bandeira)`)
    .order('data_saida', { ascending: false })
    .limit(100);

  if (filterOperacao) query = query.eq('operacao_id', filterOperacao);
  if (dStart) query = query.gte('data_saida', dStart);
  if (dEnd) query = query.lte('data_saida', dEnd + 'T23:59:59');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
