import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = await createAdminClient();
  const { searchParams } = new URL(req.url);
  const perfil = searchParams.get('perfil');

  let query = supabase
    .from('usuarios')
    .select(`
      id, nome, email, perfil, telefone, status, ativo,
      gerente_operacoes_id,
      gerente:usuarios!gerente_operacoes_id(id, nome)
    `)
    .order('nome');

  if (perfil) query = query.eq('perfil', perfil);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const perfil = (session.user as any).perfil;
  if (!['administrador', 'administrativo'].includes(perfil)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await req.json();
  const { nome, email, senha, perfil: userPerfil, telefone, gerente_operacoes_id } = body;

  if (!nome || !email || !senha || !userPerfil) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      nome,
      email,
      senha_hash: senhaHash,
      perfil: userPerfil,
      telefone: telefone || null,
      gerente_operacoes_id: gerente_operacoes_id || null,
      status: 'ativo',
      ativo: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
