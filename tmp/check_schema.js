
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Checking operacoes table ---');
    const { data: dataOp, error: errorOp } = await supabase.from('operacoes').select('*').limit(1);
    if (errorOp) {
        console.error('Error selecting from operacoes:', errorOp);
    } else {
        console.log('Columns found in operacoes:', Object.keys(dataOp[0] || {}));
    }

    console.log('\n--- Checking operacoes_automacao table ---');
    const { data: dataAuto, error: errAuto } = await supabase.from('operacoes_automacao').select('*').limit(1);
    if (errAuto) {
        console.error('Error selecting from operacoes_automacao:', errAuto);
    } else {
        console.log('Columns found in operacoes_automacao:', Object.keys(dataAuto[0] || {}));
    }

    console.log('\n--- Checking automacoes_catalogo table ---');
    const { data: dataCat, error: errCat } = await supabase.from('automacoes_catalogo').select('*');
    if (errCat) {
        console.error('Error selecting from automacoes_catalogo:', errCat);
    } else {
        console.log('Records in automacoes_catalogo:', dataCat.map(s => s.nome));
    }
}

checkSchema();
