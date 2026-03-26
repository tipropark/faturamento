import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectOp() {
  const { data, error } = await supabase
    .from("operacoes")
    .select("*")
    .eq("id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .single();

  if (error) {
    console.error("Erro:", error);
    return;
  }

  console.log("Campos de saldo da operação Assai Portugal:");
  Object.keys(data).forEach(k => {
    if (k.toLowerCase().includes('valor') || k.toLowerCase().includes('saldo') || k.toLowerCase().includes('fat')) {
      console.log(`${k}: ${data[k]}`);
    }
  });
}

inspectOp();
