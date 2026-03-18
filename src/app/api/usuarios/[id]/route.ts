import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, telefone, status, ativo, gerente_operacoes_id')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const perfilSession = (session.user as any).perfil;
  if (!['administrador', 'administrativo'].includes(perfilSession)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { nome, email, perfil, telefone, status, ativo, gerente_operacoes_id, senha } = body;

  const supabase = await createAdminClient();

  const updates: any = {
    nome, email, perfil, telefone: telefone || null,
    status, ativo,
    gerente_operacoes_id: gerente_operacoes_id || null,
  };

  if (senha) {
    updates.senha_hash = await bcrypt.hash(senha, 10);
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('usuarios')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
