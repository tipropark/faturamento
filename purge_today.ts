import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeToday() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`Limpando histórico de hoje para a operação Assai Portugal...`);

  const { error } = await supabase
    .from("faturamento_movimentos")
    .delete()
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .gte("data_saida", today);

  if (error) {
    console.error("Erro na limpeza:", error);
  } else {
    console.log("Limpeza concluída! Agora você pode rodar o Agente novamente.");
  }
}

purgeToday();
