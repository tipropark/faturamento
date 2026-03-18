'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, 
  ExternalLink, Search, Filter, History, ChevronRight
} from 'lucide-react';
import { 
  AlertaMeta, Operacao, 
  STATUS_ALERTA_META_LABELS, CRITICIDADE_ALERTA_LABELS,
  CriticidadeAlertaMeta, StatusAlertaMeta, StatusApuracaoMeta, STATUS_APURACAO_LABELS
} from '@/types';
import Link from 'next/link';

export default function CentralAlertasPage() {
  const [alertas, setAlertas] = useState<AlertaMeta[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    operacao_id: '',
    status: 'aberto',
    criticidade: ''
  });

  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filtros as any);
      const res = await fetch(`/api/metas-faturamento/alertas?${query}`);
      const data = await res.json();
      setAlertas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-title)' }}>Central de Alertas</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitoramento de desvios e apurações críticas do faturamento.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <select 
             className="form-control" 
             style={{ width: '200px' }}
             value={filtros.status}
             onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}
           >
              <option value="">Todos os Status</option>
              {Object.entries(STATUS_ALERTA_META_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
           </select>
           <select 
             className="form-control" 
             style={{ width: '150px' }}
             value={filtros.criticidade}
             onChange={e => setFiltros(f => ({ ...f, criticidade: e.target.value }))}
           >
              <option value="">Criticidades</option>
              {Object.entries(CRITICIDADE_ALERTA_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
           </select>
        </div>
      </header>

      <div className="card" style={{ padding: '0' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Gerado em</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Operação</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tipo de Alerta</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Criticidade</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status / Tratativa</th>
                <th style={{ padding: '1rem 1.5rem', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>Buscando alertas...</td></tr>
              ) : alertas.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>Nenhum alerta pendente para estes filtros.</td></tr>
              ) : alertas.map(alerta => (
                <tr key={alerta.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(alerta.gerado_em).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(alerta.gerado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{alerta.operacao?.nome_operacao || 'GLOBAL'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alerta.operacao?.bandeira}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: alerta.tipo_alerta === 'apuracao_inconclusiva' ? 'var(--warning)' : 'var(--danger)'
                    }}>
                       <AlertTriangle size={16} />
                       <span style={{ fontWeight: 600 }}>{STATUS_APURACAO_LABELS[alerta.tipo_alerta as StatusApuracaoMeta]}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{alerta.motivo_preliminar}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px',
                      background: alerta.criticidade === 'critica' || alerta.criticidade === 'alta' ? 'var(--danger-bg)' : 
                                 alerta.criticidade === 'media' ? 'var(--warning-bg)' : 'var(--info-bg)',
                      color: alerta.criticidade === 'critica' || alerta.criticidade === 'alta' ? 'var(--danger)' : 
                            alerta.criticidade === 'media' ? 'var(--warning)' : 'var(--info)'
                    }}>
                       {CRITICIDADE_ALERTA_LABELS[alerta.criticidade as CriticidadeAlertaMeta]}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <div style={{ 
                         width: '8px', height: '8px', borderRadius: '50%',
                         background: alerta.status === 'concluido' ? 'var(--success)' : 
                                    alerta.status === 'cancelado' ? 'var(--text-muted)' : 'var(--warning)'
                       }} />
                       <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{STATUS_ALERTA_META_LABELS[alerta.status as StatusAlertaMeta]}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <Link href={`/admin/faturamento/alertas/${alerta.id}`} className="btn-icon">
                       <ChevronRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
