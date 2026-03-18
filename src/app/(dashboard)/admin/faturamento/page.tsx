'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Wallet, MapPin, 
  Activity, Zap, ChevronLeft, Ticket, Tag, RefreshCcw,
  CheckCircle2, AlertCircle, AlertTriangle, Clock, Wifi, WifiOff, DollarSign, PenLine
} from 'lucide-react';

// Função de formatação de moeda
function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Componente Mini Chart
const MiniLineChart = ({ data, color = "#10b981" }: { data: number[], color?: string }) => {
  if (!data || data.length < 2) return <div style={{ height: 40, width: '100%', display: 'flex', alignItems: 'flex-end' }}><div style={{ width: '100%', height: 2, background: 'var(--gray-200)' }} /></div>;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - ((val - min) / range) * 80 - 10}`).join(" ");
  
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: 40, overflow: 'visible' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0,100 L ${points} L 100,100 Z`} fill={`url(#grad-${color})`} />
      <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

// Componente de Status de Sincronização (Saúde do Agente)
const SyncStatusBadge = ({ lastSync, lastMove }: { lastSync: Date | null, lastMove?: Date | null }) => {
  const getStatus = (date: Date | null, moveDate?: Date | null) => {
    if (!date) return { 
      label: 'Sincronizar', 
      color: '#ef4444', 
      bg: 'var(--danger-bg)',
      icon: <WifiOff size={14} />,
      desc: 'Agente nunca reportou'
    };

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Distinguir se o agente rodou mas não teve movimentos
    const hasRecentMove = moveDate && (now.getTime() - moveDate.getTime()) < (6 * 3600000); // 6 horas de tolerância

    if (diffHours < 6) { // Tolerância de 6 horas conforme regra de negócio
      const mins = Math.floor(diffMs / (1000 * 60));
      return {
        label: hasRecentMove ? 'Sincronizado' : 'Ativo',
        color: '#10b981',
        bg: 'var(--success-bg)',
        icon: <CheckCircle2 size={14} />,
        desc: mins < 60 ? `${mins} min atrás` : `${Math.floor(diffHours)}h atrás`
      };
    }

    if (diffHours < 24) {
      return {
        label: 'Atrasado',
        color: '#f59e0b',
        bg: 'var(--warning-bg)',
        icon: <Clock size={14} />,
        desc: `Último reporte há ${Math.floor(diffHours)}h`
      };
    }

    return {
      label: 'Desconectado',
      color: '#ef4444', 
      bg: 'var(--danger-bg)',
      icon: <AlertTriangle size={14} />,
      desc: 'Offline há mais de 24h'
    };
  };

  const status = getStatus(lastSync, lastMove);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.35rem 0.75rem', borderRadius: '20px',
        backgroundColor: status.bg, color: status.color,
        fontSize: '0.75rem', fontWeight: 700,
        border: `1px solid ${status.color}20`
      }}>
        {status.icon}
        {status.label}
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', fontWeight: 500 }}>
        {status.desc}
      </span>
    </div>
  );
};

export default function FaturamentoPage() {
  const [view, setView] = useState<'dashboard' | 'detalhe'>('dashboard');
  const [dashboardPeriod, setDashboardPeriod] = useState<'today' | 'yesterday' | '7d' | '30d' | 'month'>('today');
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [operations, setOperations] = useState<any[]>([]);
  const [allResumos, setAllResumos] = useState<any[]>([]);
  const [allMovimentos, setAllMovimentos] = useState<any[]>([]);
  const [allAjustes, setAllAjustes] = useState<any[]>([]);
  
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // Estados de Ajuste
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteValue, setAjusteValue] = useState("");
  const [ajusteType, setAjusteType] = useState("Receita");
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [ajusteSinal, setAjusteSinal] = useState(1);
  const [isSubmittingAjuste, setIsSubmittingAjuste] = useState(false);

  const fetchDadosBase = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/faturamento?mode=all_data');
      if (res.ok) {
        const { operacoes, resumos, movimentos, ajustes } = await res.json();
        setOperations(operacoes || []);
        setAllResumos(resumos || []);
        setAllMovimentos(movimentos || []);
        setAllAjustes(ajustes || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDadosBase();
    const interv = setInterval(() => fetchDadosBase(true), 60000); 
    return () => clearInterval(interv);
  }, [fetchDadosBase]);

  // --- LÓGICA DE AGREGAÇÃO E FILTRAGEM UNIFICADA ---
  
  // Função central para calcular KPIs de um conjunto de resumos
  const calculateStats = useCallback((resumos: any[]) => {
    return resumos.reduce((acc, c) => {
      // Receita total consolidada (Receita + Avulso + Mensalista)
      const rev = (Number(c.total_receita_ajustada) || 0) + 
                  (Number(c.total_avulso_ajustado) || 0) + 
                  (Number(c.total_mensalista_ajustado) || 0);
      
      const exp = (Number(c.total_despesa_ajustada) || 0);
      
      // Resultado Líquido direto da coluna ajustada (que já contempla todos os tipos + despesa)
      const net = (Number(c.resultado_liquido_ajustado || c.resultado_liquido_ajustada) || 0);
      
      const count = (Number(c.quantidade_movimentos) || 0);
      
      return {
        revenue: acc.revenue + rev,
        expense: acc.expense + exp,
        net: acc.net + net,
        count: acc.count + count
      };
    }, { revenue: 0, expense: 0, net: 0, count: 0 });
  }, []);

  // Função central para filtrar resumos por período (RESPEITA DATA LOCAL)
  const getFilteredSummaries = useCallback((resumos: any[], period: string) => {
    const now = new Date();
    // String da data local: YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0];
    
    // Ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];

    return resumos.filter(r => {
      const dateRef = r.data_referencia; // YYYY-MM-DD
      if (!dateRef) return false;
      
      if (period === 'today') return dateRef === todayStr;
      if (period === 'yesterday') return dateRef === yestStr;
      
      const [year, month, day] = dateRef.split('-').map(Number);
      const rDate = new Date(year, month - 1, day, 12, 0, 0); // Meio-dia local evita shifts de fuso

      if (period === 'month') {
        return year === now.getFullYear() && (month - 1) === now.getMonth();
      }

      const diffMs = now.getTime() - rDate.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      if (period === '7d') return diffDays >= 0 && diffDays < 7;
      if (period === '30d') return diffDays >= 0 && diffDays < 30;
      
      return true;
    });
  }, []);

  /**
   * Função para injetar resumos virtuais (Live Data) caso o resumo consolidado do dia
   * ainda não tenha sido processado pelo banco.
   */
  const getEnrichedFilteredSummaries = useCallback((resumos: any[], period: string, opId?: string) => {
    let filtered = getFilteredSummaries(resumos, period);
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (['today', 'month', '7d', '30d'].includes(period)) {
       const opsToProcess = opId ? operations.filter(o => o.id === opId) : operations;
       
       opsToProcess.forEach(op => {
         const hasToday = resumos.some(r => r.operacao_id === op.id && r.data_referencia === todayStr);
         if (!hasToday) {
           const movsToday = allMovimentos.filter(m => m.operacao_id === op.id && (m.data_saida || m.data_entrada || m.criado_em).startsWith(todayStr));
           if (movsToday.length > 0) {
             const rev = movsToday.filter(m => m.tipo_movimento !== 'Despesa').reduce((a, b) => a + Number(b.valor), 0);
             const exp = movsToday.filter(m => m.tipo_movimento === 'Despesa').reduce((a, b) => a + Number(b.valor), 0);
             filtered.push({
               operacao_id: op.id,
               data_referencia: todayStr,
               total_receita_ajustada: rev,
               total_despesa_ajustada: exp,
               resultado_liquido_ajustado: rev - exp,
               quantidade_movimentos: movsToday.length
             });
           }
         }
       });
    }
    return filtered;
  }, [getFilteredSummaries, operations, allMovimentos]);

  // --- DERIVAÇÕES DE ESTADO ---

  const dashboardStats = (() => {
    const filteredResumos = getEnrichedFilteredSummaries(allResumos, dashboardPeriod);
    const stats = calculateStats(filteredResumos);
    return { ...stats, avgTicket: stats.count > 0 ? stats.revenue / stats.count : 0 };
  })();

  const abrirDetalheOperacao = (op: any) => {
    const resOps = allResumos.filter(r => r.operacao_id === op.id);
    const movOps = allMovimentos.filter(m => m.operacao_id === op.id);
    const ajuOps = allAjustes.filter(a => a.operacao_id === op.id);
    
    // Identificar todas as datas únicas que existem em movimentos ou resumos (últimos 14 dias)
    const allDates = Array.from(new Set([
      ...resOps.map(r => r.data_referencia),
      ...movOps.map(m => (m.data_saida || m.data_entrada || m.criado_em).split('T')[0])
    ])).sort().reverse().slice(0, 14);

    const summaries = allDates.map(date => {
      const summary = resOps.find(r => r.data_referencia === date);
      const dayMovs = movOps.filter(m => (m.data_saida || m.data_entrada || m.criado_em).startsWith(date));
      const dayAjustes = ajuOps.filter(a => a.data_referencia === date);

      if (summary) {
        const dayStats = calculateStats([summary]);
        return {
          date: summary.data_referencia,
          total: dayStats.revenue,
          net_total: dayStats.net,
          count: dayStats.count,
          is_ajustado: (Number(summary.ajuste_liquido_total) !== 0) || dayAjustes.length > 0,
          tickets: dayMovs,
          ajustes: dayAjustes,
          resumo_tipo: summary.resumo_por_tipo_json,
          resumo_forma: summary.resumo_por_forma_pagamento_json
        };
      } else {
        // Gerar resumo virtual a partir dos movimentos (especialmente para 'Hoje')
        const rev = dayMovs.filter(m => m.tipo_movimento !== 'Despesa').reduce((a, b) => a + Number(b.valor), 0);
        const exp = dayMovs.filter(m => m.tipo_movimento === 'Despesa').reduce((a, b) => a + Number(b.valor), 0);
        
        const resumo_tipo: any = {};
        const resumo_forma: any = {};
        
        dayMovs.forEach(m => {
          const t = m.tipo_movimento || 'Outros';
          resumo_tipo[t] = resumo_tipo[t] || { total: 0, count: 0 };
          resumo_tipo[t].total += Number(m.valor);
          resumo_tipo[t].count += 1;
          
          const f = m.forma_pagamento || 'DINHEIRO';
          resumo_forma[f] = resumo_forma[f] || { total: 0, count: 0 };
          resumo_forma[f].total += Number(m.valor);
          resumo_forma[f].count += 1;
        });

        return {
          date,
          total: rev,
          net_total: rev - exp,
          count: dayMovs.length,
          is_ajustado: dayAjustes.length > 0,
          tickets: dayMovs,
          ajustes: dayAjustes,
          resumo_tipo,
          resumo_forma,
          is_virtual: true
        };
      }
    });

    setDailySummaries(summaries);
    setSelectedOp(op);
    if (summaries.length > 0) setActiveDate(summaries[0].date);
    setView('detalhe');
  };

  const handleSalvarAjuste = async () => {
    if (!ajusteValue || !ajusteMotivo) return alert("Preencha o valor e o motivo do ajuste.");
    
    setIsSubmittingAjuste(true);
    try {
      const res = await fetch('/api/faturamento/ajustes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacao_id: selectedOp.id,
          data_referencia: activeDate,
          tipo_ajuste: ajusteType,
          valor: parseFloat(ajusteValue),
          sinal: ajusteSinal,
          motivo: ajusteMotivo
        })
      });

      if (res.ok) {
        setShowAjusteModal(false);
        setAjusteValue("");
        setAjusteMotivo("");
        await fetchDadosBase(true);
        // Atualizar detalhe se necessário
        if (selectedOp) abrirDetalheOperacao(selectedOp);
      } else {
        const err = await res.json();
        alert("Erro ao salvar: " + err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAjuste(false);
    }
  };

  const handleRemoverAjuste = async (ajusteId: string) => {
    if (!confirm("Deseja realmente remover este ajuste financeiro? Isso atualizará os totais do dia instantaneamente.")) return;
    
    try {
      const res = await fetch(`/api/faturamento/ajustes/${ajusteId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDadosBase(true);
        // Atualiza a visualização local para remover o item sem ter que fechar o detalhe
        setDailySummaries(prev => prev.map(s => ({
          ...s,
          ajustes: s.ajustes.filter((a: any) => a.id !== ajusteId)
        })));
      } else {
        const err = await res.json();
        alert("Erro ao remover: " + (err.error || "Tente novamente mais tarde."));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && allMovimentos.length === 0) {
    return <div className="page-container"><div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)' }}>Carregando dados mestre...</div></div>;
  }

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Módulo Faturamento</h1>
          <p className="page-subtitle">Base de Operações e Resultados Líquidos</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, display: 'block' }}>
               {isRefreshing ? 'Sincronizando...' : 'Atualizado'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
               {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button className="action-btn" onClick={() => fetchDadosBase(true)} disabled={isRefreshing}>
             <RefreshCcw className={isRefreshing ? 'rotate-animation' : ''} />
          </button>
        </div>
      </div>

      {view === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Resumo Executivo</h3>
                <p className="card-subtitle">Visão consolidada da operação</p>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-app)', padding: '0.25rem', borderRadius: '12px', overflowX: 'auto' }}>
                {[
                  { id: 'today', label: 'Hoje' }, 
                  { id: 'yesterday', label: 'Ontem' }, 
                  { id: '7d', label: '7D' }, 
                  { id: '30d', label: '30D' },
                  { id: 'month', label: 'Mês' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setDashboardPeriod(p.id as any)}
                    style={{
                      padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                      background: dashboardPeriod === p.id ? 'var(--bg-card)' : 'transparent',
                      color: dashboardPeriod === p.id ? 'var(--text-title)' : 'var(--gray-500)',
                      boxShadow: dashboardPeriod === p.id ? 'var(--shadow-sm)' : 'none'
                    }}
                  >{p.label}</button>
                ))}
              </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                <span className="stat-label">Faturamento Bruto</span>
                <span className="stat-value">{formatarMoeda(dashboardStats.revenue)}</span>
                <span className="badge badge-green" style={{ marginTop: '0.5rem' }}><TrendingUp size={12}/> Volume Período</span>
              </div>
              <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                <span className="stat-label">Resultado Líquido</span>
                <span className="stat-value" style={{ color: dashboardStats.net >= 0 ? 'var(--brand-primary-dark)' : 'var(--danger)' }}>{formatarMoeda(dashboardStats.net)}</span>
                <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>Consolidado</span>
              </div>
              <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                <span className="stat-label">Ticket Médio</span>
                <span className="stat-value">{formatarMoeda(dashboardStats.avgTicket)}</span>
                <span className="badge badge-gray" style={{ marginTop: '0.5rem' }}>Por movimentação</span>
              </div>
              <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                <span className="stat-label">Volume Total</span>
                <span className="stat-value">{dashboardStats.count}</span>
                <span className="badge badge-gray" style={{ marginTop: '0.5rem' }}>Transações registradas</span>
              </div>
            </div>
          </div>

          <div>
             <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Performance por Unidade</h3>
             <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Desempenho financeiro detalhado por carteira</p>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {[...operations].sort((a, b) => {
                  const getWeight = (dateStr: string) => {
                    if (!dateStr) return 3;
                    const diff = new Date().getTime() - new Date(dateStr).getTime();
                    const hours = diff / (1000 * 60 * 60);
                    if (hours < 1) return 0; // Ativo
                    if (hours < 24) return 1; // Atrasado
                    return 2; // Offline
                  };
                  return getWeight(a.ultima_sincronizacao) - getWeight(b.ultima_sincronizacao);
                }).map(op => {
                  const opResumos = allResumos.filter(r => r.operacao_id === op.id);
                  const periodResumos = getEnrichedFilteredSummaries(opResumos, dashboardPeriod, op.id);
                  const opStats = calculateStats(periodResumos);

                  const rev = opStats.revenue;
                  const net = opStats.net;
                  
                  const last7Days = Array.from({length: 7}, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (6 - i));
                    const ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
                    const r = opResumos.find(res => res.data_referencia === ds);
                    return (Number(r?.total_receita_ajustada) || 0) + 
                           (Number(r?.total_avulso_ajustado) || 0) + 
                           (Number(r?.total_mensalista_ajustado) || 0);
                  });

                  // Status do agente (última execução do script)
                  const lastSyncDate = op.ultima_sincronizacao ? new Date(op.ultima_sincronizacao) : null;
                  const lastMoveDate = op.ultimo_movimento_em ? new Date(op.ultimo_movimento_em) : null;

                  return (
                    <div key={op.id} className="card" onClick={() => abrirDetalheOperacao(op)} style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                          <div style={{ background: 'var(--bg-app)', padding: '0.6rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <MapPin size={22} color="var(--brand-primary)" />
                          </div>
                          <SyncStatusBadge lastSync={lastSyncDate} lastMove={lastMoveDate} />
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-title)' }}>{op.nome_operacao}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{op.sql_database || op.cidade}</span>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gray-300)' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {op.codigo_operacao}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: '2rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                           <div>
                             <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Resultado Ajustado</span>
                             <span style={{ fontSize: '1.6rem', fontWeight: 800, color: net >= 0 ? 'var(--text-title)' : 'var(--danger)' }}>{formatarMoeda(net)}</span>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                             <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{periodResumos.reduce((acc, r) => acc + r.quantidade_movimentos, 0)} transações</span>
                           </div>
                         </div>
                         <MiniLineChart data={last7Days} color={net >= 0 ? "var(--brand-primary)" : "#ef4444"} />
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {view === 'detalhe' && selectedOp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '100%', overflowX: 'hidden' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                 <button className="btn btn-secondary btn-sm" onClick={() => setView('dashboard')}>
                    <ChevronLeft size={16} /> Voltar
                 </button>
                 <div>
                    <h2 className="card-title" style={{ fontSize: '1.6rem' }}>{selectedOp.nome_operacao}</h2>
                    <p className="card-subtitle">Visão Fechada Operacional</p>
                 </div>
             </div>

              {(() => {
                const dayData = dailySummaries.find(s => s.date === activeDate);
                const totalRev = Number(dayData?.total || 0);
                const net = Number(dayData?.net_total || 0);
                const totalExp = Number(allResumos.find(r => r.operacao_id === selectedOp.id && r.data_referencia === activeDate)?.total_despesa_ajustada || 0);
                const vol = dayData?.count || 0;

                return (
                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div className="stat-card" style={{ padding: '1rem' }}>
                      <div><span className="stat-label">Receitas Ajustadas</span><br/><span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatarMoeda(totalRev)}</span></div>
                    </div>
                    <div className="stat-card" style={{ padding: '1rem' }}>
                      <div><span className="stat-label">Despesas Ajustadas</span><br/><span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{formatarMoeda(totalExp)}</span></div>
                    </div>
                    <div className="stat-card" style={{ padding: '1rem', background: net >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
                      <div><span className="stat-label" style={{ color: 'var(--gray-700)' }}>Resultado Líquido</span><br/><span className="stat-value" style={{ fontSize: '1.5rem', color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatarMoeda(net)}</span></div>
                    </div>
                    <div className="stat-card" style={{ padding: '1rem' }}>
                      <div><span className="stat-label">Movimentação</span><br/><span className="stat-value" style={{ fontSize: '1.5rem' }}>{vol} transações</span></div>
                    </div>
                  </div>
                );
              })()}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
             {dailySummaries.map((summary) => (
                <button
                   key={summary.date}
                   onClick={() => setActiveDate(summary.date)}
                   style={{
                     padding: '0.75rem 1.5rem', borderRadius: '12px', minWidth: '100px', cursor: 'pointer', border: '1px solid var(--border-color)',
                     background: activeDate === summary.date ? 'var(--text-title)' : 'var(--bg-card)',
                     color: activeDate === summary.date ? 'var(--bg-card)' : 'var(--text-main)',
                     fontWeight: 700, fontSize: '0.8rem', textAlign: 'center'
                   }}
                >
                   <div style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: '0.2rem', opacity: 0.8 }}>{new Date(summary.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                   <div style={{ fontSize: '1.1rem' }}>{new Date(summary.date + 'T12:00:00').getDate()}</div>
                </button>
             ))}
          </div>

          {(() => {
             const dayData = dailySummaries.find((s: any) => s.date === activeDate);
             const tickets: any[] = dayData?.tickets || [];
             const adjustments: any[] = dayData?.ajustes || [];
             
             const byType = dayData?.resumo_tipo || {};
             const byPayment = dayData?.resumo_forma || {};

             const totalRevenue = Object.values(byType).reduce((a: number, b: any) => a + Number(b.total || 0), 0) || 1;
             const isAjustado = dayData?.is_ajustado;
             const op = selectedOp;

             return (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {op.ultima_sincronizacao ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ color: 'var(--success-dark)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <Zap size={16} />
                             Saúde do Agente: Ativo (Reportado em {new Date(op.ultima_sincronizacao).toLocaleString('pt-BR')})
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Nenhum agente reportou saúde recentemente.</div>
                      )}

                      {isAjustado && (
                        <div style={{ background: 'var(--warning-bg)', color: 'var(--warning-dark)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--warning-opacity)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={16} />
                          Existem ajustes financeiros aplicados a este dia.
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                       <button onClick={() => setShowAjusteModal(true)} style={{ background: 'var(--text-title)', color: 'var(--bg-card)', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <PenLine size={16} />
                         Ajuste Financeiro
                       </button>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', width: '100%' }}>
                   <div className="card">
                     <div className="card-header">
                       <h3 className="card-title">Resumo por Pagamento</h3>
                     </div>
                     <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                          {Object.entries(byPayment).sort((a:any, b:any) => Number(b[1].total) - Number(a[1].total)).map(([type, stats]: any) => {
                             const percent = ((stats.total / (dayData?.total || 1)) * 100).toFixed(1);
                             return (
                               <div key={type} style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gray-100)' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                   <Tag size={16} color="var(--gray-400)" />
                                   <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-500)' }}>{percent}%</span>
                                 </div>
                                 <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: '0.2rem' }}>{type}</div>
                                 <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '0.2rem' }}>{formatarMoeda(stats.total)}</div>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{stats.count} Registros</div>
                               </div>
                             )
                          })}
                        </div>
                     </div>
                   </div>

                   <div className="card">
                     <div className="card-header">
                       <h3 className="card-title">Resumo por Categoria</h3>
                     </div>
                     <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                          {Object.entries(byType).sort((a:any, b:any) => Number(b[1].total) - Number(a[1].total)).map(([type, stats]: any) => {
                             const percent = ((stats.total / (dayData?.total || 1)) * 100).toFixed(1);
                             return (
                               <div key={type} style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gray-100)' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                   <Tag size={16} color="var(--gray-400)" />
                                   <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-500)' }}>{percent}%</span>
                                 </div>
                                 <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: '0.2rem' }}>{type}</div>
                                 <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '0.2rem' }}>{formatarMoeda(stats.total)}</div>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{stats.count} Registros</div>
                               </div>
                             )
                          })}
                        </div>
                     </div>
                   </div>
                 </div>

                 {adjustments.length > 0 && (
                    <div className="card" style={{ marginTop: '2rem' }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <h3 className="card-title">Ajustes Financeiros Aplicados</h3>
                         <span className="badge badge-purple">{adjustments.length} correção(ões)</span>
                      </div>
                      <div className="card-body" style={{ padding: 0 }}>
                         <div className="table-container">
                           <table className="table" style={{ border: 'none' }}>
                             <thead>
                               <tr>
                                 <th>Data/Hora</th>
                                 <th>Tipo</th>
                                 <th style={{ textAlign: 'right' }}>Valor</th>
                                 <th>Motivo</th>
                                 <th style={{ textAlign: 'right' }}>Ações</th>
                               </tr>
                             </thead>
                             <tbody>
                               {adjustments.map((aju: any) => (
                                 <tr key={aju.id}>
                                   <td style={{ fontSize: '0.8rem' }}>{new Date(aju.criado_em).toLocaleString('pt-BR')}</td>
                                   <td>
                                      <span className={`badge ${aju.tipo_ajuste === 'Receita' ? 'badge-green' : 'badge-red'}`}>
                                        {aju.tipo_ajuste}: {aju.sinal === 1 ? 'Adicionar' : 'Remover'}
                                      </span>
                                   </td>
                                   <td style={{ fontWeight: 700, color: aju.sinal === 1 ? 'var(--success)' : 'var(--danger)', textAlign: 'right' }}>
                                      {aju.sinal === 1 ? '+' : '-'}{formatarMoeda(aju.valor)}
                                   </td>
                                   <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={aju.motivo}>
                                      {aju.motivo}
                                   </td>
                                   <td style={{ textAlign: 'right' }}>
                                      <button 
                                        onClick={() => handleRemoverAjuste(aju.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}
                                        title="Remover ajuste"
                                      >
                                        <RefreshCcw size={14} /> Desfazer
                                      </button>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                      </div>
                    </div>
                 )}

                 <div className="card table-container" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID Local</th>
                          <th>Entrada / Saída</th>
                          <th>Natureza</th>
                          <th>F. Pagamento</th>
                          <th style={{ textAlign: 'right' }}>Valor Registrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t: any, idx: number) => (
                          <tr key={idx}>
                            <td>
                              <span style={{ fontFamily: 'monospace', background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                {t.ticket_id || t.ticket_label || 'Avulso'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                              <div>{t.data_entrada ? new Date(t.data_entrada).toLocaleString('pt-BR') : '-'}</div>
                              <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginTop: '0.2rem' }}>{t.data_saida ? new Date(t.data_saida).toLocaleString('pt-BR') : '-'}</div>
                            </td>
                            <td><span className="badge badge-gray">{t.tipo_movimento || 'N/A'}</span></td>
                            <td><span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>{t.forma_pagamento || 'Indefinido'}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', color: t.tipo_movimento === 'Despesa' ? 'var(--danger)' : 'var(--gray-800)' }}>
                              {t.tipo_movimento === 'Despesa' ? '-' : ''}{formatarMoeda(Number(t.valor))}
                            </td>
                          </tr>
                        ))}
                        {tickets.length === 0 && (
                           <tr><td colSpan={5} className="table-empty">Sem movimentações na data selecionada.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
             )
           })()}
        </div>
      )}

      {/* Modal de Ajuste Refatorado e Compactado */}
      {showAjusteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div className="card" style={{ 
            width: 'min(100%, 500px)', 
            maxHeight: '90vh',
            borderRadius: '24px', 
            padding: '0', 
            overflow: 'hidden', 
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
            border: '1px solid var(--border-color)' 
          }}>
            
            {/* Cabeçalho Fixo */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-title)' }}>Novo Ajuste Financeiro</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.75rem', lineHeight: '1.2' }}>
                Este ajuste altera apenas os totais resumidos na data selecionada.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                 <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block' }}>Operação</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedOp?.nome_operacao}</span>
                 </div>
                 <div style={{ width: '1px', background: 'var(--border-color)' }} />
                 <div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block' }}>Referente ao dia</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-title)', whiteSpace: 'nowrap' }}>{activeDate ? new Date(activeDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                 </div>
              </div>
            </div>

            {/* Corpo Rolável */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
               
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Categoria do Resumo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                    {['Receita', 'Despesa', 'Avulso', 'Mensalista'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setAjusteType(cat)}
                        style={{
                          padding: '0.6rem', borderRadius: '10px', border: '1px solid',
                          borderColor: ajusteType === cat ? 'var(--brand-primary)' : 'var(--border-color)',
                          background: ajusteType === cat ? 'var(--brand-primary-light)' : 'var(--bg-card)',
                          color: ajusteType === cat ? 'var(--brand-primary-dark)' : 'var(--gray-600)',
                          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >{cat}</button>
                    ))}
                  </div>
               </div>

               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Tipo de Impacto</label>
                  <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
                    <button 
                      onClick={() => setAjusteSinal(1)} 
                      style={{ 
                        flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', 
                        background: ajusteSinal === 1 ? 'var(--success)' : 'transparent', 
                        color: ajusteSinal === 1 ? '#fff' : 'var(--gray-500)', 
                        fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <CheckCircle2 size={14} /> Adicionar (+)
                    </button>
                    <button 
                      onClick={() => setAjusteSinal(-1)} 
                      style={{ 
                        flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', 
                        background: ajusteSinal === -1 ? 'var(--danger)' : 'transparent', 
                        color: ajusteSinal === -1 ? '#fff' : 'var(--gray-500)', 
                        fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <AlertCircle size={14} /> Remover (-)
                    </button>
                  </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Valor do Ajuste</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--gray-400)', fontSize: '0.9rem' }}>R$</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        placeholder="0,00"
                        value={ajusteValue} 
                        onChange={e => setAjusteValue(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.4rem', borderRadius: '12px', border: '2px solid var(--border-color)', outline: 'none', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Motivo do Ajuste</label>
                    <textarea 
                      rows={2}
                      placeholder="Ex: Correção de divergência..."
                      value={ajusteMotivo} 
                      onChange={e => setAjusteMotivo(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid var(--border-color)', outline: 'none', resize: 'none', fontSize: '0.85rem', lineHeight: '1.4' }}
                    />
                    <div style={{ fontSize: '0.65rem', color: ajusteMotivo.length < 10 ? 'var(--danger)' : 'var(--gray-400)', marginTop: '0.3rem', textAlign: 'right', fontWeight: 600 }}>
                      Mínimo 10 caracteres ({ajusteMotivo.length}/10)
                    </div>
                  </div>
               </div>

               <div style={{ 
                 padding: '1rem', borderRadius: '14px', 
                 background: ajusteValue && parseFloat(ajusteValue) > 0 ? (ajusteSinal === 1 ? 'var(--success-bg)' : 'var(--danger-bg)') : 'var(--bg-app)', 
                 border: '1px dashed' + (ajusteValue && parseFloat(ajusteValue) > 0 ? (ajusteSinal === 1 ? 'var(--success-opacity)' : 'var(--danger-opacity)') : 'var(--border-color)'),
                 transition: 'all 0.3s'
               }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Resumo do Impacto</span>
                  {ajusteValue && parseFloat(ajusteValue) > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: ajusteSinal === 1 ? 'var(--success-dark)' : 'var(--danger-dark)' }}>
                        {ajusteType} receberá: {ajusteSinal === 1 ? '+' : '-'} {formatarMoeda(parseFloat(ajusteValue))}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>Preencha os campos para visualizar o impacto.</span>
                  )}
               </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', background: 'var(--bg-app)', borderTop: '1px solid var(--border-color)' }}>
               <button 
                  onClick={() => setShowAjusteModal(false)} 
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--gray-600)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >Cancelar</button>
               <button 
                  onClick={handleSalvarAjuste} 
                  disabled={isSubmittingAjuste || !ajusteValue || parseFloat(ajusteValue) <= 0 || ajusteMotivo.length < 10} 
                  style={{ 
                    flex: 1.5, padding: '0.85rem', borderRadius: '14px', border: 'none', 
                    background: 'var(--text-title)', color: 'var(--bg-card)', 
                    fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                    fontSize: '0.85rem',
                    opacity: (isSubmittingAjuste || !ajusteValue || parseFloat(ajusteValue) <= 0 || ajusteMotivo.length < 10) ? 0.4 : 1,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                 {isSubmittingAjuste ? 'Aplicando...' : 'Aplicar Ajuste'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
