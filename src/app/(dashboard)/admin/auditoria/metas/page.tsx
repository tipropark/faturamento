'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, AlertTriangle, CheckCircle2, 
  Search, Filter, ChevronRight, PenLine, 
  Target, Activity, Clock, RefreshCcw, Info
} from 'lucide-react';
import { 
  AlertaMeta, Operacao, 
  STATUS_ALERTA_META_LABELS, 
  CRITICIDADE_ALERTA_LABELS,
  PERFIL_LABELS 
} from '@/types';

export default function AuditoriaMetasPage() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    operacao_id: '',
    status: '',
    criticidade: ''
  });

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const query = new URLSearchParams(filtros);
      const [resAlertas, resOps] = await Promise.all([
        fetch(`/api/metas-faturamento/alertas?${query}`),
        fetch('/api/operacoes')
      ]);
      
      const dataAlertas = await resAlertas.json();
      const dataOps = await resOps.json();

      setAlertas(Array.isArray(dataAlertas) ? dataAlertas : []);
      setOperacoes(Array.isArray(dataOps) ? dataOps : []);
    } catch (err) {
      console.error(err);
      setAlertas([]);
      setOperacoes([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const stats = (Array.isArray(alertas) ? alertas : []).reduce((acc: any, a: any) => {
    if (a.status === 'aberto') acc.abertos++;
    if (a.status === 'em_analise' || a.status === 'encaminhado_auditoria') acc.pendentes++;
    if (a.criticidade === 'alta' || a.criticidade === 'critica') acc.criticos++;
    return acc;
  }, { abertos: 0, pendentes: 0, criticos: 0 });

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Central de Alertas e Auditoria de Metas</h1>
          <p className="page-subtitle">Monitoramento proativo e tratativas de desempenho operacional.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="btn btn-secondary" onClick={() => fetchDados()} disabled={isRefreshing}>
              <RefreshCcw size={16} className={isRefreshing ? 'rotate-animation' : ''} />
           </button>
        </div>
      </div>

      {/* Stats Board */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
         <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px' }}>
               <AlertTriangle size={28} />
            </div>
            <div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Casos Críticos</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.criticos}</div>
            </div>
         </div>
         <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '1rem', borderRadius: '12px' }}>
               <Clock size={28} />
            </div>
            <div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Abertos / Novos</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.abertos}</div>
            </div>
         </div>
         <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <div style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', padding: '1rem', borderRadius: '12px' }}>
               <Activity size={28} />
            </div>
            <div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Em Tratativa / Análise</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.pendentes}</div>
            </div>
         </div>
      </section>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
             <Search size={18} color="var(--gray-400)" />
             <select 
               className="form-control" 
               style={{ border: 'none', background: 'transparent', fontWeight: 600 }}
               value={filtros.operacao_id}
               onChange={(e) => setFiltros(f => ({ ...f, operacao_id: e.target.value }))}
             >
                <option value="">Todas as Operações</option>
                {operacoes.map(op => <option key={op.id} value={op.id}>{op.nome_operacao}</option>)}
             </select>
          </div>
          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Filter size={16} color="var(--gray-400)" />
             <select 
               className="form-control" 
               style={{ border: 'none', background: 'transparent', fontWeight: 600 }}
               value={filtros.status}
               onChange={(e) => setFiltros(f => ({ ...f, status: e.target.value }))}
             >
                <option value="">Todos os Status</option>
                <option value="aberto">Abertos</option>
                <option value="em_analise">Em Tratativa</option>
                <option value="concluido">Concluídos</option>
             </select>
          </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
         <div className="table-container">
            <table className="table">
               <thead>
                  <tr style={{ background: 'var(--bg-app)' }}>
                     <th>Data Alerta</th>
                     <th>Operação</th>
                     <th>Tipo Alerta</th>
                     <th style={{ textAlign: 'center' }}>Criticidade</th>
                     <th>Responsável / Auditor</th>
                     <th style={{ textAlign: 'center' }}>Status</th>
                     <th style={{ width: '80px' }}></th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--gray-400)' }}>Carregando auditoria...</td></tr>
                  ) : alertas.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--gray-400)' }}>Parabéns! Nenhum alerta crítico reportado para os filtros selecionados.</td></tr>
                  ) : (
                    alertas.map(a => (
                      <tr key={a.id} style={{ transition: 'background 0.2s', background: a.status === 'aberto' ? 'var(--bg-app-alt)' : 'transparent' }}>
                         <td style={{ fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600 }}>{new Date(a.gerado_em).toLocaleDateString('pt-BR')}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>{new Date(a.gerado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</div>
                         </td>
                         <td>
                            <div style={{ fontWeight: 700 }}>{a.operacao?.nome_operacao || 'Global'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Cia: {a.operacao?.bandeira || '-'}</div>
                         </td>
                         <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.tipo_alerta}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 700 }}>Refs: Meta {a.meta?.mes}/{a.meta?.ano}</div>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '12px',
                              background: a.criticidade === 'baixa' ? 'var(--info-bg)' : a.criticidade === 'media' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                              color: a.criticidade === 'baixa' ? 'var(--info)' : a.criticidade === 'media' ? 'var(--warning-dark)' : 'var(--danger)'
                            }}>
                               {CRITICIDADE_ALERTA_LABELS[a.criticidade as any] || a.criticidade}
                            </span>
                         </td>
                         <td>
                            {a.tratativa?.[0]?.auditor ? (
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>{a.tratativa[0].auditor.nome.substring(0,2)}</div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.tratativa[0].auditor.nome}</span>
                               </div>
                            ) : <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Sem auditor designado</span>}
                         </td>
                         <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: a.status === 'concluido' ? 'var(--success)' : a.status === 'aberto' ? 'var(--danger)' : 'var(--brand-primary)' }}>
                               {STATUS_ALERTA_META_LABELS[a.status as any] || a.status}
                            </span>
                         </td>
                         <td>
                            <button 
                              className="btn-icon" 
                              title="Tratar Alerta"
                              onClick={() => window.location.href = `/admin/auditoria/metas/tratativa/${a.id}`}
                            >
                               <PenLine size={18} />
                            </button>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
