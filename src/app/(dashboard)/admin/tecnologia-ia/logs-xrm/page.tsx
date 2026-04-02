'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Activity, 
  RefreshCw, AlertCircle, CheckCircle2, 
  Info, Clock, Database, FileText, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LogEntry {
  id: string;
  data_hora_log: string;
  nivel: string;
  etapa: string;
  mensagem: string;
  arquivo_nome?: string;
  quantidade_linhas?: number;
  status_execucao: string;
  detalhes_json: any;
}

export default function LogsControlXRMPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Inicia com a data de hoje formatada no fuso LOCAL (YYYY-MM-DD) para evitar erros de fuso
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
      // Passando o filtro de data para a API
      const response = await fetch(`/api/control-xrm/logs?data=${selectedDate}`);
      const data = await response.json();
      if (data.data) {
        setLogs(data.data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Falha ao carregar logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
    switch (String(status).toUpperCase()) {
      case 'SUCESSO': return { bg: '#ecfdf5', text: '#10b981', icon: <CheckCircle2 size={12} /> };
      case 'FALHA': return { bg: '#fef2f2', text: '#ef4444', icon: <AlertCircle size={12} /> };
      case 'EM_PROCESSAMENTO': return { bg: '#fefce8', text: '#eab308', icon: <Clock size={12} /> };
      default: return { bg: '#f9fafb', text: '#6b7280', icon: <Info size={12} /> };
    }
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel?.toUpperCase()) {
      case 'ERROR': return '#ef4444';
      case 'WARN': return '#f59e0b';
      case 'DEBUG': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <div className="logs-container">
      <header className="logs-header">
        <div className="header-left">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="title">Logs Control-XRM</h1>
            <p className="subtitle">Relatório técnico direto</p>
          </div>
        </div>

        <div className="action-bar">
          <div className="date-filter">
            <Calendar size={18} className="icon" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button onClick={fetchLogs} className="refresh-btn" title="Recarregar" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="logs-content-area">
        {loading && logs.length === 0 ? (
          <div className="status-state">
            <RefreshCw size={32} className="animate-spin text-brand" />
            <p>Sincronizando registros do dia...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="status-state">
            <Activity size={32} />
            <p>Nenhum log encontrado para {selectedDate.split('-').reverse().join('/')}.</p>
          </div>
        ) : (
          <div className="logs-stack">
            {logs.map((log) => {
              const status = getStatusColor(log.status_execucao);
              return (
                <div key={log.id} className="quick-log-card">
                  <div className="card-indicator" style={{ backgroundColor: getNivelColor(log.nivel) }} />
                  <div className="card-body">
                    <div className="card-top">
                      <div className="card-info">
                        <span className="time">{formatTime(log.data_hora_log)}</span>
                        <span className="step">{log.etapa}</span>
                      </div>
                      <div className="status" style={{ backgroundColor: status.bg, color: status.text }}>
                        {status.icon} {log.status_execucao || 'STATUS'}
                      </div>
                    </div>
                    
                    <p className="message">{log.mensagem}</p>

                    {(log.arquivo_nome || (log.quantidade_linhas !== undefined && log.quantidade_linhas > 0)) && (
                      <div className="meta-row">
                        {log.arquivo_nome && (
                          <div className="meta-item">
                            <FileText size={10} />
                            <span>{log.arquivo_nome}</span>
                          </div>
                        )}
                        {log.quantidade_linhas !== undefined && log.quantidade_linhas > 0 && (
                          <div className="meta-item">
                            <Database size={10} />
                            <span>{log.quantidade_linhas} linhas</span>
                          </div>
                        )}
                      </div>
                    )}

                    {log.detalhes_json && Object.keys(log.detalhes_json).length > 0 && (
                      <details className="json-details">
                        <summary>Contexto JSON</summary>
                        <pre>{JSON.stringify(log.detalhes_json, null, 2)}</pre>
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
        .logs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .back-btn { all: unset; cursor: pointer; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid var(--gray-200); color: var(--gray-500); transition: 0.2s; }
        .back-btn:hover { background: var(--gray-50); color: var(--brand-primary); border-color: var(--brand-primary-light); }
        .title { font-size: 1.6rem; font-weight: 900; letter-spacing: -0.8px; color: var(--gray-900); }
        .subtitle { font-size: 0.85rem; color: var(--gray-400); font-weight: 500; }
        
        .action-bar { display: flex; gap: 0.75rem; align-items: center; }
        .date-filter { background: white; border: 1px solid var(--gray-200); border-radius: 14px; padding: 0 1rem; display: flex; align-items: center; gap: 0.75rem; height: 44px; box-shadow: var(--shadow-sm); }
        .date-filter .icon { color: var(--brand-primary); opacity: 0.6; }
        .date-filter input { all: unset; font-weight: 800; color: var(--gray-800); font-size: 0.95rem; cursor: pointer; }
        
        .refresh-btn { all: unset; cursor: pointer; background: white; border: 1px solid var(--gray-200); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: var(--gray-500); transition: 0.2s; box-shadow: var(--shadow-sm); }
        .refresh-btn:hover { background: var(--gray-50); border-color: var(--brand-primary); color: var(--brand-primary); transform: rotate(15deg); }

        .animate-spin { animation: spin 1s linear infinite; }
        .text-brand { color: var(--brand-primary); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .logs-stack { display: flex; flex-direction: column; gap: 0.65rem; }
        .quick-log-card { display: flex; background: white; border-radius: 16px; border: 1px solid var(--gray-200); overflow: hidden; box-shadow: var(--shadow-sm); transition: 0.2s; }
        .quick-log-card:hover { border-color: var(--brand-primary-light); background: #fcfdfe; }
        .card-indicator { width: 5px; }
        .card-body { flex: 1; padding: 1rem 1.25rem; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
        .card-info { display: flex; align-items: center; gap: 0.75rem; }
        .time { font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 800; font-size: 0.9rem; color: var(--gray-900); }
        .step { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: var(--gray-50); color: var(--gray-500); padding: 0.15rem 0.6rem; border-radius: 64px; border: 1px solid var(--gray-100); }
        
        .status { display: flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.6rem; border-radius: 8px; }
        .message { font-size: 1rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.75rem; line-height: 1.4; }
        
        .meta-row { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
        .meta-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; color: var(--gray-400); font-weight: 600; }
        
        .json-details { margin-top: 0.5rem; border-top: 1px solid var(--gray-50); padding-top: 0.5rem; }
        .json-details summary { font-size: 0.65rem; color: var(--brand-primary); font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.4px; opacity: 0.7; }
        .json-details pre { margin-top: 0.75rem; background: #1e293b; color: #cbd5e1; padding: 1rem; border-radius: 12px; font-size: 0.75rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; }
        
        .status-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 0; color: var(--gray-400); gap: 1rem; text-align: center; font-weight: 600; }

        @media (max-width: 768px) {
          .logs-header { flex-direction: column; align-items: flex-start; }
          .action-bar { width: 100%; justify-content: space-between; }
          .date-filter { flex: 1; }
          .title { font-size: 1.3rem; }
          .quick-log-card { border-radius: 20px; }
        }
      `}</style>
    </div>
  );
}
