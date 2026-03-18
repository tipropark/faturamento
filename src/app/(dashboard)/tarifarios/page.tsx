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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Tarifários e Convênios</h1>
          <p className="page-subtitle">Acompanhe solicitações de alteração de preços e contratos</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => router.push('/tarifarios/novo')}>
            <Plus size={16} /> Nova Solicitação
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon orange"><Clock size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendente}</div>
            <div className="stat-label">Pendentes Aprovação</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><AlertCircle size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.aprovado}</div>
            <div className="stat-label">Aguardando Execução</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><RefreshCw size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.em_execucao}</div>
            <div className="stat-label">Em Execução</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.concluido_mes}</div>
            <div className="stat-label">Concluídas no Mês</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="filters-bar">
          <select className="filter-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
            <option value="">Status: Todos</option>
            {Object.entries(STATUS_TARIFARIO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="filter-control" value={filtros.operacao_id} onChange={e => setFiltros(p => ({ ...p, operacao_id: e.target.value }))}>
            <option value="">Operação: Todas</option>
            {operacoes.map(o => <option key={o.id} value={o.id}>{o.nome_operacao}</option>)}
          </select>
          <select className="filter-control" value={filtros.tipo} onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value }))}>
            <option value="">Tipo: Todos</option>
            {Object.entries(TIPO_SOLICITACAO_TARIFARIO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Período:</span>
            <input type="date" className="filter-control" value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
            <input type="date" className="filter-control" value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="page-loading"><div className="loading-spinner dark" /><span>Carregando solicitações...</span></div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Operação</th>
                  <th>Tipo</th>
                  <th>Solicitante</th>
                  <th>Desejado para</th>
                  <th>Status</th>
                  <th>Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="table-empty">
                        <AlertCircle size={32} className="table-empty-icon" style={{ margin: '0 auto 0.5rem', color: 'var(--gray-300)', display: 'block' }} />
                        <div>Nenhuma solicitação encontrada</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  solicitacoes.map(s => (
                    <tr key={s.id} onClick={() => router.push(`/tarifarios/${s.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                        {s.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.operacao?.nome_operacao || '-'}</div>
                      </td>
                      <td>{TIPO_SOLICITACAO_TARIFARIO_LABELS[s.tipo as TipoSolicitacaoTarifario]}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{s.solicitante?.nome || '-'}</td>
                      <td style={{ color: 'var(--gray-600)' }}>{formatarData(s.data_desejada)}</td>
                      <td><span className={`badge badge-status-${s.status}`}>{STATUS_TARIFARIO_LABELS[s.status as StatusSolicitacaoTarifario]}</span></td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>{formatarData(s.criado_em)}</td>
                      <td>
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
        </div>
      )}
    </div>
  );
}
