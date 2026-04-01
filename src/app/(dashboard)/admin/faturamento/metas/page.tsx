'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Target, Activity, TrendingUp, AlertCircle, 
  ChevronRight, Calendar, BarChart3, Clock, ArrowRight,
  ShieldCheck, Trash2, ShieldAlert, AlertTriangle, MessageSquare, Settings, AlertOctagon, Info, RefreshCcw
} from 'lucide-react';
import { 
  MetaFaturamento, Operacao, 
  STATUS_APURACAO_LABELS, TIPO_META_LABELS,
  StatusApuracaoMeta, TipoMeta, StatusAlertaMeta
} from '@/types';
import AlertaTratativaModal from '@/components/faturamento/AlertaTratativaModal';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Helper de formatação
const formatMoeda = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function MetasPage() {
  const [activeTab, setActiveTab] = useState<'mensal' | 'diaria'>('mensal');
  const [periodo, setPeriodo] = useState({ 
    mes: new Date().getMonth() + 1, 
    ano: new Date().getFullYear() 
  });

  const queryStr = `mes=${periodo.mes}&ano=${periodo.ano}&with_diarias=false`;
  const { data: metasData, mutate: fetchMetas, isValidating: isMetasValidating } = useSWR(`/api/metas-faturamento?${queryStr}`, fetcher);
  const { data: opsData } = useSWR("/api/operacoes", fetcher);
  const { data: sessionData } = useSWR('/api/auth/session', fetcher);

  const metas = metasData || [];
  const operacoes = opsData || [];
  const isRefreshing = isMetasValidating;
  const loading = !metasData;

  const [selectedAlerta, setSelectedAlerta] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<string>('');
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    if (sessionData?.user?.perfil) setUserProfile(sessionData.user.perfil);
  }, [sessionData]);

  const fetchDados = () => { fetchMetas(); };

  const [showModal, setShowModal] = useState(false);
  const [newMeta, setNewMeta] = useState({
    operacao_id: '',
    tipo_meta: 'operacao' as TipoMeta,
    valor_meta: 0,
    ano: periodo.ano,
    mes: periodo.mes,
    observacoes: ''
  });

  // Atualiza default da nova meta quando muda o filtro
  useEffect(() => {
    setNewMeta(p => ({ ...p, ano: periodo.ano, mes: periodo.mes }));
  }, [periodo]);

  const handleCreateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar Duplicidade
    const opNome = operacoes.find((o: Operacao) => o.id === newMeta.operacao_id)?.nome_operacao || 'esta operação';
    const isDup = metas.some((m: MetaFaturamento) => m.operacao_id === newMeta.operacao_id && m.tipo_meta === 'operacao');
    if (newMeta.tipo_meta === 'operacao' && isDup) {
       alert(`Erro: Já existe uma meta ativa cadastrada para "${opNome}" neste período.`);
       return;
    }

    try {
      const res = await fetch('/api/metas-faturamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMeta,
          operacao_id: newMeta.operacao_id === "" ? null : newMeta.operacao_id,
          tipo_meta: newMeta.operacao_id === "" ? 'global' : 'operacao'
        })
      });
      if (res.ok) {
        setShowModal(false);
        fetchDados();
        setNewMeta(p => ({ ...p, operacao_id: '', valor_meta: 0, observacoes: '' }));
      } else {
        const errData = await res.json();
        alert(`Erro ao cadastrar meta: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Falha na conexão com o servidor.');
    }
  };

  const handleDetalharMeta = async (id: string) => {
    setSelectedMetaId(id);
    setActiveTab('diaria');
    const meta = metas.find(m => m.id === id);
    if (meta && meta.diarias?.length > 0) return;
    try {
      const res = await fetch(`/api/metas-faturamento?id=${id}&with_diarias=true`);
      if (res.ok) {
        const updatedMetas = await res.json();
        const updatedMeta = updatedMetas[0];
        if (updatedMeta && metasData) {
          const newData = metasData.map((m: MetaFaturamento) => m.id === id ? updatedMeta : m);
          fetchMetas(newData, false); 
        }
      }
    } catch (err) { console.error('Error:', err); }
  };


  const handleDeleteMeta = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta meta? Esta ação registrará um log de auditoria.')) return;
    try {
      const res = await fetch(`/api/metas-faturamento/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Meta removida com sucesso!');
        fetchDados();
      } else {
        const err = await res.json();
        alert(`Erro ao excluir: ${err.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor.');
    }
  };

  const stats = React.useMemo(() => {
    return (Array.isArray(metas) ? metas : []).reduce((acc, current) => {
      const apuPre = (Array.isArray(current.apuracao) ? current.apuracao[0] : current.apuracao) || {};
      const hasDiarias = Array.isArray(current.diarias) && current.diarias.length > 0;
      let totalRealizadoOp = Number(apuPre.valor_realizado) || 0;
      if (totalRealizadoOp === 0 && hasDiarias) {
         totalRealizadoOp = current.diarias.reduce((sum: number, d: any) => sum + Number(d.valor_realizado_dia || 0), 0);
      }
      let esperadoAteHojeOp = Number(apuPre.valor_meta_parcial_esperada) || 0;
      if (esperadoAteHojeOp === 0 && hasDiarias) {
         esperadoAteHojeOp = current.diarias[current.diarias.length - 1].valor_meta_parcial_esperada || 0;
      }
      acc.totalMeta += Number(current.valor_meta) || 0;
      acc.totalRealizado += totalRealizadoOp;
      acc.totalEsperado += esperadoAteHojeOp;
      acc.totalProjetado += Number(apuPre.valor_projetado) || 0;
      
      if (apuPre.status_apuracao === 'critica' || apuPre.status_apuracao === 'meta_nao_atingida') acc.missed++;
      if (apuPre.status_apuracao === 'no_ritmo' || apuPre.status_apuracao === 'meta_atingida') acc.onTrack++;
      return acc;
  }, { totalMeta: 0, totalRealizado: 0, totalEsperado: 0, totalProjetado: 0, missed: 0, onTrack: 0 } as any);
  }, [metas]);

  const atingimentoGlobal = stats.totalMeta > 0 ? (stats.totalRealizado / stats.totalMeta) * 100 : 0;


  return (
    <div className="page-body-inner">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem',
        padding: '0'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              color: 'var(--brand-primary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              background: 'var(--brand-primary-light)',
              padding: '0.35rem 1rem',
              borderRadius: '20px'
            }}>Performance</span>
          </div>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 800, 
            letterSpacing: '-0.04em', 
            color: 'var(--gray-900)', 
            lineHeight: '1.05',
            marginBottom: '0.5rem'
          }}>Acompanhamento de Metas</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '1.05rem', fontWeight: 500 }}>
            Visão estratégica de faturamento, ritmo operacional e projeções do período.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
           <div className="filter-group" style={{ 
             padding: '0.75rem 1.5rem', 
             background: 'rgba(255,255,255,0.7)', 
             borderRadius: '20px', 
             border: '1px solid rgba(255,255,255,0.5)', 
             display: 'flex', 
             gap: '1rem', 
             boxShadow: 'var(--shadow-sm)',
             alignItems: 'center',
             backdropFilter: 'blur(12px)'
           }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={20} style={{ color: 'var(--brand-primary)' }} />
                <select 
                  value={periodo.mes} 
                  onChange={(e) => setPeriodo(p => ({ ...p, mes: Number(e.target.value) }))}
                  className="select-filter"
                  style={{ fontSize: '1rem', fontWeight: 700, border: 'none', appearance: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray-900)' }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
              <select 
                value={periodo.ano} 
                onChange={(e) => setPeriodo(p => ({ ...p, ano: Number(e.target.value) }))}
                className="select-filter"
                style={{ fontSize: '1rem', fontWeight: 700, border: 'none', appearance: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray-900)' }}
              >
                {[2024, 2025, 2026].map(ano => <option key={ano} value={ano}>{ano}</option>)}
              </select>
           </div>
           
           <button 
             onClick={() => setShowModal(true)}
             className="btn btn-primary btn-lg"
           >
             <Plus size={22} /> Nova Meta
           </button>
        </div>
      </header>

      {/* Strategic Executive KPI Grid */}
      {activeTab === 'mensal' && (
        <section className="stats-grid" style={{ marginBottom: '3.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
               <Target size={24} />
            </div>
            <div>
               <div className="stat-label">Meta Operacional</div>
               <div className="stat-value">{formatMoeda(stats.totalMeta)}</div>
            </div>
            <div className="stat-footer">{metas.length} operações ativas</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
               <TrendingUp size={24} />
            </div>
            <div>
               <div className="stat-label">Projeção Final</div>
               <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>{formatMoeda(stats.totalProjetado)}</div>
            </div>
            <div className="stat-footer" style={{ color: stats.totalProjetado >= stats.totalMeta ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                {stats.totalProjetado >= stats.totalMeta ? 'Tendência Positiva' : 'Abaixo da Meta'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
               <Activity size={24} />
            </div>
            <div>
               <div className="stat-label">Realizado Acum.</div>
               <div className="stat-value" style={{ color: 'var(--success)' }}>{formatMoeda(stats.totalRealizado)}</div>
            </div>
            <div className="stat-footer">Progresso: {atingimentoGlobal.toFixed(0)}%</div>
          </div>

          <div className="stat-card" style={{ background: 'var(--premium-gradient)', color: 'white' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
               <ShieldCheck size={24} />
            </div>
            <div>
               <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Atingimento Global</div>
               <div className="stat-value" style={{ color: 'white' }}>{atingimentoGlobal.toFixed(1)}%</div>
            </div>
          </div>
        </section>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'mensal' && (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ 
              padding: '1.5rem 2rem', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'var(--bg-card)' 
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>Performance por Operação</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>Detalhamento individual de metas e faturamento acumulado.</p>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '2rem' }}>Operação</th>
                    <th>Meta Mensal</th>
                    <th>Realizado Acum.</th>
                    <th>Esperado Acum.</th>
                    <th>Desvio</th>
                    <th>Atingimento</th>
                    <th>Status do Ritmo</th>
                    <th style={{ width: '180px', textAlign: 'right', paddingRight: '2.5rem' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="table-empty">Processando indicadores...</td></tr>
                  ) : metas.length === 0 ? (
                    <tr><td colSpan={8} className="table-empty">Nenhuma meta encontrada para os filtros aplicados.</td></tr>
                  ) : (
                    metas.map((meta: any) => {
                      const apuBase = (Array.isArray(meta.apuracao) ? meta.apuracao[0] : meta.apuracao) || {};
                      const hasDiarias = Array.isArray(meta.diarias) && meta.diarias.length > 0;
                      const realizado = Number(apuBase.valor_realizado) || (hasDiarias ? meta.diarias.reduce((sum: number, d: any) => sum + Number(d.valor_realizado_dia || 0), 0) : 0);
                      const esperado = Number(apuBase.valor_meta_parcial_esperada) || (hasDiarias ? meta.diarias[meta.diarias.length - 1].valor_meta_parcial_esperada : 0);
                      const desvio = realizado - esperado;
                      const ating = Number(meta.valor_meta) > 0 ? (realizado / meta.valor_meta) * 100 : 0;
                      
                      return (
                        <tr key={meta.id}>
                          <td style={{ paddingLeft: '2rem' }}>
                            <div className="font-bold">{meta.operacao?.nome_operacao || 'ESTRATEGICO GLOBAL'}</div>
                            <div className="text-xs text-muted">{meta.operacao?.bandeira || 'CONSOLIDADO'}</div>
                          </td>
                          <td className="font-semibold">{formatMoeda(meta.valor_meta)}</td>
                          <td className="font-semibold text-primary">{formatMoeda(realizado)}</td>
                          <td className="text-muted">{formatMoeda(esperado)}</td>
                          <td className={`font-bold ${desvio >= 0 ? 'text-success' : 'text-danger'}`}>{(desvio >= 0 ? '+' : '') + formatMoeda(desvio)}</td>
                          <td>
                             <div className="flex items-center gap-2">
                               <div className="progress-bar-bg" style={{ width: '80px' }}>
                                  <div className="progress-bar-fill" style={{ width: `${Math.min(ating, 100)}%`, background: ating >= 100 ? 'var(--success)' : ating >= 85 ? 'var(--warning)' : 'var(--danger)' }} />
                               </div>
                               <span className="text-sm font-bold">{ating.toFixed(1)}%</span>
                             </div>
                          </td>
                          <td>
                            {(() => {
                              const s = (apuBase.status_apuracao || '').toUpperCase();
                              if (s === 'NO_RITMO' || s === 'META_ATINGIDA' || s === 'ACIMA_DA_META') {
                                return <span className="badge badge-success">ACIMA DA META</span>;
                              }
                              if (s === 'CRITICA' || s === 'META_NAO_ATINGIDA' || s === 'ABAIXO_DA_META') {
                                return <span className="badge badge-danger">ABAIXO DA META</span>;
                              }
                              return <span className="badge badge-gray">SEM DADOS</span>;
                            })()}
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                            <div className="flex" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                className="btn btn-primary btn-xs" 
                                onClick={() => { handleDetalharMeta(meta.id) }}
                              >
                                <ArrowRight size={14} />
                                <span>Detalhar</span>
                              </button>
                              <button 
                                className="btn btn-danger btn-xs btn-icon" 
                                onClick={() => handleDeleteMeta(meta.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'diaria' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {!selectedMetaId ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>Detalhamento Diário</h3>
                <p style={{ color: 'var(--text-muted)' }}>Selecione uma operação na visão principal para visualizar o desdobramento diário.</p>
                <button onClick={() => setActiveTab('mensal')} className="btn btn-primary mt-4">Voltar para Visão Mensal</button>
              </div>
            ) : (
              (() => {
                const meta = metas.find((m: any) => m.id === selectedMetaId);
                if (!meta) return null;
                const apu = (Array.isArray(meta.apuracao) ? meta.apuracao[0] : meta.apuracao) || {};
                const diarias = [...(meta.diarias || [])].sort((a, b) => new Date(a.data_referencia).getTime() - new Date(b.data_referencia).getTime());
                
                const diariasValidas = diarias.filter((d: any) => Number(d.valor_realizado_dia) > 0);
                const mediaDiaria = diariasValidas.length > 0 ? diariasValidas.reduce((s: number, d: any) => s + Number(d.valor_realizado_dia), 0) / diariasValidas.length : 0;
                const melhorDiaObj = diarias.reduce((max: any, d: any) => Number(d.valor_realizado_dia || 0) > Number(max.valor_realizado_dia || 0) ? d : max, { valor_realizado_dia: 0 });
                const diasAcimaMeta = diarias.filter((d: any) => Number(d.valor_realizado_dia) >= Number(d.meta_planejada)).length;
                const percAcimaMeta = diarias.length > 0 ? (diasAcimaMeta / diarias.length) * 100 : 0;

                return (
                  <React.Fragment key={selectedMetaId}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <button onClick={() => setActiveTab('mensal')} className="btn btn-ghost btn-sm">
                           <RefreshCcw size={16} /> Voltar
                        </button>
                        <h2 style={{ margin: 0 }}>{meta.operacao?.nome_operacao || 'Detalhamento Diário'}</h2>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '3rem' }}>
                        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', margin: 0 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gray-300)' }}></div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Meta</span>
                           </div>
                           <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatMoeda(meta.valor_meta)}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Objetivo definido</div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', margin: 0 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)' }}></div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Projeção</span>
                           </div>
                           <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{formatMoeda(apu.valor_projetado || 0)}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)' }}>Tendência</div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', margin: 0 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Realizado</span>
                           </div>
                           <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{formatMoeda(apu.valor_realizado || 0)}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Acumulado</div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', border: 'none', background: 'var(--brand-primary)', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', color: 'white', margin: 0 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <ShieldCheck size={16} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Atingimento</span>
                           </div>
                           <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{(apu.percentual_atingimento || 0).toFixed(1)}%</div>
                           <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(apu.percentual_atingimento || 0, 100)}%`, height: '100%', background: '#10B981' }} />
                           </div>
                        </div>
                     </div>

                    {activeDate && (
                      <div className="card fade-in" style={{ padding: '1.5rem', background: 'var(--brand-primary)', color: '#fff', borderRadius: '24px', border: 'none', marginBottom: '2rem' }}>
                         {(() => {
                            const diaIndex = diarias.findIndex(d => d.data_referencia === activeDate);
                            const dia = diarias[diaIndex];
                            if (!dia) return null;
                            const ating = (Number(dia.valor_realizado_dia) / Number(dia.meta_planejada)) * 100;
                            return (
                               <>
                                  <header className="flex-between items-center mb-4">
                                     <div className="flex items-center gap-3">
                                        <Activity size={20} />
                                        <h4 className="text-base font-black m-0">Análise do Dia: {new Date(activeDate + 'T12:00:00').toLocaleDateString('pt-BR')}</h4>
                                     </div>
                                     <button onClick={() => setActiveDate(null)} className="btn btn-ghost btn-sm" style={{ color: 'white' }}>Fechar</button>
                                  </header>
                                  <div className="text-2xl font-black mb-2">{ating.toFixed(1)}% atingido</div>
                               </>
                            );
                         })()}
                      </div>
                    )}

                    <div className="card" style={{ padding: '1.5rem', height: '480px', borderRadius: '24px', background: 'var(--bg-card)', margin: 0 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Evolução Diária</h3>
                      <div style={{ flex: 1, width: '100%', height: '400px', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={diarias.map((d: any) => ({
                             name: d.data_referencia.split('-')[2],
                             realizado: d.valor_realizado_dia || 0,
                             meta: d.meta_planejada || 0
                           }))}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" />
                             <YAxis tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                             <Tooltip />
                             <Area type="monotone" dataKey="realizado" stroke="var(--brand-primary)" fill="var(--brand-primary-light)" strokeWidth={3} />
                             <Area type="stepAfter" dataKey="meta" stroke="var(--gray-400)" fill="transparent" strokeDasharray="5 5" />
                           </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'var(--bg-card)', marginTop: '2rem' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                          <div>
                             <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)' }}>MÉDIA DIÁRIA</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatMoeda(mediaDiaria)}</div>
                          </div>
                          <div>
                             <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)' }}>MELHOR DIA</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatMoeda(melhorDiaObj.valor_realizado_dia)}</div>
                          </div>
                          <div>
                             <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)' }}>BATIMENTO</div>
                             <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{percAcimaMeta.toFixed(1)}%</div>
                          </div>
                          <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '16px' }}>
                             <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>STATUS</div>
                             <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{apu.status_apuracao === 'no_ritmo' ? 'RITMO POSITIVO' : 'CRÍTICO'}</div>
                          </div>
                       </div>
                    </div>

                    <div className="table-container" style={{ marginTop: '2rem' }}>
                       <table className="table">
                          <thead>
                             <tr>
                                <th>Data</th>
                                <th>Realizado Dia</th>
                                <th>Meta Dia</th>
                                <th>Desvio Dia</th>
                                <th>Acumulado</th>
                                <th>Status</th>
                             </tr>
                          </thead>
                          <tbody>
                             {diarias.map((d: any, idx: number) => (
                               <tr key={idx}>
                                 <td className="font-bold">{new Date(d.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                                 <td className="font-bold">{formatMoeda(d.valor_realizado_dia)}</td>
                                 <td className="text-muted">{formatMoeda(d.meta_planejada)}</td>
                                 <td className={`font-bold ${d.desvio_dia >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoeda(d.desvio_dia)}</td>
                                 <td className="font-bold text-primary">{formatMoeda(d.valor_acumulado_mes)}</td>
                                 <td>
                                    {(() => {
                                      const s = (d.status_dia || '').toUpperCase();
                                      if (s === 'ACIMA_DA_META' || s.includes('DENTRO')) {
                                        return <span className="badge badge-success">ACIMA DA META</span>;
                                      }
                                      if (s === 'ABAIXO_DA_META' || s.includes('SEM_MOVIMENTO')) {
                                        return <span className="badge badge-danger">ABAIXO DA META</span>;
                                      }
                                      return <span className="badge badge-gray">SEM DADOS</span>;
                                    })()}
                                 </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </React.Fragment>
                );
              })()
            )}
          </div>
        )}

      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <h3 className="mb-6">Nova Meta Mensal</h3>
            <form onSubmit={handleCreateMeta} className="flex flex-col gap-4">
              <select className="form-control" value={newMeta.operacao_id} onChange={e => setNewMeta(p => ({ ...p, operacao_id: e.target.value }))} required>
                <option value="">Selecione Operação</option>
                {operacoes.map((op: Operacao) => <option key={op.id} value={op.id}>{op.nome_operacao}</option>)}
              </select>
              <input type="number" className="form-control" value={newMeta.valor_meta || ''} onChange={e => setNewMeta(p => ({ ...p, valor_meta: Number(e.target.value) }))} placeholder="Valor da Meta" required />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Criar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAlerta && (
        <AlertaTratativaModal 
          alerta={selectedAlerta}
          onClose={() => setSelectedAlerta(null)}
          onRefresh={() => fetchMetas()} // Mudado para recarregar metas
          canEdit={userProfile === 'auditoria' || userProfile === 'administrador'}
        />
      )}
    </div>
  );
}