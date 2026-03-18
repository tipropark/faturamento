import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Cliente externo da coleta-prescon
const OLD_SUPABASE_URL = 'https://rpgqifkauzzyvrtwhdsp.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ3FpZmthdXp6eXZydHdoZHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODAyMzIsImV4cCI6MjA4OTA1NjIzMn0.5P4TvnC5GyCY_GmNCpUkid8nrdz5fr1ws-RqGacjz-w';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
    const newClient = await createAdminClient();

    // 1. Obter Operações Antigas
    const { data: oldOps, error: errOps } = await oldClient.from('operations').select('*');
    if (errOps || !oldOps) return NextResponse.json({ error: 'Erro ao conectar base antiga', details: errOps }, { status: 500 });

    const logs: string[] = [];
    logs.push(`${oldOps.length} operações encontradas na base antiga.`);

    const mapOperacoes = new Map<string, string>(); // id_legado -> novo_id

    // Buscar o perfil admin para operações novas
    const { data: admin } = await newClient.from('usuarios').select('id').eq('perfil', 'administrador').limit(1).single();

    for (const op of oldOps) {
      // Tenta encontrar operação equivalente pelo slug
      const { data: exOp } = await newClient
        .from('operacoes')
        .select('id')
        .or(`slug.eq.${op.slug},codigo_operacao.eq.${op.slug}`)
        .limit(1)
        .single();

      if (exOp) {
         logs.push(`Atualizando metadados da operação: ${op.name}`);
         await newClient.from('operacoes').update({
           id_legado: op.id,
           slug: op.slug,
           sql_server: op.sql_server,
           sql_database: op.sql_database,
           automacao_tipo: op.automation_type || 'PARCO'
         }).eq('id', exOp.id);
         
         mapOperacoes.set(op.id, exOp.id);
      } else {
         logs.push(`Criando nova operação no ERP: ${op.name}`);
         const { data: novaOp, error: errNovaOp } = await newClient.from('operacoes').insert({
           nome_operacao: op.name,
           codigo_operacao: op.slug.substring(0, 50),
           bandeira: 'Outros',
           tipo_operacao: 'outro',
           cidade: 'Não informada',
           uf: 'SP',
           quantidade_vagas: 0,
           possui_cftv: false,
           status: op.active ? 'ativa' : 'inativa',
           supervisor_id: admin?.id,
           id_legado: op.id,
           slug: op.slug,
           sql_server: op.sql_server,
           sql_database: op.sql_database,
           automacao_tipo: op.automation_type || 'PARCO'
         }).select('id').single();

         if (novaOp) mapOperacoes.set(op.id, novaOp.id);
         if (errNovaOp) logs.push(`Erro nova operação: ${errNovaOp.message}`);
      }
    }

    // 3. Migrar Movimentações
    let totalMigrado = 0;
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: movs, error: errMovs } = await oldClient
        .from('movimentos_central')
        .select('*')
        .range(offset, offset + limit - 1);

      if (errMovs || !movs) break;
      if (movs.length === 0) {
        hasMore = false;
        break;
      }

      logs.push(`[+] Processando ${movs.length} movimentações a partir de ${offset}...`);
      
      const movsParaInserir = movs.map((m: any) => {
        const newOpId = mapOperacoes.get(m.operation_id);
        if (!newOpId) return null;

        return {
          operacao_id: newOpId,
          ticket_id: m.ticket_id?.toString() || null,
          data_entrada: m.data_entrada,
          data_saida: m.data_saida,
          valor: m.valor,
          forma_pagamento: m.forma_pagamento,
          tipo_movimento: m.tipo_movimento || 'Avulso',
          descricao: m.descricao,
          ticket_label: m.ticket_label,
          data_importacao: m.data_importacao,
          id_legado: m.id
        };
      }).filter(Boolean);

      if (movsParaInserir.length > 0) {
        // Ignora duplicações passadas através do onConflict id_legado
        const { error: errInsert } = await newClient
          .from('faturamento_movimentos')
          .upsert(movsParaInserir, { onConflict: 'id_legado' });

        if (errInsert) {
           logs.push(`Erro inserindo lote: ${errInsert.message}`);
        } else {
           totalMigrado += movsParaInserir.length;
        }
      }
      offset += limit;
    }

    // Registrar global
    await newClient.from('auditoria_administrativa').insert({
      usuario_id: session.user.id,
      modulo: 'faturamento',
      acao: 'importacao_legado',
      descricao: `Migração passiva executada: ${totalMigrado} registros.`,
      status: 'sucesso',
      criticidade: 'alta'
    });

    return NextResponse.json({ 
       success: true, 
       totalOperacoesMapeadas: mapOperacoes.size,
       totalMovimentosMigrados: totalMigrado,
       logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
