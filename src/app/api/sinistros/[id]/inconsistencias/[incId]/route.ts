import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';
import { auth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, incId: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id, incId } = await params;
  const body = await req.json();
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);

  // Regra: Gestão deve registrar motivo ao aprovar/reprovar
  if ((body.status === 'aprovada' || body.status === 'reprovada') && !body.motivo_decisao) {
    return NextResponse.json({ error: 'Motivo da decisão é obrigatório' }, { status: 400 });
  }

  const updateData = {
    ...body,
    analisado_por_id: userId,
    data_decisao: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('inconsistencias')
    .update(updateData)
    .eq('id', incId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Histórico
  await supabase.from('historico_sinistros').insert({
    sinistro_id: id,
    usuario_id: userId,
    acao: 'inconsistencia_decisao',
    descricao: `Inconsistência "${data.tipo}" marcada como ${data.status}. Motivo: ${data.motivo_decisao || '-'}`,
  });

  return NextResponse.json(data);
}
