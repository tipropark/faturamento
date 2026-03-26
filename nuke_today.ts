import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeAllToday() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`--- LIMPANDO TODOS OS MOVIMENTOS DE HOJE (ILIMITADO) ---`);

  // Supabase delete doesn't have a limit by default, but we'll do it by chunks if needed.
  // Actually delete .eq() will delete ALL matching.
  const { count, error } = await supabase
    .from("faturamento_movimentos")
    .delete({ count: 'exact' })
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .gte("data_saida", `${today}T00:00:00.000Z`);

  if (error) { console.error(error); return; }
  console.log(`Sucesso! Deletados ${count} registros.`);

  // Limpar Resumo
  await supabase
    .from("faturamento_resumo_diario")
    .delete()
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .eq("data_referencia", today);

  console.log(`Resumo deletado! O Banco de Dados está agora 100% LIMPO para a carga total.`);
}

purgeAllToday();
