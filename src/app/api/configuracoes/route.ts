import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(session.user.id);
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .select('*')
    .order('categoria', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sincronização inteligente com variáveis de ambiente para exibição
  const configsComFallback = (data || []).map(config => {
    const valorOriginal = config.valor;
    const isPlaceholder = valorOriginal === 'vazio' || valorOriginal === 'root' || valorOriginal?.includes('vazio.supabase.co') || !valorOriginal;
    
    if (isPlaceholder && process.env[config.chave]) {
      return { ...config, valor: process.env[config.chave], info: 'Carregado de ENV' };
    }
    return config;
  });

  return NextResponse.json(configsComFallback);
});

export const PATCH = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const { id, valor } = await req.json();
  const userId = session.user.id;
  
  // Usamos o Cliente Auditado. O Trigger fn_auditoria_global_automatica no Postgres
  // irá detectar a alteração e criar o log com Antes x Depois automaticamente.
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .update({ 
      valor, 
      atualizado_por_id: userId,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
});
