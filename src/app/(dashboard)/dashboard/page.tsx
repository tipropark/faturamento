import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { Perfil, STATUS_SINISTRO_LABELS, PERFIL_LABELS } from '@/types';
import {
  AlertTriangle, Building2, Users, TrendingUp,
  Clock, CheckCircle2, XCircle, FileText, ClipboardList
} from 'lucide-react';

async function getDashboardStats(userId: string, perfil: Perfil, gerenteId?: string) {
  const supabase = await createAdminClient();

  let sinistrosQuery = supabase.from('sinistros').select('status, criado_em', { count: 'exact' });
  let operacoesQuery = supabase.from('operacoes').select('id', { count: 'exact' }).eq('status', 'ativa');

  if (perfil === 'supervisor') {
    sinistrosQuery = sinistrosQuery.eq('supervisor_id', userId);
    operacoesQuery = operacoesQuery.eq('supervisor_id', userId);
  } else if (perfil === 'gerente_operacoes') {
    sinistrosQuery = sinistrosQuery.eq('gerente_operacoes_id', userId);
    operacoesQuery = operacoesQuery.eq('gerente_operacoes_id', userId);
  }

  const [{ count: totalSinistros }, { count: totalOperacoes }, { data: sinistrosPorStatus }] =
    await Promise.all([
      sinistrosQuery,
      operacoesQuery,
      supabase.from('sinistros').select('status').then(r => r),
    ]);

  // Contar por status
  const statusCounts = {
    aberto: 0, em_analise: 0, aprovado: 0, encerrado: 0,
  };

  return {
    totalSinistros: totalSinistros || 0,
    totalOperacoes: totalOperacoes || 0,
    sinistrosAbertos: 0,
    sinistrosEmAnalise: 0,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return redirect('/login');

  const user = {
    id: session.user.id as string,
    perfil: (session.user as any).perfil as Perfil,
    nome: session.user.name || '',
  };

  const supabase = await createAdminClient();

  // Contagens
  let sinQuery = supabase.from('sinistros').select('status', { count: 'exact' });
  let opQuery = supabase.from('operacoes').select('id', { count: 'exact' }).eq('status', 'ativa');
  let usuQuery = supabase.from('usuarios').select('id', { count: 'exact' }).eq('ativo', true);

  if (user.perfil === 'supervisor') {
    sinQuery = sinQuery.eq('supervisor_id', user.id);
    opQuery = opQuery.eq('supervisor_id', user.id);
  } else if (user.perfil === 'gerente_operacoes') {
    sinQuery = sinQuery.eq('gerente_operacoes_id', user.id);
    opQuery = opQuery.eq('gerente_operacoes_id', user.id);
  }

  const [
    { count: totalSinistros },
    { data: sinistrosPorStatus },
    { count: totalOperacoes },
    { count: totalUsuarios },
    { data: recentSinistros },
  ] = await Promise.all([
    sinQuery,
    supabase.from('sinistros').select('status'),
    opQuery,
    usuQuery,
    supabase.from('sinistros')
      .select('id, pr, status, cliente_nome, operacao:operacoes(nome_operacao), criado_em')
      .order('criado_em', { ascending: false })
      .limit(8),
    supabase.from('solicitacoes_tarifario').select('status', { count: 'exact' }),
  ]);

  const tarifariosStats = await supabase.from('solicitacoes_tarifario').select('status');
  const tStats = {
    pendente: (tarifariosStats.data || []).filter((s: any) => s.status === 'pendente').length,
    aprovado: (tarifariosStats.data || []).filter((s: any) => s.status === 'aprovado').length,
    em_execucao: (tarifariosStats.data || []).filter((s: any) => s.status === 'em_execucao').length,
    concluido_mes: (tarifariosStats.data || []).filter((s: any) => {
      const d = new Date(s.criado_em);
      const now = new Date();
      return s.status === 'concluido' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const statusCount = (status: string) =>
    (sinistrosPorStatus || []).filter((s: any) => s.status === status).length;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header / Top Title Area */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Dashboard</h1>
        <div className="page-actions" style={{ gap: '1rem' }}>
          {/* Ações primárias aqui, se houver */}
        </div>
      </div>

      {/* Blue Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 100%)',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
      }}>
        {/* Wave pattern / subtle overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'0.1\' d=\'M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,202.7C960,235,1056,245,1152,229.3C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'%3E%3C/path%3E%3C/svg%3E") no-repeat bottom',
          backgroundSize: 'cover'
        }} />
        
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
          {saudacao}, {user.nome.split(' ')[0]}! 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500, position: 'relative', zIndex: 1 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPI Stats Row (Colored Borders) */}
      <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total de Sinistros', value: totalSinistros, icon: AlertTriangle, color: '#3B82F6' },
          { label: 'Sinistros Abertos', value: statusCount('aberto'), icon: Clock, color: '#F59E0B' },
          { label: 'Em Análise', value: statusCount('em_analise'), icon: FileText, color: '#8B5CF6' },
          { label: 'Operações Ativas', value: totalOperacoes, icon: Building2, color: '#10B981' },
          { label: 'Usuários Ativos', value: totalUsuarios, icon: Users, color: '#06B6D4' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ 
            padding: '1.5rem', 
            borderTop: `4px solid ${stat.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '120px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-900)' }}>{stat.value}</span>
              <div style={{ color: stat.color, background: `${stat.color}15`, padding: '0.5rem', borderRadius: '10px' }}>
                <stat.icon size={20} />
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: '16px' }}>
        <div className="card-header" style={{ padding: '1.5rem 2rem' }}>
          <div className="card-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>Sinistros Recentes</div>
          <a href="/sinistros" className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}>
            Ver todos
          </a>
        </div>
        <div className="table-container" style={{ padding: '0 1rem 1rem' }}>
          <table className="table">
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ borderRadius: '8px 0 0 8px' }}>PR</th>
                <th>Cliente</th>
                <th>Operação</th>
                <th>Status</th>
                <th style={{ borderRadius: '0 8px 8px 0' }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {!recentSinistros || recentSinistros.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--gray-400)' }}>Nenhum registro encontrado</div>
                  </td>
                </tr>
              ) : (
                recentSinistros.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <a href={`/sinistros/${s.id}`} style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                        {s.pr}
                      </a>
                    </td>
                    <td style={{ fontWeight: 500 }}>{s.cliente_nome}</td>
                    <td style={{ color: 'var(--gray-500)' }}>
                      {(s.operacao as any)?.nome_operacao || '-'}
                    </td>
                    <td>
                      <span className={`badge badge-status-${s.status}`} style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {STATUS_SINISTRO_LABELS[s.status as keyof typeof STATUS_SINISTRO_LABELS]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                      {new Date(s.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Panel */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: '0.75rem', 
        marginTop: '1.5rem',
        background: 'white',
        padding: '1.25rem',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {[
          { status: 'aberto', label: 'Abertos', color: '#3B82F6' },
          { status: 'em_analise', label: 'Em Análise', color: '#8B5CF6' },
          { status: 'aguardando_documentos', label: 'Aguard. Docs', color: '#F59E0B' },
          { status: 'aprovado', label: 'Aprovados', color: '#10B981' },
          { status: 'reprovado', label: 'Reprovados', color: '#EF4444' },
          { status: 'encerrado', label: 'Encerrados', color: '#64748B' },
        ].map(({ status, label, color }) => (
          <div key={status} style={{ textAlign: 'center', borderRight: status !== 'encerrado' ? '1px solid var(--gray-100)' : 'none' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{statusCount(status)}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
