import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { apurarMeta, processarAlertasMeta } from '@/lib/metas-utils';

export const dynamic = 'force-dynamic';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  const withDiarias = searchParams.get('with_diarias') === 'true';
  const metaId = searchParams.get('id');
  const ano = searchParams.get('ano');
  const mes = searchParams.get('mes');
  const operacaoId = searchParams.get('operacao_id');
  const tipo = searchParams.get('tipo_meta');

  // Construção dinâmica do SELECT para reduzir payload
  let selectStr = `
    *,
    operacao:operacoes(id, nome_operacao, bandeira),
    apuracao:metas_faturamento_apuracoes!meta_id(*)
  `;
  
  if (withDiarias) {
    selectStr += `, diarias:metas_faturamento_apuracoes_diarias!meta_id(*)`;
  }

  let query = supabase
    .from('metas_faturamento')
    .select(selectStr)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false });

  if (metaId) query = query.eq('id', metaId);
  if (ano) query = query.eq('ano', Number(ano));
  if (mes) query = query.eq('mes', Number(mes));
  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (tipo) query = query.eq('tipo_meta', tipo);
  
  // Garantir que só metas ativas apareçam
  query = query.eq('status', 'ativa');

  // Escopo por perfil usando !inner para filtro em tabela relacionada
  if (perfil === 'supervisor') {
    query = query.filter('operacao!inner.supervisor_id', 'eq', userId);
  } else if (perfil === 'gerente_operacoes') {
    query = query.filter('operacao!inner.gerente_operacoes_id', 'eq', userId);
  }

  console.log('--- DEBUG API METAS ---');
  console.log('Perfil:', perfil, 'ID:', userId, 'Filtros:', { ano, mes });

  const { data, error } = await query;
  if (error) {
    console.error('ERRO API METAS:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('Metas brutas encontradas:', data?.length);
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  // 1. Validar Duplicidade
  const isUUID = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const opId = isUUID(body.operacao_id) ? body.operacao_id : null;
  
  let checkQuery = supabase
    .from('metas_faturamento')
    .select('id')
    .eq('ano', body.ano)
    .eq('mes', body.mes)
    .eq('status', 'ativa');
    
  if (opId) checkQuery = checkQuery.eq('operacao_id', opId);
  else checkQuery = checkQuery.is('operacao_id', null);

  const { data: existingMeta } = await checkQuery.maybeSingle();

  if (existingMeta) {
    return NextResponse.json({ 
      error: 'Já existe uma meta cadastrada para esta operação neste período.' 
    }, { status: 409 });
  }

  // 2. Criar Meta
  const { operacao_id: bodyOpId, ...sanitizedBody } = body;
  const payload = {
    ...sanitizedBody,
    operacao_id: opId,
    criado_por_id: userId,
    status: 'ativa'
  };

  const { data: meta, error } = await supabase
    .from('metas_faturamento')
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Disparar apuracao inicial (via RPC interno)
  try {
      const respApuracao = await apurarMeta(supabase, meta);
      if (respApuracao) {
        // Alertas só se a apuração existir
        await processarAlertasMeta(supabase, respApuracao);
      }
  } catch (err: any) {
      console.error('Falha na apuração inicial:', err.message);
  }

  return NextResponse.json(meta, { status: 201 });
});
