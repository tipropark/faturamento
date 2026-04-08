import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = await createClient();

  // Buscar Departamentos
  const { data: departamentos, error: deptoError } = await supabase
    .from('central_departamentos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (deptoError) {
    console.error('Erro ao buscar departamentos:', deptoError);
    return NextResponse.json({ error: 'Erro ao buscar departamentos' }, { status: 500 });
  }

  // Buscar Categorias
  const { data: categorias } = await supabase
    .from('central_categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  // Buscar Subcategorias
  const { data: subcategorias } = await supabase
    .from('central_subcategorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  // Buscar Status
  const { data: status } = await supabase
    .from('central_status')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  // Buscar Prioridades
  const { data: prioridades } = await supabase
    .from('central_prioridades')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  // Buscar Operações
  const { data: operacoes } = await supabase
    .from('operacoes')
    .select('id, nome_operacao')
    .order('nome_operacao', { ascending: true });

  return NextResponse.json({
    departamentos,
    categorias,
    subcategorias,
    status,
    prioridades,
    operacoes
  });
}
