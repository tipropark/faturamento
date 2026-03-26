import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTodayMovs() {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("faturamento_movimentos")
    .select("*")
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .gte("data_saida", today);

  if (error) {
    console.error("Erro:", error);
    return;
  }

  console.log(`Encontrados ${data.length} movimentos para hoje.`);
  data.forEach((m) => {
    console.log(`Ticket: ${m.ticket_id} | Valor: ${m.valor} | Tipo: ${m.tipo_movimento} | FP: ${m.forma_pagamento}`);
  });
}

checkTodayMovs();
