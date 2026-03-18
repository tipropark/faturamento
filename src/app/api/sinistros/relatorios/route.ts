import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dataInicio = searchParams.get('data_inicio');
  const dataFim = searchParams.get('data_fim');
  const status = searchParams.get('status');
  const operacaoId = searchParams.get('operacao_id');
  const supervisorId = searchParams.get('supervisor_id');
  const uf = searchParams.get('uf');

  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);

  // Construir consulta base para filtros
  // Como o Supabase não faz GROUP BY complexo via JS Client facilmente para múltiplos níveis,
  // vamos buscar os dados e processar no Node ou rodar queries separadamente.
  
  let query = supabase
    .from('sinistros')
    .select(`
      id, status, operacao_id, supervisor_id, criado_em,
      operacao:operacoes!operacao_id(nome_operacao, uf, cidade),
      supervisor:usuarios!supervisor_id(nome)
    `);

  if (dataInicio) query = query.gte('criado_em', dataInicio);
  if (dataFim) query = query.lte('criado_em', dataFim + 'T23:59:59');
  if (status) query = query.eq('status', status);
  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (supervisorId) query = query.eq('supervisor_id', supervisorId);
  if (uf) query = query.filter('operacao.uf', 'eq', uf);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Processar indicadores
  const porOperacao: Record<string, number> = {};
  const porSupervisor: Record<string, number> = {};
  const porEstado: Record<string, number> = {};

  data?.forEach((s: any) => {
    const opNome = s.operacao?.nome_operacao || 'Desconhecida';
    const supNome = s.supervisor?.nome || 'Não definido';
    const estado = s.operacao?.uf || 'Externo';

    porOperacao[opNome] = (porOperacao[opNome] || 0) + 1;
    porSupervisor[supNome] = (porSupervisor[supNome] || 0) + 1;
    porEstado[estado] = (porEstado[estado] || 0) + 1;
  });

  return NextResponse.json({
    total: data?.length || 0,
    porOperacao: Object.entries(porOperacao).map(([nome, qtd]) => ({ nome, qtd })),
    porSupervisor: Object.entries(porSupervisor).map(([nome, qtd]) => ({ nome, qtd })),
    porEstado: Object.entries(porEstado).map(([nome, qtd]) => ({ nome, qtd })),
  });
}
