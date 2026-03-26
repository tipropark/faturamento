import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAndClean() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`Buscando movimentos de hoje (${today}) para Assai Portugal...`);

  const { data: movs, error: errMov } = await supabase
    .from("faturamento_movimentos")
    .select("*")
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .gte("data_saida", today);

  if (errMov) {
    console.error("Erro ao buscar:", errMov);
    return;
  }

  console.log(`Encontrados ${movs.length} movimentos.`);
  movs.forEach(m => {
    console.log(`- Ticket: ${m.ticket_id} | Valor: ${m.valor} | Tipo: ${m.tipo_movimento} | FP: ${m.forma_pagamento}`);
  });

  // Verificar se existem movimentos de centavos que deveriam ser despesa
  const suspicious = movs.filter(m => m.valor === 0.01 || m.valor === 0.02);
  if (suspicious.length > 0) {
    console.log(`Limpando ${suspicious.length} registros suspeitos...`);
    const { error: delErr } = await supabase
      .from("faturamento_movimentos")
      .delete()
      .in("id", suspicious.map(s => s.id));
    
    if (delErr) console.error("Erro ao deletar:", delErr);
    else console.log("Registros de centavos deletados!");
  }

  // LIMPAR O RESUMO TAMBÉM
  console.log("Limpando resumo diário para forçar re-geração...");
  await supabase
    .from("faturamento_resumo_diario")
    .delete()
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .eq("data_referencia", today);

  console.log("Processo finalizado. Rode o Agente agora.");
}

inspectAndClean();
