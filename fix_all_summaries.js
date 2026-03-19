const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeAndReprocess() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b'; // Cais
  
  console.log('Fetching all operations...');
  const { data: ops } = await supabase.from('operacoes').select('id, nome_operacao');
  
  if (!ops) return;

  const dates = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  console.log(`Reprocessing ${ops.length} operations for ${dates.length} days...`);

  for (const op of ops) {
    console.log(`- ${op.nome_operacao}...`);
    for (const d of dates) {
      // Call the stored proc directly from RPC
      const { error } = await supabase.rpc('reprocessar_faturamento_dia', { 
        p_operacao_id: op.id, 
        p_data: d 
      });
      if (error) console.log(`  ! Error on ${d}: ${error.message}`);
    }
  }
  console.log('DONE.');
}

purgeAndReprocess();
