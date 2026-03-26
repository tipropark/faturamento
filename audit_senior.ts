import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalAudit() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`--- AUDITORIA SENIOR FULLSTACK (DATA: ${today}) ---`);

  const { data, error } = await supabase
    .from("faturamento_movimentos")
    .select("*")
    .eq("operacao_id", "2a6ba4bb-d439-4aef-94d5-f53fdaece039")
    .gte("data_saida", `${today}T00:00:00.000Z`);

  if (error) { console.error(error); return; }

  let revenue = 0;
  let expense = 0;
  let centavosCount = 0;

  data.forEach(m => {
    const valor = Number(m.valor || 0);
    const tm = (m.tipo_movimento || '').toUpperCase();
    const isExpense = tm.includes('DESPESA') || tm.includes('SAÍDA') || tm.includes('SAIDA') || tm.includes('LIBERACAO');

    if (isExpense) {
      expense += valor;
    } else {
      revenue += valor;
    }

    if (valor <= 0.05 && valor > 0) {
      centavosCount++;
      console.log(`[SUSPEITO] Ticket: ${m.ticket_id} | Valor: ${m.valor} | Tipo: ${m.tipo_movimento}`);
    }
  });

  console.log(`-----------------------------------`);
  console.log(`Movimentos Totais: ${data.length}`);
  console.log(`Receita Bruta: R$ ${revenue.toFixed(2)}`);
  console.log(`Despesa Total: R$ ${expense.toFixed(2)}`);
  console.log(`Saldo Líquido: R$ ${(revenue - expense).toFixed(2)}`);
  console.log(`Registros de centavos (<0.05): ${centavosCount}`);
  console.log(`-----------------------------------`);
}

finalAudit();
