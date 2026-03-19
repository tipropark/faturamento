'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList, Plus, Search, Filter,
  RefreshCw, Eye, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import {
  StatusSolicitacaoTarifario, TipoSolicitacaoTarifario,
  STATUS_TARIFARIO_LABELS, TIPO_SOLICITACAO_TARIFARIO_LABELS
} from '@/types';
import { formatarData } from '@/lib/utils';

export default function TarifariosPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    status: '', operacao_id: '', tipo: '', solicitante_id: '',
    data_inicio: '', data_fim: ''
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.status) params.set('status', filtros.status);
    if (filtros.operacao_id) params.set('operacao_id', filtros.operacao_id);
    if (filtros.tipo) params.set('tipo', filtros.tipo);
    if (filtros.data_inicio) params.set('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.set('data_fim', filtros.data_fim);

    try {
      const res = await fetch('/api/tarifarios?' + params.toString());
      const data = await res.json();
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const carregarOps = useCallback(async () => {
    const res = await fetch('/api/operacoes?status=ativa');
    const data = await res.json();
    setOperacoes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { carregarOps(); }, [carregarOps]);

  const stats = {
    pendente: solicitacoes.filter(s => s.status === 'pendente').length,
    aprovado: solicitacoes.filter(s => s.status === 'aprovado').length,
    em_execucao: solicitacoes.filter(s => s.status === 'em_execucao').length,
    concluido_mes: solicitacoes.filter(s => {
      const d = new Date(s.criado_em);
      const now = new Date();
      return s.status === 'concluido' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Tarifários e Convênios</h1>
          <p className="page-subtitle">Gestão de solicitações de alteração de preços e contratos operacionais</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => router.push('/tarifarios/novo')}>
            <Plus size={18} /> Nova Solicitação
          </button>
        </div>
      </header>

      {/* Indicadores Premium */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Pendentes Aprovação', value: stats.pendente, icon: Clock, color: 'var(--warning)' },
          { label: 'Aguardando Execução', value: stats.aprovado, icon: AlertCircle, color: '#8B5CF6' },
          { label: 'Em Execução', value: stats.em_execucao, icon: RefreshCw, color: 'var(--brand-accent)' },
          { label: 'Concluídas no Mês', value: stats.concluido_mes, icon: CheckCircle2, color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex flex-between mb-4">
               <div style={{ color: stat.color, background: `${stat.color}10`, padding: '0.625rem', borderRadius: '12px' }}>
                 <stat.icon size={22} />
               </div>
               <span className="stat-value">{stat.value}</span>
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros Padronizados */}
      <section className="filters-card">
        <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="form-group mb-0">
             <label className="form-label">Status</label>
             <select className="form-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
               <option value="">Todos os Status</option>
               {Object.entries(STATUS_TARIFARIO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
             </select>
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Operação</label>
             <select className="form-control" value={filtros.operacao_id} onChange={e => setFiltros(p => ({ ...p, operacao_id: e.target.value }))}>
               <option value="">Todas as Operações</option>
               {operacoes.map(o => <option key={o.id} value={o.id}>{o.nome_operacao}</option>)}
             </select>
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Tipo de Solicitação</label>
             <select className="form-control" value={filtros.tipo} onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value }))}>
               <option value="">Todos os Tipos</option>
               {Object.entries(TIPO_SOLICITACAO_TARIFARIO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
             </select>
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Período</label>
             <div className="flex gap-2">
               <input type="date" className="form-control" value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
               <input type="date" className="form-control" value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
             </div>
          </div>

          <div className="flex gap-2">
             {(filtros.status || filtros.operacao_id || filtros.tipo || filtros.data_inicio) && (
               <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({ status: '', operacao_id: '', tipo: '', solicitante_id: '', data_inicio: '', data_fim: '' })}>
                 Limpar
               </button>
             )}
             <button className="btn btn-secondary btn-sm" onClick={carregar}>
                <RefreshCw size={14} className={loading ? 'rotate-animation' : ''} />
             </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div style={{ padding: '8rem 0', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }} />
          <p className="text-muted font-medium">Carregando solicitações...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>ID Ref</th>
                <th>Operação</th>
                <th>Tipo de Demanda</th>
                <th>Solicitante</th>
                <th>Data Desejada</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                     <ClipboardList size={48} className="text-muted mb-4 mx-auto display-block" style={{ opacity: 0.1 }} />
                     <h3 className="text-lg font-bold text-gray-900">Nenhuma solicitação encontrada</h3>
                     <p className="text-muted">Aguardando novas demandas de tarifários.</p>
                  </td>
                </tr>
              ) : (
                solicitacoes.map(s => (
                  <tr key={s.id} onClick={() => router.push(`/tarifarios/${s.id}`)} className="cursor-pointer">
                    <td className="cell-code">{s.id.substring(0, 8).toUpperCase()}</td>
                    <td>
                      <div className="cell-main">{s.operacao?.nome_operacao || '-'}</div>
                      <div className="cell-sub">{s.operacao?.cidade}/{s.operacao?.uf}</div>
                    </td>
                    <td>
                       <div className="cell-main">{TIPO_SOLICITACAO_TARIFARIO_LABELS[s.tipo as TipoSolicitacaoTarifario]}</div>
                       <div className="cell-sub">Protocolo Interno</div>
                    </td>
                    <td>
                       <div className="cell-main">{s.solicitante?.nome || '-'}</div>
                       <div className="cell-sub">Abertura: {formatarData(s.criado_em)}</div>
                    </td>
                    <td>
                       <div className="text-sm font-medium">{formatarData(s.data_desejada)}</div>
                    </td>
                    <td>
                      <span className={`badge badge-status-${s.status}`}>
                        {STATUS_TARIFARIO_LABELS[s.status as StatusSolicitacaoTarifario]}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/tarifarios/${s.id}`); }}>
                        <Eye size={14} /> Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
