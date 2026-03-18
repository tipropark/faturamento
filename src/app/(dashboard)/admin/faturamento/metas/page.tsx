'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Target, Activity, TrendingUp, AlertCircle, 
  ChevronRight, Calendar, BarChart3, Clock, ArrowRight,
  ShieldCheck, Trash2, ShieldAlert
} from 'lucide-react';
import { 
  MetaFaturamento, Operacao, 
  STATUS_APURACAO_LABELS, TIPO_META_LABELS,
  StatusApuracaoMeta, TipoMeta
} from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Helper de formatação
const formatMoeda = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function MetasPage() {
  const [metas, setMetas] = useState<any[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({ 
    mes: new Date().getMonth() + 1, 
    ano: new Date().getFullYear() 
  });
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

  const fetchDados = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ano: periodo.ano.toString(),
        mes: periodo.mes.toString()
      });
      const [resMetas, resOps] = await Promise.all([
        fetch(`/api/metas-faturamento?${query}`, { cache: 'no-store' }),
        fetch('/api/operacoes', { cache: 'no-store' })
      ]);
      
      if (!resMetas.ok) {
        const err = await resMetas.json();
        alert(`Erro ao buscar metas: ${err.error || 'Erro desconhecido'}`);
        setMetas([]);
      } else {
        const dataMetas = await resMetas.json();
        setMetas(Array.isArray(dataMetas) ? dataMetas : []);
      }
      
      const dataOps = await resOps.json();
      setOperacoes(Array.isArray(dataOps) ? dataOps : []);
    } catch (err: any) {
      console.error(err);
      alert(`Falha técnica: ${err.message}`);
      setMetas([]);
      setOperacoes([]);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleCreateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 0. Validar Duplicidade Local
    const opNome = operacoes.find(o => o.id === newMeta.operacao_id)?.nome_operacao || 'esta operação';
    const isDup = metas.some(m => m.operacao_id === newMeta.operacao_id && m.tipo_meta === 'operacao');
    if (newMeta.tipo_meta === 'operacao' && isDup) {
       alert(`Erro: Já existe uma meta ativa cadastrada para "${opNome}" neste período.`);
       return;
    }

    try {
      const res = await fetch('/api/metas-faturamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeta)
      });
      if (res.ok) {
        setShowModal(false);
        fetchDados();
        // Reset state
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

  const [activeTab, setActiveTab] = useState<'mensal' | 'diaria' | 'alertas'>('mensal');
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);

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

  // Cálculos de Dashboard
  const stats = (Array.isArray(metas) ? metas : []).reduce((acc, current) => {
    // Tenta pegar o consolidado pré-calculado. Se vier 0 mas houver diárias, faz o fallback (redundância de segurança)
    const apuPre = (Array.isArray(current.apuracao) ? current.apuracao[0] : current.apuracao) || {};
    const hasDiarias = Array.isArray(current.diarias) && current.diarias.length > 0;
    
    // Cálculo seguro do realizado (Soma diárias se o consolidado estiver zerado)
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
  }, { totalMeta: 0, totalRealizado: 0, totalEsperado: 0, totalProjetado: 0, missed: 0, onTrack: 0 });

  const atingimentoGlobal = stats.totalMeta > 0 ? (stats.totalRealizado / stats.totalMeta) * 100 : 0;
  const desvioGlobal = stats.totalRealizado - stats.totalEsperado;

  return (
    <div className="page-body-inner">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: activeTab === 'mensal' ? '3rem' : '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dashboard de Performance</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-title)', lineHeight: '1.2' }}>Acompanhamento de Metas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Visão estratégica de faturamento, ritmo operacional e projeções do período.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
           <div className="filter-group" style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
              <select 
                value={periodo.mes} 
                onChange={(e) => setPeriodo(p => ({ ...p, mes: Number(e.target.value) }))}
                className="select-filter"
                style={{ fontWeight: 700, border: 'none', appearance: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', alignSelf: 'center' }}></div>
              <select 
                value={periodo.ano} 
                onChange={(e) => setPeriodo(p => ({ ...p, ano: Number(e.target.value) }))}
                className="select-filter"
                style={{ fontWeight: 700, border: 'none', appearance: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {[2024, 2025, 2026].map(ano => <option key={ano} value={ano}>{ano}</option>)}
              </select>
           </div>
           
           <button 
             onClick={() => setShowModal(true)}
             className="btn btn-primary"
             style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 700, boxShadow: '0 8px 16px var(--brand-primary-light)' }}
           >
             <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nova Meta
           </button>
        </div>
      </header>

      {/* Strategic Executive KPI Grid - Renderizado apenas na VISÃO MENSAL */}
      {activeTab === 'mensal' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {/* KPI: Meta Total */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-app))', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', borderRadius: '12px' }}><Target size={20} /></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Objetivo do Mês</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)' }}>{formatMoeda(stats.totalMeta)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Metas ativas para {metas.length} operações
            </div>
          </div>

          {/* KPI: Realizado */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '12px' }}><Activity size={20} /></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Realizado Acum.</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{formatMoeda(stats.totalRealizado)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div className="progress-bar-bg" style={{ flex: 1, height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(atingimentoGlobal, 100)}%`, background: atingimentoGlobal >= 100 ? 'var(--success)' : atingimentoGlobal >= 85 ? 'var(--warning)' : 'var(--danger)' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: atingimentoGlobal >= 100 ? 'var(--success)' : 'var(--text-muted)' }}>{atingimentoGlobal.toFixed(0)}%</span>
            </div>
          </div>

          {/* KPI: Projeção Erp */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.65rem', fontWeight: 800, borderRadius: '0 0 0 12px' }}>IA FORECAST</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', borderRadius: '12px' }}><TrendingUp size={20} /></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Projeção Final</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{formatMoeda(stats.totalProjetado)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: stats.totalProjetado >= stats.totalMeta ? 'var(--success)' : 'var(--danger)' }}>
                {stats.totalProjetado >= stats.totalMeta ? 'Tendência: Bater a Meta ✅' : 'Tendência: Não Bater ❌'}
            </div>
          </div>

          {/* KPI: Desvio */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', background: desvioGlobal >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: desvioGlobal >= 0 ? 'var(--success)' : 'var(--danger)', borderRadius: '12px' }}>
                  {desvioGlobal >= 0 ? <Plus size={20} /> : <Clock size={20} />}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Gap vs Esperado</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: desvioGlobal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {(desvioGlobal >= 0 ? '+' : '') + formatMoeda(Math.abs(desvioGlobal))}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Comparado ao ritmo ideal (D-{new Date().getDate()})
            </div>
          </div>

          {/* KPI: Status Geral */}
          <div className="card" style={{ padding: '1.75rem', border: 'none', background: 'var(--gray-800)', borderRadius: '24px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px' }}><ShieldAlert size={20} /></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Saúde das Operações</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>Operações no Ritmo</span>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'var(--success)', fontSize: '0.75rem', fontWeight: 800 }}>{stats.onTrack}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>Demandam Atenção</span>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'var(--danger)', fontSize: '0.75rem', fontWeight: 800 }}>{stats.missed}</span>
                </div>
            </div>
          </div>
        </section>
      )}

      {/* Tabs Navigation - Segmented Control Premium Style */}
      <div style={{ 
        display: 'inline-flex', 
        background: 'var(--gray-100)', 
        padding: '0.4rem', 
        borderRadius: '16px', 
        marginBottom: '2.5rem',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {[
          { id: 'mensal', label: 'Visão Mensal', icon: <BarChart3 size={18} /> },
          { id: 'diaria', label: 'Visão Diária', icon: <Calendar size={18} /> },
          { id: 'alertas', label: 'Alertas e Desvios', icon: <AlertCircle size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--gray-500)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

       {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'mensal' && (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Performance por Operação</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>No Ritmo: {stats.onTrack}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Críticas: {stats.missed}</span>
                 </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Operação</th>
                    <th>Meta Mensal</th>
                    <th>Realizado Acum.</th>
                    <th>Esperado Acum.</th>
                    <th>Desvio</th>
                    <th>Atingimento</th>
                    <th>Status do Ritmo</th>
                    <th style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="table-empty">Processando indicadores...</td></tr>
                  ) : metas.length === 0 ? (
                    <tr><td colSpan={8} className="table-empty">Nenhuma meta encontrada para os filtros aplicados.</td></tr>
                  ) : (
                    metas.map((meta) => {
                      const apuBase = (Array.isArray(meta.apuracao) ? meta.apuracao[0] : meta.apuracao) || {};
                      const hasDiarias = Array.isArray(meta.diarias) && meta.diarias.length > 0;
                      const realizado = Number(apuBase.valor_realizado) || (hasDiarias ? meta.diarias.reduce((sum: number, d: any) => sum + Number(d.valor_realizado_dia || 0), 0) : 0);
                      const esperado = Number(apuBase.valor_meta_parcial_esperada) || (hasDiarias ? meta.diarias[meta.diarias.length - 1].valor_meta_parcial_esperada : 0);
                      const desvio = realizado - esperado;
                      const ating = Number(meta.valor_meta) > 0 ? (realizado / meta.valor_meta) * 100 : 0;
                      
                      return (
                        <tr key={meta.id}>
                          <td>
                            <div className="font-bold">{meta.operacao?.nome_operacao || 'ESTRATEGICO GLOBAL'}</div>
                            <div className="text-xs text-muted">{meta.operacao?.bandeira || 'CONSOLIDADO'}</div>
                          </td>
                          <td className="font-semibold">{formatMoeda(meta.valor_meta)}</td>
                          <td className="font-semibold text-primary">{formatMoeda(realizado)}</td>
                          <td className="text-muted">{formatMoeda(esperado)}</td>
                          <td className={`font-bold ${desvio >= 0 ? 'text-success' : 'text-danger'}`}>{(desvio >= 0 ? '+' : '') + formatMoeda(desvio)}</td>
                          <td>
                             <div className="flex-center gap-2">
                               <div className="progress-bar-bg" style={{ width: '80px' }}>
                                  <div className="progress-bar-fill" style={{ width: `${Math.min(ating, 100)}%`, background: ating >= 100 ? 'var(--success)' : ating >= 85 ? 'var(--warning)' : 'var(--danger)' }} />
                               </div>
                               <span className="text-sm font-bold">{ating.toFixed(1)}%</span>
                             </div>
                          </td>
                          <td>
                            <span className={`badge ${apuBase.status_apuracao === 'no_ritmo' ? 'badge-success' : apuBase.status_apuracao === 'critica' ? 'badge-danger' : 'badge-warning'}`}>
                              {STATUS_APURACAO_LABELS[apuBase.status_apuracao as StatusApuracaoMeta] || (realizado > 0 ? 'EM ANDAMENTO' : 'PENDENTE')}
                            </span>
                          </td>
                          <td>
                            <div className="flex-center gap-1">
                              <button className="btn-icon" onClick={() => { setSelectedMetaId(meta.id); setActiveTab('diaria'); }}><ArrowRight size={16} /></button>
                              <button className="btn-icon delete-btn" onClick={() => handleDeleteMeta(meta.id)}><Trash2 size={16} /></button>
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
                <p style={{ color: 'var(--text-muted)' }}>Selecione uma operação na aba Visão Mensal para visualizar o desdobramento diário.</p>
              </div>
            ) : (
              (() => {
                const meta = metas.find(m => m.id === selectedMetaId);
                if (!meta) return null;
                const apu = (Array.isArray(meta.apuracao) ? meta.apuracao[0] : meta.apuracao) || {};
                const diarias = [...(meta.diarias || [])].sort((a, b) => new Date(a.data_referencia).getTime() - new Date(b.data_referencia).getTime());
                
                // Insights Calculations
                const diariasValidas = diarias.filter((d: any) => Number(d.valor_realizado_dia) > 0);
                const mediaDiaria = diariasValidas.length > 0 ? diariasValidas.reduce((s: number, d: any) => s + Number(d.valor_realizado_dia), 0) / diariasValidas.length : 0;
                const melhorDiaObj = diarias.reduce((max: any, d: any) => Number(d.valor_realizado_dia || 0) > Number(max.valor_realizado_dia || 0) ? d : max, { valor_realizado_dia: 0 });
                const diasAcimaMeta = diarias.filter((d: any) => Number(d.valor_realizado_dia) >= Number(d.meta_planejada)).length;
                const percAcimaMeta = diarias.length > 0 ? (diasAcimaMeta / diarias.length) * 100 : 0;

                return (
                  <React.Fragment key={selectedMetaId}>
                    {/* Top Stats for Selected Meta */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                       <div className="card" style={{ padding: '1.5rem', border: 'none', background: 'var(--bg-app-light)', borderLeft: '4px solid var(--brand-primary)' }}>
                          <div className="text-xs text-muted font-bold mb-2">META MENSAL OPERAÇÃO</div>
                          <div className="text-2xl font-extrabold">{formatMoeda(meta.valor_meta)}</div>
                       </div>
                       <div className="card" style={{ padding: '1.5rem', border: 'none', background: 'var(--bg-app-light)', borderLeft: '4px solid var(--brand-primary)' }}>
                          <div className="text-xs text-muted font-bold mb-2">PROJEÇÃO ATUAL</div>
                          <div className="text-2xl font-extrabold text-primary">{formatMoeda(apu.valor_projetado || 0)}</div>
                       </div>
                       <div className="card" style={{ padding: '1.5rem', border: 'none', background: 'var(--bg-app-light)', borderLeft: `4px solid ${apu.desvio_valor >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                          <div className="text-xs text-muted font-bold mb-2">REALIZADO ATÉ HOJE</div>
                          <div className="text-2xl font-extrabold">{formatMoeda(apu.valor_realizado || 0)}</div>
                       </div>
                       <div className="card" style={{ padding: '1.5rem', border: 'none', background: 'var(--gray-800)', color: 'white' }}>
                          <div className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>ATINGIMENTO</div>
                          <div className="text-2xl font-extrabold" style={{ color: 'var(--success)' }}>{(apu.percentual_atingimento || 0).toFixed(1)}%</div>
                       </div>
                    </div>

                    {/* Chart + Insights Panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                      <div className="card" style={{ padding: '2rem', height: '450px', border: 'none' }}>
                        <div className="flex-between mb-8">
                           <h3 className="text-lg font-bold">Evolução Diária - {meta.operacao?.nome_operacao || 'Global'}</h3>
                           <div className="flex gap-4 text-xs">
                              <div className="flex-center gap-2">
                                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--brand-primary)' }}></div>
                                 <span className="font-bold">Realizado</span>
                              </div>
                              <div className="flex-center gap-2">
                                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px dashed var(--gray-400)' }}></div>
                                 <span className="font-bold text-muted">Meta Diária</span>
                              </div>
                           </div>
                        </div>
                        
                        <ResponsiveContainer width="100%" height="80%">
                           <AreaChart
                             data={diarias.map((d: any) => ({
                               name: new Date(d.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                               realizado: d.valor_realizado_dia || 0,
                               meta: d.meta_planejada || (Number(meta.valor_meta) / (Number(meta.diarias?.length) || 30))
                             }))}
                           >
                             <defs>
                               <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.2}/>
                                 <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0.02}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" strokeOpacity={0.5} />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--gray-400)' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--gray-400)' }} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                             <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-xl)', background: 'var(--bg-card)', padding: '1rem' }} 
                               formatter={(val: any, name: any) => [formatMoeda(Number(val)), name === 'realizado' ? 'Faturamento' : 'Meta']}
                             />
                             <Area type="monotone" dataKey="realizado" name="realizado" stroke="var(--brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorRealizado)" animationDuration={1500} />
                             <Area type="stepAfter" dataKey="meta" name="meta" stroke="var(--gray-400)" strokeWidth={2} strokeDasharray="6 6" fill="transparent" />
                           </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Side Insight Panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                         <div className="card" style={{ padding: '1.5rem', border: 'none', flex: 1 }}>
                            <h4 className="text-sm font-bold text-muted mb-6 uppercase tracking-wider">Métricas de Ritmo</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                               <div className="flex-between">
                                  <div className="flex-center gap-3">
                                     <div style={{ padding: '0.6rem', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', borderRadius: '10px' }}><Activity size={18} /></div>
                                     <div>
                                        <div className="text-xs text-muted font-bold">MÉDIA DIÁRIA</div>
                                        <div className="text-base font-extrabold">{formatMoeda(mediaDiaria)}</div>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex-between">
                                  <div className="flex-center gap-3">
                                     <div style={{ padding: '0.6rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '10px' }}><TrendingUp size={18} /></div>
                                     <div>
                                        <div className="text-xs text-muted font-bold">PICO DE FATURAMENTO</div>
                                        <div className="text-base font-extrabold">{formatMoeda(melhorDiaObj.valor_realizado_dia)}</div>
                                        <div className="text-xs" style={{ color: 'var(--gray-400)' }}>{melhorDiaObj.data_referencia ? new Date(melhorDiaObj.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</div>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex-between">
                                  <div className="flex-center gap-3">
                                     <div style={{ padding: '0.6rem', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '10px' }}><ShieldCheck size={18} /></div>
                                     <div>
                                        <div className="text-xs text-muted font-bold">FREQUÊNCIA DE BATIMENTO</div>
                                        <div className="text-base font-extrabold">{percAcimaMeta.toFixed(1)}%</div>
                                        <div className="text-xs" style={{ color: 'var(--gray-400)' }}>{diasAcimaMeta} de {diarias.length} dias acima da meta</div>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-app-light)', borderRadius: '12px' }}>
                               <div className="text-xs font-bold text-muted mb-2">STATUS OPERACIONAL</div>
                               <div className={`text-sm font-bold ${apu.status_apuracao === 'no_ritmo' ? 'text-success' : 'text-danger'}`}>
                                  {apu.status_apuracao === 'no_ritmo' ? 'Operação está gerando o resultado esperado conforme o fluxo do mês.' : 'Operação abaixo do ritmo. Necessária intervenção gerencial imediata.'}
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
                       <div className="flex-between p-6 bg-card border-b border-color">
                          <h3 className="text-lg font-bold">Detalhamento por Dia</h3>
                          <button onClick={() => setSelectedMetaId(null)} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>Trocar de Operação</button>
                       </div>
                       <div className="table-container">
                          <table className="table">
                             <thead>
                                <tr>
                                   <th>Data</th>
                                   <th>Realizado Dia</th>
                                   <th>Meta Dia</th>
                                   <th>Desvio Dia</th>
                                   <th>Acumulado</th>
                                   <th>Atingimento</th>
                                   <th>Status</th>
                                </tr>
                             </thead>
                             <tbody>
                                {diarias.map((d: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="font-bold">{new Date(d.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}</td>
                                    <td className="font-bold">{formatMoeda(d.valor_realizado_dia)}</td>
                                    <td className="text-muted">{formatMoeda(d.meta_planejada)}</td>
                                    <td className={`font-bold ${d.desvio_dia >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoeda(d.desvio_dia)}</td>
                                    <td className="font-bold text-primary">{formatMoeda(d.valor_acumulado_mes)}</td>
                                    <td className="font-bold">{d.percentual_atingimento_acumulado.toFixed(1)}%</td>
                                    <td>
                                       <span className={`badge ${d.status_dia === 'acima_da_meta' || d.status_dia === 'dentro_da_meta' ? 'badge-success' : 'badge-danger'}`}>
                                          {d.status_dia.toUpperCase().replace(/_/g, ' ')}
                                       </span>
                                    </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </React.Fragment>
                );
              })()
            )}
          </div>
        )}

        {activeTab === 'alertas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ padding: '0 0.5rem' }}>
               <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Central de Alertas e Desvios</h2>
               <p style={{ color: 'var(--text-muted)' }}>Operações que exigem atenção imediata com base no ritmo de faturamento.</p>
            </div>

            <div className="grid-responsive-300 gap-6">
              {metas.filter(m => {
                const apu = (Array.isArray(m.apuracao) ? m.apuracao[0] : m.apuracao) || {};
                return apu.status_apuracao === 'critica' || (apu.percentual_atingimento < 85);
              }).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-color)', width: '100%', gridColumn: '1 / -1' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                       <ShieldCheck size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tudo sob controle!</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto' }}>Não identificamos operações com desvios críticos para o ritmo esperado até agora.</p>
                </div>
              ) : (
                metas.filter(m => {
                  const apu = (Array.isArray(m.apuracao) ? m.apuracao[0] : m.apuracao) || {};
                  return apu.status_apuracao === 'critica' || (apu.percentual_atingimento < 85);
                }).map(meta => {
                  const apu = (Array.isArray(meta.apuracao) ? meta.apuracao[0] : meta.apuracao) || {};
                  const diff = Math.abs((apu.valor_realizado || 0) - (apu.valor_meta_parcial_esperada || 0));
                  
                  return (
                    <div key={meta.id} className="card" style={{ padding: '1.5rem', border: 'none', background: 'var(--bg-card)', borderLeft: '6px solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}>
                       <div className="flex-between mb-4">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '8px' }}><ShieldAlert size={18} /></div>
                             <span className="font-bold text-base">{meta.operacao?.nome_operacao || 'Unidade'}</span>
                          </div>
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem', fontWeight: 900 }}>CRÍTICO</span>
                       </div>
                       
                       <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Déficit de Ritmo</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>- {formatMoeda(diff)}</div>
                       </div>

                       <div style={{ padding: '1rem', background: 'var(--bg-app-light)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Diagnóstico</div>
                          <div style={{ fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 600 }}>
                             Atingimento de {apu.percentual_atingimento?.toFixed(1)}%. Ritmo atual não garante a conclusão da meta até o fim do mês.
                          </div>
                       </div>

                       <button 
                         onClick={() => { setSelectedMetaId(meta.id); setActiveTab('diaria'); }}
                         className="btn btn-primary btn-sm"
                         style={{ width: '100%', borderRadius: '10px', fontSize: '0.8rem' }}
                       >
                         Ver Detalhes e Plano de Ação
                       </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova Meta Mensal - Executive Redesign */}
      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(9, 9, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)', zIndex: 1000 
        }}>
          <div className="card" style={{ width: '480px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: 'none', borderRadius: '32px' }}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
               <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Nova Meta Mensal</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Defina os objetivos de faturamento do período.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="btn-icon" style={{ borderRadius: '50%' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>

            <form onSubmit={handleCreateMeta} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tipo de Meta</label>
                <div style={{ display: 'flex', background: 'var(--gray-100)', padding: '0.25rem', borderRadius: '12px' }}>
                  {['operacao', 'global'].map(tipo => (
                    <button 
                      key={tipo}
                      type="button"
                      onClick={() => setNewMeta(p => ({ ...p, tipo_meta: tipo as TipoMeta }))}
                      style={{
                        flex: 1, padding: '0.6rem', border: 'none', borderRadius: '10px',
                        background: newMeta.tipo_meta === tipo ? 'var(--bg-card)' : 'transparent',
                        color: newMeta.tipo_meta === tipo ? 'var(--brand-primary)' : 'var(--gray-500)',
                        boxShadow: newMeta.tipo_meta === tipo ? 'var(--shadow-sm)' : 'none',
                        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {tipo === 'operacao' ? 'Por Operação' : 'Estratégica / Global'}
                    </button>
                  ))}
                </div>
              </div>

              {newMeta.tipo_meta === 'operacao' && (
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Selecione a Unidade</label>
                  <select 
                    className="form-control"
                    value={newMeta.operacao_id}
                    onChange={e => setNewMeta(p => ({ ...p, operacao_id: e.target.value }))}
                    style={{ height: '48px', borderRadius: '12px', border: '1px solid var(--border-color)', fontWeight: 600 }}
                    required
                  >
                    <option value="">Selecione a operação...</option>
                    {operacoes.map(op => <option key={op.id} value={op.id}>{op.nome_operacao}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Faturamento Alvo (R$)</label>
                <input 
                   type="number" 
                   className="form-control"
                   value={newMeta.valor_meta || ''}
                   onChange={e => setNewMeta(p => ({ ...p, valor_meta: Number(e.target.value) }))}
                   placeholder="Ex: 150000.00"
                   style={{ height: '48px', borderRadius: '12px', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '1.1rem' }}
                   required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Anotações Gerenciais (Opcional)</label>
                <textarea 
                  className="form-control"
                  style={{ borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1rem', minHeight: '100px' }}
                  value={newMeta.observacoes}
                  onChange={e => setNewMeta(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Instruções para a equipe de vendas ou motivos da meta..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                   type="button" 
                   className="btn btn-ghost" 
                   style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}
                   onClick={() => setShowModal(false)}
                >
                   Cancelar
                </button>
                <button 
                   type="submit" 
                   className="btn btn-primary"
                   style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 800, boxShadow: '0 8px 20px var(--brand-primary-light)' }}
                >
                   Ativar Meta do Mês
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
