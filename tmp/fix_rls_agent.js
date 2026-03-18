
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
    const sql = `
        ALTER TABLE public.faturamento_movimentos ENABLE ROW LEVEL SECURITY;

        -- Permitir inserção pela role anon
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'faturamento_movimentos' 
                AND policyname = 'Permitir insercao anonima para faturamento_movimentos'
            ) THEN
                CREATE POLICY "Permitir insercao anonima para faturamento_movimentos" 
                ON public.faturamento_movimentos 
                FOR INSERT 
                TO anon 
                WITH CHECK (true);
            END IF;

            -- Se quisermos permitir atualização da anon role (UPSERT precisa de update tbm)
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'faturamento_movimentos' 
                AND policyname = 'Permitir update anonimo para faturamento_movimentos'
            ) THEN
                CREATE POLICY "Permitir update anonimo para faturamento_movimentos" 
                ON public.faturamento_movimentos 
                FOR UPDATE
                TO anon 
                USING (true)
                WITH CHECK (true);
            END IF;

            -- UPSERT no supabase muitas vezes exige que a role consiga fazer o SELECT tbm para verificar existencia
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'faturamento_movimentos' 
                AND policyname = 'Permitir select anonimo para faturamento_movimentos'
            ) THEN
                CREATE POLICY "Permitir select anonimo para faturamento_movimentos" 
                ON public.faturamento_movimentos 
                FOR SELECT
                TO anon 
                USING (true);
            END IF;
        END $$;
    `;

    const { error: err1 } = await supabase.rpc('exec_sql', { sql });
    if (err1) {
        console.log('exec_sql failed:', err1.message);
    } else {
        console.log('exec_sql SUCCESS! RLS rules applied.');
    }
}

fixRLS();
