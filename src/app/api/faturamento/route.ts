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

      // 2. Buscar Resumos Diários (Base oficial para Dashboards e Gráficos)
      // Buscamos os últimos 90 dias para garantir cobertura completa de competência
      const dataLimiteResumo = new Date();
      dataLimiteResumo.setDate(dataLimiteResumo.getDate() - 90);
      const isoLimiteResumo = dataLimiteResumo.toISOString().split('T')[0];

      const { data: resumos, error: errResumo } = await supabase
         .from('faturamento_resumo_diario')
         .select('*')
         .in('operacao_id', opIds)
         .gte('data_referencia', isoLimiteResumo)
         .order('data_referencia', { ascending: false });

      // 3. Buscar Movimentos Brutos (Buffer de 7 dias para Auditoria Fina / Conferência)
      const dataLimiteBuffer = new Date();
      dataLimiteBuffer.setDate(dataLimiteBuffer.getDate() - 7);
      const isoLimiteBuffer = dataLimiteBuffer.toISOString();

      const { data: movimentos, error: errMov } = await supabase
         .from('faturamento_movimentos')
         .select('*')
         .in('operacao_id', opIds)
         .or(`data_saida.gte.${isoLimiteBuffer},and(data_saida.is.null,data_entrada.gte.${isoLimiteBuffer})`)
         .order('data_saida', { ascending: false, nullsFirst: false });

      // 4. Buscar Ajustes Financeiros (Apenas ativos/aprovados para exibição e gestão)
      const { data: ajustes, error: errAjustes } = await supabase
         .from('faturamento_ajustes')
         .select('*')
         .in('operacao_id', opIds)
         .gte('data_referencia', isoLimiteResumo)
         .order('criado_em', { ascending: false });

      return NextResponse.json({
        operacoes,
        resumos: resumos || [],
        movimentos: movimentos || [],
        ajustes: ajustes || []
      });
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
