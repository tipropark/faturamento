
const { createClient } = require('@supabase/supabase-js');

const seedPermissions = async () => {
  const supabase = createClient(
    'https://ckgqmgclopqomctgvhbq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8'
  );

  const profiles = ['administrador', 'ti', 'diretoria', 'gerente_operacoes', 'supervisor', 'analista_sinistro', 'financeiro', 'rh', 'dp', 'auditoria', 'administrativo'];
  
  const permissions = profiles.map(profile => {
    let nivel = 'sem_acesso';
    
    // Admins and TI get total access
    if (['administrador', 'ti'].includes(profile)) {
      nivel = 'total';
    } 
    // Others might get "visualizacao" or "criacao" by default 
    // for an internal ticketing system. 
    // Let's give "criacao" to almost everyone, so they can open tickets.
    else if (['rh', 'dp', 'financeiro', 'diretoria', 'gerente_operacoes', 'supervisor', 'administrativo'].includes(profile)) {
      nivel = 'criacao';
    }
    // Auditoria might just see
    else if (profile === 'auditoria') {
      nivel = 'visualizacao';
    }

    return {
      perfil: profile,
      modulo: 'central_solicitacoes',
      nivel: nivel,
      escopo: 'global'
    };
  });

  const { data, error } = await supabase
    .from('perfis_permissoes')
    .upsert(permissions, { onConflict: 'perfil,modulo' })
    .select();

  if (error) {
    console.error('Error seeding permissions:', error);
    process.exit(1);
  }

  console.log('Permissions seeded successfully for Central de Solicitações:');
  console.table(data);
};

seedPermissions();
