import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: sinistroId } = await params;
  const userId = session.user.id as string;
  const body = await req.json();
  const { acao, descricao } = body;

  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('historico_sinistros')
    .insert({ sinistro_id: sinistroId, usuario_id: userId, acao, descricao })
    .select(`*, usuario:usuarios!usuario_id(id, nome)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
