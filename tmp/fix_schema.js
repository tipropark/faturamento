
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
    console.log('--- Fixing Database Schema ---');
    
    const sql = `
        -- 1. Limpar duplicatas (manter apenas a mais recente)
        DELETE FROM public.operacoes_automacao 
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY operacao_id ORDER BY atualizado_em DESC) as rn
                FROM public.operacoes_automacao
            ) t WHERE t.rn > 1
        );

        -- 2. Tentar adicionar a restrição UNIQUE (se não existir)
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacoes_automacao_operacao_id_key') THEN
                ALTER TABLE public.operacoes_automacao ADD CONSTRAINT operacoes_automacao_operacao_id_key UNIQUE (operacao_id);
            END IF;
        END $$;
    `;

    // Try to find an RPC that can execute SQL
    const { data: rpcList } = await supabase.rpc('inspect_rpcs'); 
    console.log('Available RPCs (first 10):', rpcList?.slice(0, 10));

    // Common names: exec_sql, run_sql, query
    const { error: err1 } = await supabase.rpc('exec_sql', { sql });
    if (err1) {
        console.log('exec_sql failed:', err1.message);
        const { error: err2 } = await supabase.rpc('run_sql', { sql });
        if (err2) console.log('run_sql failed:', err2.message);
    } else {
        console.log('exec_sql SUCCESS!');
    }
}

fixSchema();
