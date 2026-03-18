import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';
import { auth } from '@/lib/auth';

// Listar inconsistências de um sinistro
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const userId = session.user.id as string;

  const supabase = await getAuditedClient(userId);
  const { data, error } = await supabase
    .from('inconsistencias')
    .select('*, analisado_por:usuarios!analisado_por_id(id, nome)')
    .eq('sinistro_id', id)
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Criar nova inconsistência
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const userId = session.user.id as string;

  const supabase = await getAuditedClient(userId);
  
  // Garantir que o criado_por_id venha da sessão se não estiver no corpo,
  // ou preferir o da sessão por segurança.
  const payload = {
    ...body,
    sinistro_id: id,
    criado_por_id: userId
  };

  const { data, error } = await supabase
    .from('inconsistencias')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar inconsistência:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Histórico
  await supabase.from('historico_sinistros').insert({
    sinistro_id: id,
    usuario_id: userId,
    acao: 'inconsistencia_aberta',
    descricao: `Inconsistência aberta: ${body.tipo}`,
  });

  return NextResponse.json(data, { status: 201 });
}
