import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'list'; // 'list' ou 'stats'

  const supabase = await createAdminClient();

  if (mode === 'stats') {
    // Queries agregadas para o dashboard
    const { count: total } = await supabase.from('auditoria_administrativa').select('*', { count: 'exact', head: true });
    const { count: criticos } = await supabase.from('auditoria_administrativa').select('*', { count: 'exact', head: true }).in('criticidade', ['alta', 'critica']);
    const { count: falhas } = await supabase.from('auditoria_administrativa').select('*', { count: 'exact', head: true }).eq('status', 'falha');
    const { count: hoje } = await supabase.from('auditoria_administrativa').select('*', { count: 'exact', head: true }).gte('criado_em', new Date(new Date().setHours(0,0,0,0)).toISOString());
    
    return NextResponse.json({
      total: total || 0,
      criticos: criticos || 0,
      falhas: falhas || 0,
      hoje: hoje || 0
    });
  }

  // Filtros de Listagem
  const modulo = searchParams.get('modulo');
  const submodulo = searchParams.get('submodulo');
  const usuarioId = searchParams.get('usuarioId');
  const acao = searchParams.get('acao');
  const status = searchParams.get('status');
  const criticidade = searchParams.get('criticidade');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  const registroId = searchParams.get('registroId');
  const busca = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase
    .from('auditoria_administrativa')
    .select('*, usuario:usuarios(id, nome, email, perfil)', { count: 'exact' })
    .order('criado_em', { ascending: false });

  if (modulo) query = query.eq('modulo', modulo);
  if (submodulo) query = query.eq('submodulo', submodulo);
  if (usuarioId) query = query.eq('usuario_id', usuarioId);
  if (status) query = query.eq('status', status);
  if (criticidade) query = query.eq('criticidade', criticidade);
  if (registroId) query = query.eq('registro_id', registroId);
  
  if (acao) query = query.ilike('acao', `%${acao}%`);
  if (busca) query = query.or(`descricao.ilike.%${busca}%,acao.ilike.%${busca}%,entidade_afetada.ilike.%${busca}%`);

  if (dataInicio) query = query.gte('criado_em', dataInicio);
  if (dataFim) query = query.lte('criado_em', dataFim);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count
    }
  });
}
