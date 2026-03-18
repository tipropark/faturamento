import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const perfilIdentificador = searchParams.get('perfil');

  const supabase = await createAdminClient();
  let query = supabase
    .from('usuarios')
    .select('id, nome, email, perfil, status, ativo')
    .order('nome', { ascending: true });

  if (perfilIdentificador) {
    query = query.eq('perfil', perfilIdentificador);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { usuarioId, novoPerfil } = await req.json();
  const userId = session.user.id;
  const supabase = await createAdminClient();

  // Buscar antigo para auditoria
  const { data: usuarioAntigo } = await supabase
    .from('usuarios')
    .select('nome, perfil')
    .eq('id', usuarioId)
    .single();

  const { data, error } = await supabase
    .from('usuarios')
    .update({ perfil: novoPerfil })
    .eq('id', usuarioId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordAuditLog(req, {
    usuarioId: userId,
    modulo: 'usuarios',
    acao: 'change_user_profile',
    descricao: `Alteração de perfil do usuário ${usuarioAntigo?.nome}: ${usuarioAntigo?.perfil} -> ${novoPerfil}`,
    entidade: 'usuarios',
    registroId: usuarioId,
    dadosAnteriores: { perfil: usuarioAntigo?.perfil },
    dadosNovos: { perfil: novoPerfil },
    criticidade: 'alta', // Mudança de perfil de usuário é sensível
    status: 'sucesso'
  });

  return NextResponse.json(data);
}
