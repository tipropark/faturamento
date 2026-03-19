
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Global function from page.tsx (copied)
function classificarMovimento(tipo, forma, descricao) {
  const t = (tipo || '').toUpperCase();
  const f = (forma || '').toUpperCase();
  const d = (descricao || '').toUpperCase();

  if (t.includes('MENSALISTA') || d.includes('MENSALISTA')) {
     if (t.includes('ATM') || d.includes('ATM')) {
        if (f.includes('DEBITO')) return "ATM Mensalista Débito";
        if (f.includes('CREDITO')) return "ATM Mensalista Crédito";
     }
     if (f.includes('BOLETO')) return "Mensalista Boleto";
     if (f.includes('DEBITO')) return "Mensalista Cartão Débito";
     if (f.includes('CREDITO')) return "Mensalista Cartão Crédito";
     if (f.includes('PIX')) return "Mensalista Pix";
     if (f.includes('DINHEIRO')) return "Mensalista Dinheiro";
     return "Mensalista Dinheiro"; 
  }

  if (t.includes('ATM') || d.includes('ATM')) {
     if (f.includes('PIX')) return "ATM Pix";
     if (f.includes('DEBITO')) return "ATM Débito";
     if (f.includes('CREDITO')) return "ATM Crédito";
     return "ATM Crédito"; 
  }

  if (t.includes('CONECTCAR') || t.includes('SEM PARAR') || t.includes('VELOE') || t.includes('TAG') || d.includes('CONECT')) return "ConectCar";
  if (t.includes('LIBERACAO') || d.includes('LIBERACAO')) return "Liberação";
  if (t.includes('EVENTUAL') || t.includes('CANCELAMENTO') || d.includes('EVENTUAL') || d.includes('SOBRA') || d.includes('QUEBRA')) return "Eventuais";

  if (t.includes('ROTATIVO') || t.includes('AVULSO')) {
     if (f.includes('PIX')) return "Rotativo Pix";
     if (f.includes('DEBITO')) return "Rotativo Cartão Débito";
     if (f.includes('CREDITO')) return "Rotativo Cartão Crédito";
     if (f.includes('DINHEIRO')) return "Rotativo Dinheiro";
     return "Rotativo Dinheiro"; 
  }

  if (t.includes('RECEITA')) return "Eventuais";

  if (f.includes('PIX')) return "Rotativo Pix";
  if (f.includes('DEBITO')) return "Rotativo Cartão Débito";
  if (f.includes('CREDITO')) return "Rotativo Cartão Crédito";
  if (f.includes('DINHEIRO')) return "Rotativo Dinheiro";

  return "Eventuais";
}

async function checkClassification() {
  try {
    const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
    const day = '2026-03-18';

    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('*')
      .eq('operacao_id', opId)
      .gte('criado_em', `${day}T00:00:00`);

    console.log(`Checking ${movs.length} records...`);
    
    const results = {};
    let totalRevenueCalculated = 0;

    movs.forEach(m => {
       const cat = classificarMovimento(m.tipo_movimento, m.forma_pagamento, m.descricao);
       results[cat] = results[cat] || { count: 0, total: 0 };
       results[cat].count++;
       results[cat].total += Number(m.valor);
       
       if (m.tipo_movimento?.toLowerCase() !== 'despesa') {
          totalRevenueCalculated += Number(m.valor);
       }
    });

    console.log('Results by Category:', results);
    console.log(`Sum of non-despesa valor: R$ ${totalRevenueCalculated}`);
    
    // Check if some are Despesa
    const despesas = movs.filter(m => m.tipo_movimento?.toLowerCase() === 'despesa');
    console.log(`Despesa records: ${despesas.length} (Sum: R$ ${despesas.reduce((s,m) => s+Number(m.valor), 0)})`);

  } catch (e) { console.error(e); }
}

checkClassification();
