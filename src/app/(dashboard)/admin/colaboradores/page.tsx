'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { 
  Plus, Search, Filter, RefreshCw, 
  Briefcase, Contact, UserCheck, 
  UserMinus, Building2, ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  Colaborador, STATUS_COLABORADOR_LABELS, 
  TIPO_VINCULO_COLABORADOR_LABELS, StatusColaborador 
} from '@/types';
import Link from 'next/link';

export default function ColaboradoresPage() {
  const [filtros, setFiltros] = useState({
    q: '',
    status: '',
    cargo: '',
    operacao_id: ''
  });

  const { data: colaboradores, mutate, isValidating } = useSWR<Colaborador[]>(
    `/api/colaboradores?${new URLSearchParams(filtros).toString()}`,
    fetcher
  );

  const { data: operacoes } = useSWR('/api/operacoes', fetcher);

  // KPIs
  const stats = [
    { label: 'Total Colaboradores', value: colaboradores?.length || 0, icon: Contact, color: 'var(--brand-primary)' },
    { label: 'Ativos', value: colaboradores?.filter(c => c.status === 'ativo').length || 0, icon: UserCheck, color: 'var(--success)' },
    { label: 'Com Acesso', value: colaboradores?.filter(c => c.usuario_id).length || 0, icon: UserCheck, color: 'var(--info)' },
    { label: 'Sem Acesso', value: colaboradores?.filter(c => !c.usuario_id).length || 0, icon: UserMinus, color: 'var(--warning)' },
  ];

  const handleRefresh = () => mutate();

  return (
    <div className="list-page-content">
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Colaboradores</h1>
          <p className="page-subtitle">Gestão funcional e administrativa de pessoas</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={isValidating}>
            <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} /> 
            {isValidating ? 'Atualizando...' : 'Atualizar'}
          </button>
          <Link href="/admin/colaboradores/novo" className="btn btn-primary">
            <Plus size={18} /> Novo Colaborador
          </Link>
        </div>
      </header>

      {/* KPIs Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {stats.map((stat, i) => (
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

      {/* Filtros */}
      <section className="filters-card" style={{ marginBottom: '1.5rem' }}>
        <div className="filters-grid">
          <div className="search-wrapper" style={{ flex: 2 }}>
            <Search size={18} className="search-icon" />
            <input
              className="form-control search-input"
              placeholder="Buscar por nome, CPF ou matrícula..."
              value={filtros.q}
              onChange={e => setFiltros(p => ({ ...p, q: e.target.value }))}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filtros.status}
              onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_COLABORADOR_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Operação</label>
            <select
              className="form-control"
              value={filtros.operacao_id}
              onChange={e => setFiltros(p => ({ ...p, operacao_id: e.target.value }))}
            >
              <option value="">Todas as Operações</option>
              {operacoes?.map((op: any) => (
                <option key={op.id} value={op.id}>{op.nome_operacao}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Tabela de Colaboradores */}
      <div className="table-responsive card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '1.5rem' }}>Colaborador</th>
              <th>Documento / Matrícula</th>
              <th>Função / Depto</th>
              <th>Acesso</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {!colaboradores ? (
              <tr>
                <td colSpan={6}>
                  <div className="py-20 flex flex-col items-center gap-4">
                    <div className="loading-spinner" />
                    <span className="text-muted font-medium">Carregando colaboradores...</span>
                  </div>
                </td>
              </tr>
            ) : colaboradores.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty py-20 text-center">
                    <Contact size={48} className="text-muted mb-4 mx-auto" style={{ opacity: 0.3 }} />
                    <div className="text-lg font-bold text-gray-900">Nenhum colaborador encontrado</div>
                    <p className="text-muted">Ajuste os filtros ou cadastre um novo colaborador.</p>
                  </div>
                </td>
              </tr>
            ) : (
              colaboradores.map(c => (
                <tr key={c.id}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        background: 'var(--brand-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 800
                      }}>
                        {c.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="cell-main">{c.nome}</div>
                        <div className="cell-sub">{c.email || 'Sem e-mail'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-main">{c.cpf}</div>
                    <div className="cell-sub">Matrícula: {c.matricula || '-'}</div>
                  </td>
                  <td>
                    <div className="cell-main">{c.cargo || 'Não definido'}</div>
                    <div className="cell-sub">{c.departamento || '-'}</div>
                  </td>
                  <td>
                    {c.usuario_id ? (
                      <span className="badge badge-success" title={`Perfil: ${c.usuario?.perfil}`}>
                        <UserCheck size={12} /> Com Acesso
                      </span>
                    ) : (
                      <span className="badge badge-secondary">
                        <UserMinus size={12} /> Sem Acesso
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${c.status === 'ativo' ? 'success' : 'danger'}`}>
                      <span className="badge-dot" />
                      {STATUS_COLABORADOR_LABELS[c.status]}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                    <Link href={`/admin/colaboradores/${c.id}`} className="btn btn-secondary btn-icon btn-sm" title="Detalhes / Editar">
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          font-weight: 700;
          font-size: 11px;
        }
        .cell-main {
          font-weight: 700;
          color: var(--gray-900);
          font-size: 13.5px;
        }
        .cell-sub {
          font-size: 11.5px;
          color: var(--gray-500);
          font-weight: 500;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
