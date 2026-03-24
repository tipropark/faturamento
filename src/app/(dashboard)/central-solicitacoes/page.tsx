'use client';

import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function CentralSolicitacoesDashboard() {
  // Dados mockados para estatísticas
  const stats = [
    { label: 'Novas', value: 12, icon: FileText, color: 'var(--brand-accent)', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Em Triagem', value: 5, icon: Activity, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Em Atendimento', value: 28, icon: Clock, color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Aguardando Solicitante', value: 8, icon: MessageSquare, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
    { label: 'Vencidas', value: 3, icon: AlertCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
    { label: 'Concluídas Mês', value: 145, icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="page-header">
        <div>
          <h1 className="page-title">Central de Solicitações</h1>
          <p className="page-subtitle">Gestão integrada e visão executiva de chamados corporativos</p>
        </div>
      </header>

      {/* Strategic Executive KPI Grid (Benchmark: Metas) */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: stat.bg, color: stat.color }}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Grid de Conteúdo Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
        {/* Solicitações Recentes */}
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <header className="card-header" style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 className="text-lg font-bold">Solicitações Recentes</h3>
              <p className="text-xs text-muted">Últimas ocorrências registradas na central</p>
            </div>
            <button className="btn btn-ghost btn-sm">Ver Todas</button>
          </header>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Assunto / Solicitante</th>
                  <th>Departamento</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="cell-code">SOL-2024-100{i}</td>
                    <td>
                      <div className="cell-main">Acesso ao servidor de arquivos</div>
                      <div className="cell-sub">Ricardo Santos • TI Central</div>
                    </td>
                    <td><span className="badge badge-gray">T.I.</span></td>
                    <td>
                      <span className="badge badge-status-atendimento"><span className="badge-dot" />Em Atendimento</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-icon btn-sm" title="Ver Detalhes">
                         <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Blocos Laterais (Insights) */}
        <div className="flex flex-col gap-8">
          {/* Por Departamento */}
          <section className="card" style={{ padding: '1.5rem' }}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted mb-6">Volume por Departamento</h3>
            <div className="flex flex-col gap-6">
              {[
                { name: 'TI', count: 45, color: 'var(--brand-primary)' },
                { name: 'RH', count: 28, color: '#EC4899' },
                { name: 'Financeiro', count: 15, color: 'var(--success)' },
                { name: 'Operações', count: 42, color: 'var(--warning)' },
              ].map((depto) => (
                <div key={depto.name}>
                  <div className="flex flex-between mb-2">
                    <span className="text-sm font-bold">{depto.name}</span>
                    <span className="text-xs font-bold text-muted">{depto.count} chamados</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(depto.count / 45) * 100}%`, background: depto.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vencimentos SLA Alert */}
          <section className="card p-6" style={{ background: 'var(--danger-bg)', borderLeft: '4px solid var(--danger)' }}>
            <div className="flex align-center gap-3 mb-4">
              <AlertCircle size={20} className="text-danger" />
              <h3 className="text-sm font-extrabold text-danger-dark uppercase tracking-widest">Alertas de SLA Crítico</h3>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { protocol: 'SOL-2024-0985', time: 'Vencido há 2h', depto: 'TI' },
                { protocol: 'SOL-2024-0992', time: 'Vence em 45min', depto: 'Operações' },
              ].map((alert) => (
                <div key={alert.protocol} className="p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                  <div className="flex flex-between mb-1">
                    <span className="cell-code" style={{ fontSize: '0.7rem' }}>{alert.protocol}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: alert.time.includes('Vencido') ? 'var(--danger)' : 'var(--warning)' }}>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>Depto: {alert.depto}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
