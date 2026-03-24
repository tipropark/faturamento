import { redirect } from 'next/navigation';
import { RecentSinistrosRow } from './RecentSinistrosRow';

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
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do desempenho e status das operações</p>
        </div>
        <div className="page-actions">
           <span className="text-muted text-sm font-medium">
             {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
           </span>
        </div>
      </header>

      {/* Premium Welcome Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)',
        borderRadius: 'var(--radius-md)',
        padding: '3rem',
        marginBottom: '2.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            {saudacao}, {user.nome.split(' ')[0]}! 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.6 }}>
            Bem-vindo ao Leve ERP. Você tem <strong>{statusCount('aberto')} sinistros abertos</strong> aguardando sua análise hoje.
          </p>
        </div>
        {/* Subtle Decorative Element */}
        <div style={{
          position: 'absolute', right: '-50px', top: '-50px', width: '250px', height: '250px',
          background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none'
        }} />
      </section>

      {/* Key Stats Grid */}
      <div className="stats-grid">
        {[
          { label: 'Total de Sinistros', value: totalSinistros, icon: AlertTriangle, color: 'var(--brand-accent)' },
          { label: 'Sinistros Abertos', value: statusCount('aberto'), icon: Clock, color: 'var(--warning)' },
          { label: 'Em Análise', value: statusCount('em_analise'), icon: FileText, color: 'var(--info)' },
          { label: 'Operações Ativas', value: totalOperacoes, icon: Building2, color: 'var(--success)' },
          { label: 'Usuários Ativos', value: totalUsuarios, icon: Users, color: 'var(--brand-primary)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: stat.color, background: `${stat.color}10` }}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Recent Activity */}
      <div className="flex flex-col gap-6">
        <section>
          <div className="flex flex-between mb-4">
             <h3 className="text-lg font-bold">Sinistros Recentes</h3>
             <a href="/sinistros" className="btn btn-ghost btn-sm">Ver tudo <TrendingUp size={14} className="ml-1" /></a>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>PR</th>
                  <th>Cliente</th>
                  <th>Operação</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Abertura</th>
                </tr>
              </thead>
              <tbody>
                {!recentSinistros || recentSinistros.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted">Nenhum sinistro recente.</td>
                  </tr>
                ) : (
                  recentSinistros.map((s: any) => (
                    <RecentSinistrosRow key={s.id} s={s} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resumo por Status (Bottom Panel Refinado) */}
        <section className="card p-4">
          <div className="flex flex-between gap-4 flex-wrap">
            {[
              { status: 'aberto', label: 'Abertos', color: 'var(--brand-accent)' },
              { status: 'em_analise', label: 'Em Análise', color: '#8B5CF6' },
              { status: 'aguardando_documentos', label: 'Aguard. Docs', color: 'var(--warning)' },
              { status: 'aprovado', label: 'Aprovados', color: 'var(--success)' },
              { status: 'reprovado', label: 'Reprovados', color: 'var(--danger)' },
              { status: 'encerrado', label: 'Encerrados', color: 'var(--gray-400)' },
            ].map(({ status, label, color }, idx) => (
              <div key={status} className="flex-1 text-center" style={{ 
                borderRight: idx < 5 ? '1px solid var(--border-color)' : 'none',
                minWidth: '120px'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{statusCount(status)}</div>
                <div className="text-xs font-bold text-muted uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
