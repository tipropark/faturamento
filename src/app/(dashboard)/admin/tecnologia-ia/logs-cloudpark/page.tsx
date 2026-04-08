'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Activity, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Calendar, Package, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CloudParkLog {
  id: string;
  criado_em: string;
  filial: string;
  operacao_id: string;
  status_processamento: string;
  quantidade_itens: number;
  mensagem_erro?: string;
  processado_em?: string;
  payload_original?: any;
  operacao?: { nome_operacao: string };
}

export default function LogsCloudParkPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<CloudParkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ data: selectedDate });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/integracoes/cloudpark/logs?${params}`);
      const json = await res.json();
      setLogs(json.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [selectedDate, statusFilter]);

  const getStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETO':    return { bg: '#ecfdf5', text: '#10b981', icon: <CheckCircle2 size={12} />, bar: '#10b981' };
      case 'ERRO':        return { bg: '#fef2f2', text: '#ef4444', icon: <AlertCircle size={12} />, bar: '#ef4444' };
      case 'PROCESSANDO': return { bg: '#fefce8', text: '#eab308', icon: <Clock size={12} />, bar: '#eab308' };
      default:            return { bg: '#f9fafb', text: '#6b7280', icon: <Activity size={12} />, bar: '#6b7280' };
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return '--:--:--'; }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return '—'; }
  };

  const totals = {
    completo: logs.filter(l => l.status_processamento === 'COMPLETO').length,
    erro: logs.filter(l => l.status_processamento === 'ERRO').length,
    processando: logs.filter(l => l.status_processamento === 'PROCESSANDO').length,
  };

  return (
    <div className="logs-container">
      <header className="logs-header">
        <div className="header-left">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="title">Logs CloudPark</h1>
            <p className="subtitle">Monitoramento da integração push de movimentos</p>
          </div>
        </div>

        <div className="action-bar">
          <div className="date-filter">
            <Calendar size={16} className="icon" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="status-select">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="COMPLETO">Completo</option>
              <option value="ERRO">Erro</option>
              <option value="PROCESSANDO">Processando</option>
            </select>
          </div>

          <button onClick={fetchLogs} className="refresh-btn" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {/* Resumo do dia */}
      {logs.length > 0 && (
        <div className="summary-bar">
          <div className="summary-item">
            <span className="s-num">{logs.length}</span>
            <span className="s-label">Total</span>
          </div>
          <div className="summary-item success">
            <span className="s-num">{totals.completo}</span>
            <span className="s-label">Completos</span>
          </div>
          <div className="summary-item error">
            <span className="s-num">{totals.erro}</span>
            <span className="s-label">Erros</span>
          </div>
          <div className="summary-item warn">
            <span className="s-num">{totals.processando}</span>
            <span className="s-label">Processando</span>
          </div>
        </div>
      )}

      <div className="logs-content">
        {loading && logs.length === 0 ? (
          <div className="empty-state">
            <RefreshCw size={32} className="spin brand" />
            <p>Carregando registros...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Activity size={32} />
            <p>Nenhum log encontrado para {selectedDate.split('-').reverse().join('/')}.</p>
          </div>
        ) : (
          <div className="logs-stack">
            {logs.map((log) => {
              const s = getStatus(log.status_processamento);
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="log-card">
                  <div className="card-bar" style={{ backgroundColor: s.bar }} />
                  <div className="card-body">
                    <div className="card-top">
                      <div className="card-meta">
                        <span className="time">{formatTime(log.criado_em)}</span>
                        {log.operacao?.nome_operacao
                          ? <span className="filial-tag">{log.operacao.nome_operacao}</span>
                          : <span className="filial-tag">Filial {log.filial}</span>
                        }
                      </div>
                      <div className="card-right">
                        <div className="status-badge" style={{ backgroundColor: s.bg, color: s.text }}>
                          {s.icon} {log.status_processamento}
                        </div>
                        <button
                          className="expand-btn"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="card-stats">
                      <div className="stat">
                        <Package size={11} />
                        <span>{log.quantidade_itens ?? '—'} itens</span>
                      </div>
                      <div className="stat">
                        <Clock size={11} />
                        <span>Processado: {formatDateTime(log.processado_em)}</span>
                      </div>
                    </div>

                    {log.mensagem_erro && (
                      <div className="error-msg">
                        <AlertCircle size={12} />
                        <span>{log.mensagem_erro}</span>
                      </div>
                    )}

                    {isExpanded && log.payload_original && (
                      <details open className="json-details">
                        <summary>Payload Original</summary>
                        <pre>{JSON.stringify(log.payload_original, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .logs-container { padding-bottom: 3rem; width: 100%; min-height: 100%; }

        .logs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .back-btn { all: unset; cursor: pointer; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid var(--gray-200); color: var(--gray-500); transition: 0.2s; }
        .back-btn:hover { background: var(--gray-50); color: var(--brand-primary); border-color: var(--brand-primary-light); }
        .title { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.8px; color: var(--gray-900); }
        .subtitle { font-size: 0.85rem; color: var(--gray-400); font-weight: 500; }

        .action-bar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .date-filter { background: white; border: 1px solid var(--gray-200); border-radius: 14px; padding: 0 1rem; display: flex; align-items: center; gap: 0.75rem; height: 44px; box-shadow: var(--shadow-sm); }
        .date-filter .icon { color: var(--brand-primary); opacity: 0.6; }
        .date-filter input { all: unset; font-weight: 800; color: var(--gray-800); font-size: 0.95rem; cursor: pointer; }

        .status-select { background: white; border: 1px solid var(--gray-200); border-radius: 14px; padding: 0 1rem; display: flex; align-items: center; gap: 0.5rem; height: 44px; box-shadow: var(--shadow-sm); color: var(--gray-500); }
        .status-select select { all: unset; font-weight: 700; color: var(--gray-700); font-size: 0.85rem; cursor: pointer; }

        .refresh-btn { all: unset; cursor: pointer; background: white; border: 1px solid var(--gray-200); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: var(--gray-500); transition: 0.2s; box-shadow: var(--shadow-sm); }
        .refresh-btn:hover { background: var(--gray-50); border-color: var(--brand-primary); color: var(--brand-primary); }

        .summary-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .summary-item { background: white; border: 1px solid var(--gray-200); border-radius: 12px; padding: 0.75rem 1.25rem; display: flex; flex-direction: column; align-items: center; min-width: 80px; box-shadow: var(--shadow-sm); }
        .summary-item.success .s-num { color: #10b981; }
        .summary-item.error .s-num { color: #ef4444; }
        .summary-item.warn .s-num { color: #eab308; }
        .s-num { font-size: 1.5rem; font-weight: 900; color: var(--gray-900); line-height: 1; }
        .s-label { font-size: 0.65rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.4px; margin-top: 0.2rem; }

        .logs-stack { display: flex; flex-direction: column; gap: 0.65rem; }
        .log-card { display: flex; background: white; border-radius: 16px; border: 1px solid var(--gray-200); overflow: hidden; box-shadow: var(--shadow-sm); transition: 0.2s; }
        .log-card:hover { border-color: var(--brand-primary-light); }
        .card-bar { width: 5px; flex-shrink: 0; }
        .card-body { flex: 1; padding: 1rem 1.25rem; }

        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; gap: 0.5rem; }
        .card-meta { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
        .time { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 0.9rem; color: var(--gray-900); }
        .filial-tag { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: #EFF6FF; color: #3B82F6; padding: 0.15rem 0.6rem; border-radius: 64px; border: 1px solid #DBEAFE; }
        .op-tag { font-size: 0.65rem; font-weight: 700; background: var(--gray-50); color: var(--gray-500); padding: 0.15rem 0.6rem; border-radius: 64px; border: 1px solid var(--gray-100); }

        .card-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .status-badge { display: flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.6rem; border-radius: 8px; text-transform: uppercase; }
        .expand-btn { all: unset; cursor: pointer; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--gray-50); color: var(--gray-400); border: 1px solid var(--gray-100); transition: 0.15s; }
        .expand-btn:hover { color: var(--brand-primary); border-color: var(--brand-primary-light); }

        .card-stats { display: flex; gap: 1.25rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .stat { display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: var(--gray-400); font-weight: 600; }

        .error-msg { display: flex; align-items: flex-start; gap: 0.4rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.5rem 0.75rem; margin-top: 0.5rem; font-size: 0.8rem; color: #ef4444; font-weight: 600; line-height: 1.4; }

        .json-details { margin-top: 0.75rem; border-top: 1px solid var(--gray-50); padding-top: 0.5rem; }
        .json-details summary { font-size: 0.65rem; color: var(--brand-primary); font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.4px; opacity: 0.7; }
        .json-details pre { margin-top: 0.75rem; background: #1e293b; color: #cbd5e1; padding: 1rem; border-radius: 12px; font-size: 0.72rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; max-height: 300px; overflow-y: auto; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 0; color: var(--gray-400); gap: 1rem; font-weight: 600; }
        .spin { animation: spin 1s linear infinite; }
        .brand { color: var(--brand-primary); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .logs-header { flex-direction: column; align-items: flex-start; }
          .action-bar { width: 100%; }
          .title { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}
