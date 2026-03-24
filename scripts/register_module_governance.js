
const { createClient } = require('@supabase/supabase-js');

const registerModule = async () => {
  const supabase = createClient(
    'https://ckgqmgclopqomctgvhbq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8'
  );

  const moduleData = {
    identificador: 'central_solicitacoes',
    nome: 'Central de Solicitações',
    categoria: 'Corporativo Interno',
    ordem: 9,
    ativo: true,
    visivel_menu: true,
    participa_matriz: true
  };

  const { data, error } = await supabase
    .from('modulos_sistema')
    .upsert(moduleData, { onConflict: 'identificador' })
    .select();

  if (error) {
    console.error('Error registering module:', error);
    process.exit(1);
  }

  console.log('Module registered successfully:');
  console.table(data);
};

registerModule();
