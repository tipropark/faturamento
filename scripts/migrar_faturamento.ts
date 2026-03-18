import { createClient } from '@supabase/supabase-js';

// Base Antiga (Coleta Prescon)
const OLD_SUPABASE_URL = 'https://rpgqifkauzzyvrtwhdsp.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ3FpZmthdXp6eXZydHdoZHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODAyMzIsImV4cCI6MjA4OTA1NjIzMn0.5P4TvnC5GyCY_GmNCpUkid8nrdz5fr1ws-RqGacjz-w';
const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

// Base Nova (Leve ERP) - Usando a chave de serviço para bypass em RLS durante migração
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const newClient = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function migrarBase() {
  console.log('Iniciando migração de Faturamento da coleta-prescon para leve-erp...');

  // 1. Obter Operações Antigas
  console.log('Buscando operações antigas...');
  const { data: oldOps, error: errOps } = await oldClient.from('operations').select('*');
  if (errOps || !oldOps) {
    console.error('Erro ao buscar operações:', errOps);
    return;
  }
  console.log(`${oldOps.length} operações encontradas na base antiga.`);

  // 2. Conciliar Operações no ERP
  const mapOperacoes = new Map<string, string>(); // id_legado -> novo_id

  for (const op of oldOps) {
    // Tenta encontrar operação equivalente pelo slug ou nome
    const { data: exOp } = await newClient
      .from('operacoes')
      .select('id')
      .or(`slug.eq.${op.slug},nome_operacao.ilike.${op.name}`)
      .limit(1)
      .single();

    if (exOp) {
      console.log(`Operação já existe no ERP: ${op.name}. Atualizando metadados...`);
      await newClient.from('operacoes').update({
        id_legado: op.id,
        slug: op.slug,
        sql_server: op.sql_server,
        sql_database: op.sql_database,
        automacao_tipo: op.automation_type || 'PARCO'
      }).eq('id', exOp.id);
      
      mapOperacoes.set(op.id, exOp.id);
    } else {
      console.log(`Criando nova operação no ERP: ${op.name}...`);
      
      // Buscar o primeiro admin para ser o supervisor_id padrão
      const { data: admin } = await newClient.from('usuarios').select('id').eq('perfil', 'administrador').limit(1).single();
      
      const { data: novaOp, error: errNovaOp } = await newClient.from('operacoes').insert({
        nome_operacao: op.name,
        codigo_operacao: op.slug.substring(0, 50),
        bandeira: 'Outros', // Valor padrão do ENUM
        tipo_operacao: 'outro', // Valor padrão do ENUM
        cidade: 'Não informada',
        uf: 'SP',
        quantidade_vagas: 0,
        possui_cftv: false,
        status: op.active ? 'ativa' : 'inativa',
        supervisor_id: admin?.id || null, // Preenchido com o primeiro admin
        id_legado: op.id,
        slug: op.slug,
        sql_server: op.sql_server,
        sql_database: op.sql_database,
        automacao_tipo: op.automation_type || 'PARCO'
      }).select('id').single();

      if (errNovaOp) {
        console.error(`Erro ao criar operação ${op.name}:`, errNovaOp);
      } else if (novaOp) {
        mapOperacoes.set(op.id, novaOp.id);
      }
    }
  }

  // 3. Migrar Movimentações
  console.log('Buscando histórico de movimentações...');
  let totalMigrado = 0;
  let offset = 0;
  const limits = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: movs, error: errMovs } = await oldClient
      .from('movimentos_central')
      .select('*')
      .range(offset, offset + limits - 1);

    if (errMovs || !movs) {
      console.error('Erro ao buscar movimentações:', errMovs);
      break;
    }

    if (movs.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processando lote de ${movs.length} movimentações (Offset: ${offset})...`);
    
    const movsParaInserir = movs.map((m: any) => {
      // Pula se não mapeou a operação
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
      // Upsert para evitar duplicações se o script rodar duas vezes (presumindo id_legado único)
      const { error: errInsert } = await newClient
        .from('faturamento_movimentos')
        .upsert(movsParaInserir, { onConflict: 'id_legado' });

      if (errInsert) {
        console.error('Erro ao inserir lote de movimentações:', errInsert);
      } else {
        totalMigrado += movsParaInserir.length;
      }
    }

    offset += limits;
  }

  console.log('========================================');
  console.log(`MIGRAÇÃO CONCLUÍDA! Total de Movimentações: ${totalMigrado}`);
  console.log('========================================');
}

migrarBase();
