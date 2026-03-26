'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, PlusCircle,
  MinusCircle,
  TrendingUp, TrendingDown, Wallet, MapPin, 
  Activity, Zap, ChevronLeft, Ticket, Tag, RefreshCcw,
  CheckCircle2, AlertCircle, AlertTriangle, Clock, Wifi, WifiOff, DollarSign, PenLine, 
  ArrowRight, ListFilter, CreditCard, Smartphone, Calendar, User, ZapOff, Fingerprint, Banknote, Plus, Trash2, ArrowDown
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { VirtualTicketsTable } from '@/components/faturamento/VirtualTicketsTable';

const ESTRUTURA_FATURAMENTO = [
  {
    grupo: "ROTATIVO",
    itens: [
      "Rotativo Dinheiro",
      "Rotativo Cartão Débito",
      "Rotativo Cartão Crédito",
      "Rotativo Pix",
      "ATM Pix",
      "ATM Débito",
      "ATM Crédito",
      "ConectCar"
    ]
  },
  {
    grupo: "MENSALISTA",
    itens: [
      "Mensalista Dinheiro",
      "Mensalista Cartão Débito",
      "Mensalista Cartão Crédito",
      "Mensalista Pix",
      "ATM Mensalista Débito",
      "ATM Mensalista Crédito",
      "Mensalista Boleto"
    ]
  },
  {
    grupo: "SAÍDAS E DESPESAS",
    itens: [
      "Despesa",
      "Sangria",
      "Liberação"
    ]
  },
  {
    grupo: "OUTROS",
    itens: [
      "Eventuais"
    ]
  }
];

// Global function for classifying movements
function classificarMovimento(tipo?: string, forma?: string, descricao?: string): string {
  const t = (tipo || '').toUpperCase();
  const f = (forma || '').toUpperCase();
  const d = (descricao || '').toUpperCase();

  // MENSALISTA
  if (t.includes('MENSALISTA') || d.includes('MENSALISTA')) {
     if (t.includes('ATM') || d.includes('ATM')) {
        if (f.includes('DEBITO')) return "ATM Mensalista Débito";
        if (f.includes('CREDITO')) return "ATM Mensalista Crédito";
     }
     if (f.includes('BOLETO')) return "Mensalista Boleto";
     if (f.includes('DEBITO')) return "Mensalista Cartão Débito";
     if (f.includes('CREDITO')) return "Mensalista Cartão Crédito";
     if (f.includes('PIX')) return "Mensalista Pix";
     if (f.includes('DINHEIRO')) return "Mensalista Dinheiro";
     return "Mensalista Dinheiro"; // Default for Mensalista
  }

  // ATM (Não mensalista)
  if (t.includes('ATM') || d.includes('ATM')) {
     if (f.includes('PIX')) return "ATM Pix";
     if (f.includes('DEBITO')) return "ATM Débito";
     if (f.includes('CREDITO')) return "ATM Crédito";
     return "ATM Crédito"; // Default for ATM
  }

  // CONECTCAR
  if (t.includes('CONECTCAR') || t.includes('SEM PARAR') || t.includes('VELOE') || t.includes('TAG') || d.includes('CONECT')) return "ConectCar";
  
  // OUTROS
  // OUTROS / DESPESAS
  if (t.includes('DESPESA') || t.includes('SAIDA') || t.includes('SAÍDA') || d.includes('DESPESA') || d.includes('SAIDA') || d.includes('SAÍDA')) return "Despesa";
  if (t.includes('SANGRIA') || d.includes('SANGRIA')) return "Sangria";
  if (t.includes('LIBERACAO') || d.includes('LIBERACAO')) return "Liberação";
  if (t.includes('EVENTUAL') || t.includes('CANCELAMENTO') || d.includes('EVENTUAL') || d.includes('SOBRA') || d.includes('QUEBRA')) return "Eventuais";

  // ROTATIVO / AVULSO
  if (t.includes('ROTATIVO') || t.includes('AVULSO')) {
     if (f.includes('PIX')) return "Rotativo Pix";
     if (f.includes('DEBITO')) return "Rotativo Cartão Débito";
     if (f.includes('CREDITO')) return "Rotativo Cartão Crédito";
     if (f.includes('DINHEIRO')) return "Rotativo Dinheiro";
     return "Rotativo Dinheiro"; // Default for Rotativo
  }

  // Fallback para Receitas Diversas
  if (t.includes('RECEITA')) return "Eventuais";

  // Final fallback
  if (f.includes('PIX')) return "Rotativo Pix";
  if (f.includes('DEBITO')) return "Rotativo Cartão Débito";
  if (f.includes('CREDITO')) return "Rotativo Cartão Crédito";
  if (f.includes('DINHEIRO')) return "Rotativo Dinheiro";

  return "Eventuais";
}

// Função de formatação de moeda
function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function getCategoriaStyles(catName: string) {
  const name = catName.toUpperCase();
  
  if (name.includes('ATM')) return { icon: <Fingerprint size={16} />, color: '#3b82f6', bg: '#eff6ff' };
  if (name.includes('CONECTCAR')) return { icon: <Zap size={16} />, color: '#f59e0b', bg: '#fffbeb' };
  if (name.includes('LIBERACAO')) return { icon: <ZapOff size={16} />, color: '#64748b', bg: '#f1f5f9' };
  if (name.includes('MENSALISTA')) return { icon: <User size={16} />, color: '#10b981', bg: '#ecfdf5' };
  if (name.includes('ROTATIVO')) return { icon: <Clock size={16} />, color: '#f43f5e', bg: '#fff1f2' };
  if (name.includes('DESPESA') || name.includes('SAIDA') || name.includes('SANGRIA')) return { icon: <TrendingDown size={16} />, color: '#ef4444', bg: '#fef2f2' };
  
  if (name.includes('CREDITO') || name.includes('DEBITO') || name.includes('CARTAO')) return { icon: <CreditCard size={16} />, color: '#8b5cf6', bg: '#f5f3ff' };
  if (name.includes('PIX')) return { icon: <Smartphone size={16} />, color: '#06b6d4', bg: '#ecfeff' };
  if (name.includes('DINHEIRO')) return { icon: <Banknote size={16} />, color: '#4ade80', bg: '#f0fdf4' };
  if (name.includes('BOLETO')) return { icon: <Ticket size={16} />, color: '#6366f1', bg: '#eef2ff' };
  
  return { icon: <Tag size={16} />, color: '#94a3b8', bg: '#f8fafc' };
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

  // SWR for automatic caching and revalidation
  const { data, error, mutate, isValidating: swrLoading } = useSWR('/api/faturamento?mode=all_data', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Revalidate every minute
  });

  const operations = data?.operacoes || [];
  const allResumos = data?.resumos || [];
  const allMovimentos = data?.movimentos || [];
  const allAjustes = data?.ajustes || [];
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  useEffect(() => { if (data) setLastUpdated(new Date()); }, [data]);

  const loading = !data && !error;
  const isRefreshing = swrLoading;

  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [movimentosDetalhados, setMovimentosDetalhados] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Estados de Ajuste
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteValue, setAjusteValue] = useState("");
  const [ajusteType, setAjusteType] = useState("Receita");
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [ajusteSinal, setAjusteSinal] = useState(1);
  const [isSubmittingAjuste, setIsSubmittingAjuste] = useState(false);

  const fetchDadosBase = (isSilent = false) => {
    mutate(); // Trigger SWR revalidation
  };

  // Removido manual useEffect do interval pois o SWR já tem refreshInterval

  // --- LÓGICA DE AGREGAÇÃO E FILTRAGEM UNIFICADA ---
  
  // Função central para calcular KPIs de um conjunto de resumos
  const calculateStats = useCallback((resumos: any[]) => {
    return resumos.reduce((acc: { revenue: number; expense: number; net: number; count: number; adjustments: number; }, c: any) => {
      // Receita total consolidada (Receita + Avulso + Mensalista)
      const rev = (Number(c.total_receita_ajustada) || 0) + 
                  (Number(c.total_avulso_ajustado) || 0) + 
                  (Number(c.total_mensalista_ajustado) || 0);
      
      const exp = (Number(c.total_despesa_ajustada) || 0);
      
      // Resultado Líquido direto da coluna ajustada (que já contempla todos os tipos + despesa)
      const net = (Number(c.resultado_liquido_ajustado || c.resultado_liquido_ajustada) || 0);
      
      const count = (Number(c.quantidade_movimentos) || 0);

      const adj = (Number(c.ajuste_receita_total) || 0) + 
                  (Number(c.ajuste_avulso_total) || 0) + 
                  (Number(c.ajuste_mensalista_total) || 0) - 
                  (Number(c.ajuste_despesa_total) || 0);
      
      return {
        revenue: acc.revenue + rev,
        expense: acc.expense + exp,
        net: acc.net + net,
        count: acc.count + count,
        adjustments: acc.adjustments + adj
      };
    }, { revenue: 0, expense: 0, net: 0, count: 0, adjustments: 0 });
  }, []);

  // Função central para filtrar resumos por período (RESPEITA DATA LOCAL)
  const getFilteredSummaries = useCallback((resumos: any[], period: string) => {
    const now = new Date();
    // Normalizar 'now' para o início do dia local para cálculos de períodos relativos
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Helper para gerar YYYY-MM-DD local (garante paridade absoluta com data_referencia do banco)
    const getDS = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    const todayStr = getDS(now);
    
    const yesterday = new Date(nowMidnight);
    yesterday.setDate(nowMidnight.getDate() - 1);
    const yestStr = getDS(yesterday);

    return resumos.filter((r: any) => {
      const dateRef = r.data_referencia; // YYYY-MM-DD
      if (!dateRef) return false;
      
      // Filtros diretos por string (100% seguros)
      if (period === 'today') return dateRef === todayStr;
      if (period === 'yesterday') return dateRef === yestStr;
      
      // Filtros calculados por intervalo
      const [year, month, day] = dateRef.split('-').map(Number);
      // Criamos rDate também no início do dia local
      const rDateMidnight = new Date(year, month - 1, day);

      if (period === 'month') {
        return year === now.getFullYear() && (month - 1) === now.getMonth();
      }

      // Diferença em dias (inteiro) entre hoje e o registro
      // 0 = Hoje, 1 = Ontem, etc.
      const diffMs = nowMidnight.getTime() - rDateMidnight.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      // Agora inclusivo (hoje está dentro do período de 7 e 30 dias)
      if (period === '7d') return diffDays >= 0 && diffDays < 7;
      if (period === '30d') return diffDays >= 0 && diffDays < 30;
      
      return true;
    });
  }, []);

  /**
   * Função para processar e unificar resumos (Base Local + Base Consolidada do Banco)
   * Garante que Resumo Inicial e Visão Detalhada usem EXATAMENTE a mesma memória de cálculo.
   */
  const getEnrichedFilteredSummaries = useCallback((resumos: any[], period: string, opId?: string) => {
    // 1. Filtrar operações que vamos processar
    const opsToProcess = opId ? operations.filter((o: any) => o.id === opId) : operations;
    
    // 2. Criar um mapa de resumos consolidados por [operacao_id][data]
    const resMap: Record<string, Record<string, any>> = {};
    resumos.forEach(r => {
      if (!resMap[r.operacao_id]) resMap[r.operacao_id] = {};
      resMap[r.operacao_id][r.data_referencia] = r;
    });

    // 3. Gerar lista unificada
    const allUnified: any[] = [];
    opsToProcess.forEach(op => {
      const opResEntries = resMap[op.id] || {};
      Object.keys(opResEntries).forEach(date => {
         allUnified.push(opResEntries[date]);
      });
    });

    // 4. Aplicar filtro de período unificado
    return getFilteredSummaries(allUnified, period);
  }, [operations, getFilteredSummaries]);

  // --- DERIVAÇÕES DE ESTADO ---

  const dashboardStats = useMemo(() => {
    const filteredResumos = getEnrichedFilteredSummaries(allResumos, dashboardPeriod);
    const stats = calculateStats(filteredResumos);
    return { ...stats, avgTicket: stats.count > 0 ? stats.revenue / stats.count : 0 };
  }, [allResumos, dashboardPeriod, getEnrichedFilteredSummaries, calculateStats]);

  // Memoize performance per operation to avoid heavy filtering in render loop
  const allOperationStats = useMemo(() => {
    return operations.map(op => {
      const opResumos = allResumos.filter((r: any) => r.operacao_id === op.id);
      const periodResumos = getEnrichedFilteredSummaries(opResumos, dashboardPeriod, op.id);
      const opStats = calculateStats(periodResumos);
      
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        const r = opResumos.find((res: any) => res.data_referencia === ds);
        return (Number(r?.total_receita_ajustada) || 0) + 
               (Number(r?.total_avulso_ajustado) || 0) + 
               (Number(r?.total_mensalista_ajustado) || 0);
      });

      return {
        opId: op.id,
        net: opStats.net,
        revenue: opStats.revenue,
        count: periodResumos.reduce((acc: number, r: any) => acc + r.quantidade_movimentos, 0),
        last7Days
      };
    });
  }, [operations, allResumos, dashboardPeriod, getEnrichedFilteredSummaries, calculateStats]);

  const abrirDetalheOperacao = (op: any) => {
    // Para o detalhe, recalcular os resumos da operação usando o novo pipeline unificado
    const dailySummaries = getEnrichedFilteredSummaries(allResumos, '30d', op.id);
    const sortedDates = [...new Set(dailySummaries.map(s => s.data_referencia))].sort().reverse();

    setDailySummaries(dailySummaries.map(s => ({
      date: s.data_referencia,
      total: s.total_receita_ajustada,
      expense: s.total_despesa_ajustada,
      net_total: s.resultado_liquido_ajustado,
      count: s.quantidade_movimentos,
      resumo_tipo: s.resumo_tipo, // CAMINHO DA VERDADE
      is_virtual: s.is_live
    })));

    setSelectedOp(op);
    if (sortedDates.length > 0) setActiveDate(sortedDates[0]);
    setView('detalhe');
  };

  // Memoized tickets for the activeDate, using the UNIFIED date logic
  // Escala para grandes volumes: Primeiro tenta usar dados detalhados (carregados sob demanda)
  // Se não houver detalhados (ex: mudou de dia agora), usa o "Lite Summary" da memória global como fallback
  const tickets = useMemo(() => {
    if (!activeDate || !selectedOp) return [];
    
    // Se temos dados detalhados para ESTA unidade e ESTA data, usamos eles (SÃO COMPLETOS)
    const matchesDetalhes = movimentosDetalhados.filter((m: any) => {
       const saStr = m.data_saida || '';
       const enStr = m.data_entrada || '';
       const crStr = m.criado_em || '';
       
       let effectiveISO = saStr;
       if (!effectiveISO) effectiveISO = enStr;
       if (!effectiveISO) effectiveISO = crStr;
       
       const effectiveDate = effectiveISO.substring(0, 10);
       return effectiveDate === activeDate;
    });

    if (matchesDetalhes.length > 0) return matchesDetalhes;

    // Senão, fallback para o Lite Summary (Contém apenas colunas de cálculo, sem placa/id completo)
    return allMovimentos.filter((m: any) => {
      if (m.operacao_id !== selectedOp.id) return false;
      const saStr = m.data_saida || '';
      const enStr = m.data_entrada || '';
      const crStr = m.criado_em || '';
      
      let effectiveISO = saStr;
      if (!effectiveISO) effectiveISO = enStr;
      if (!effectiveISO) effectiveISO = crStr;
      
      const effectiveDate = effectiveISO.substring(0, 10);
      return effectiveDate === activeDate;
    });
  }, [allMovimentos, movimentosDetalhados, activeDate, selectedOp]);

  // Efeito para carregar detalhes sob demanda ao selecionar op ou data
  useEffect(() => {
    if (view === 'detalhe' && selectedOp && activeDate) {
      const fetchDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const res = await fetch(`/api/faturamento?mode=details&operacao_id=${selectedOp.id}&date=${activeDate}`);
          if (res.ok) {
            const data = await res.json();
            setMovimentosDetalhados(data || []);
          }
        } catch (err) {
          console.error("Erro ao carregar detalhes:", err);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchDetails();
    } else {
       setMovimentosDetalhados([]); // Limpa ao voltar para o dashboard
    }
  }, [view, selectedOp, activeDate]);

  // Recalcular Stats Manuais a partir da tabela oficial de resumos para paridade total
  const manualStats = useMemo(() => {
    if (!activeDate || !selectedOp) return { revenue: 0, expense: 0, net: 0, count: 0, adjustments: [] };
    
    // Buscar a linha oficial no banco para esse dia/op
    const official = allResumos.find((r: any) => 
      r.operacao_id === selectedOp.id && r.data_referencia === activeDate
    );

    // Buscar ajustes do dia
    const dayAdjustments = allAjustes.filter((a: any) => a.operacao_id === selectedOp.id && a.data_referencia === activeDate);

    if (official) {
      return {
        revenue: (Number(official.total_receita_ajustada || 0)) + 
                 (Number(official.total_avulso_ajustado || 0)) + 
                 (Number(official.total_mensalista_ajustado || 0)),
        expense: (Number(official.total_despesa_ajustada || 0)),
        net: (Number(official.resultado_liquido_ajustado || 0)),
        count: (Number(official.quantidade_movimentos) || 0),
        adjustments: dayAdjustments
      };
    }

    // FALLBACK SENIOR: Se não houver resumo consolidado, calcula via movimentos brutos (REAL-TIME)
    if (tickets.length > 0) {
      let revenue = 0;
      let expense = 0;
      
      tickets.forEach((t: any) => {
        const cat = classificarMovimento(t.tipo_movimento, t.forma_pagamento, t.descricao);
        const valor = Number(t.valor || 0);
        
        const isExpense = cat === "Liberação" || cat === "Despesa" || cat === "Saída" || cat === "Saida";
        if (isExpense) {
          expense += valor;
        } else {
          revenue += valor;
        }
      });

      // Somar ajustes manuais ao fallback
      const adjSum = dayAdjustments.reduce((acc, a) => acc + (a.tipo_ajuste === 'Despesa' ? -Number(a.valor) : Number(a.valor)), 0);

      return {
        revenue,
        expense,
        net: revenue - expense + adjSum,
        count: tickets.length,
        adjustments: dayAdjustments
      };
    }

    return { revenue: 0, expense: 0, net: 0, count: 0, adjustments: [] };
  }, [allResumos, allAjustes, activeDate, selectedOp, tickets]);

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
        setDailySummaries(prev => prev.map((s: any) => ({
          ...s,
          ajustes: (s.ajustes || []).filter((a: any) => a.id !== ajusteId)
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
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Módulo Faturamento</h1>
          <p className="page-subtitle">Base de Operações e Resultados Líquidos</p>
        </div>
        <div className="page-actions">
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, display: 'block' }}>
               {isRefreshing ? 'Sincronizando...' : 'Atualizado'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
               {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={() => fetchDadosBase(true)} disabled={isRefreshing} style={{ width: '42px', height: '42px', padding: 0 }}>
             <RefreshCcw size={18} className={isRefreshing ? 'rotate-animation' : ''} />
          </button>
        </div>
      </header>

      {view === 'dashboard' && (
        <div className="flex flex-col gap-6">
          
          <section className="card" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <header className="flex flex-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ margin: 0, letterSpacing: '-0.02em' }}>Resumo Executivo</h3>
                <p className="text-muted text-xs font-bold text-uppercase tracking-widest mt-1">Visão financeira consolidada</p>
              </div>
              <div className="flex gap-1" style={{ background: 'var(--gray-50)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
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
                    className={`btn btn-sm ${dashboardPeriod === p.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '10px', padding: '0.5rem 0.85rem' }}
                  >{p.label}</button>
                ))}
              </div>
            </header>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              alignItems: 'stretch'
            }}>
              <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--gray-100)' }}>
                <div className="flex flex-between items-center mb-2">
                   <span className="text-xs font-bold text-muted uppercase tracking-wider">Faturamento Bruto</span>
                   <div style={{ color: 'var(--brand-primary)', background: 'var(--brand-primary-light)', padding: '6px', borderRadius: '8px' }}>
                     <DollarSign size={16} />
                   </div>
                </div>
                <div className="text-2xl font-black text-gray-900 leading-tight">
                  {formatarMoeda(dashboardStats.revenue)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                   <TrendingUp size={14} className="text-success" />
                   <span className="text-xs font-bold text-success uppercase">Volume Realizado</span>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(16, 185, 129, 0.04)', 
                padding: '1.25rem', 
                borderRadius: '14px', 
                border: '2px solid #10b981',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.15), inset 0 0 10px rgba(16, 185, 129, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
                <div className="flex flex-between items-center mb-2">
                   <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#047857' }}>Resultado Líquido</span>
                   <div style={{ color: '#fff', background: '#10b981', padding: '6px', borderRadius: '8px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                     <Zap size={16} fill="currentColor" />
                   </div>
                </div>
                <div className="text-3xl font-black leading-tight" style={{ color: dashboardStats.net >= 0 ? '#065f46' : 'var(--danger)', textShadow: '0 2px 4px rgba(16, 185, 129, 0.1)' }}>
                  {formatarMoeda(dashboardStats.net)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                   <div className="animate-pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                   <span className="text-xs font-bold uppercase" style={{ color: '#059669' }}>Consolidado Real-Time</span>
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--gray-100)' }}>
                <div className="flex flex-between items-center mb-2">
                   <span className="text-xs font-bold text-muted uppercase tracking-wider">Ajustes Manuais</span>
                   <div style={{ color: 'var(--warning)', background: 'var(--warning-bg)', padding: '6px', borderRadius: '8px' }}>
                     <PenLine size={16} />
                   </div>
                </div>
                <div className="text-2xl font-black text-gray-900 leading-tight">
                  {formatarMoeda(dashboardStats.adjustments || 0)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                   <AlertCircle size={14} className="text-warning" />
                   <span className="text-xs font-bold text-warning uppercase">Saldo de Correções</span>
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--gray-100)' }}>
                <div className="flex flex-between items-center mb-2">
                   <span className="text-xs font-bold text-muted uppercase tracking-wider">Ticket Médio</span>
                   <div style={{ color: 'var(--brand-accent)', background: 'var(--info-bg)', padding: '6px', borderRadius: '8px' }}>
                     <Activity size={16} />
                   </div>
                </div>
                <div className="text-2xl font-black text-gray-900 leading-tight">
                  {formatarMoeda(dashboardStats.avgTicket)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                   <BarChart3 size={14} className="text-info" />
                   <span className="text-xs font-bold text-info uppercase">Indicador Unitário</span>
                </div>
              </div>
            </div>
          </section>

          <div>
             <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Performance por Unidade</h3>
             <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Desempenho financeiro detalhado por carteira</p>
             
             <div className="grid-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {[...operations].sort((a: any, b: any) => {
                  const getWeight = (dateStr: string) => {
                    if (!dateStr) return 3;
                    const diff = new Date().getTime() - new Date(dateStr).getTime();
                    const hours = diff / (1000 * 60 * 60);
                    if (hours < 1) return 0; // Ativo (menos de 1h)
                    if (hours < 24) return 1; // Instável (menos de 24h)
                    return 2; // Offline (mais de 24h)
                  };
                  
                  const weightA = getWeight(a.ultima_sincronizacao);
                  const weightB = getWeight(b.ultima_sincronizacao);
                  
                  if (weightA !== weightB) {
                    return weightA - weightB;
                  }
                  
                  // Se o peso de sincronização for igual, ordena por nome (A-Z)
                  return a.nome_operacao.localeCompare(b.nome_operacao);
                }).map((op: any) => {
                  const stats = allOperationStats.find(s => s.opId === op.id) || { net: 0, revenue: 0, count: 0, last7Days: [] };
                  const { net, revenue, count, last7Days } = stats;

                  // Status do agente (última execução do script)
                  const lastSyncDate = op.ultima_sincronizacao ? new Date(op.ultima_sincronizacao) : null;
                  const lastMoveDate = op.ultimo_movimento_em ? new Date(op.ultimo_movimento_em) : null;

                  return (
                    <div key={op.id} className="card stat-card" onClick={() => abrirDetalheOperacao(op)} style={{ cursor: 'pointer', minHeight: '260px' }}>
                      <header className="flex flex-between mb-4">
                        <div style={{ background: 'var(--brand-primary-light)', padding: '0.625rem', borderRadius: '12px', color: 'var(--brand-primary)' }}>
                          <MapPin size={22} />
                        </div>
                        <SyncStatusBadge lastSync={lastSyncDate} lastMove={lastMoveDate} />
                      </header>

                      <div className="flex flex-col gap-1 mb-6">
                        <h4 className="text-lg font-bold" style={{ margin: 0 }}>{op.nome_operacao}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted font-bold text-uppercase tracking-wider">{op.sql_database || op.cidade}</span>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gray-300)' }} />
                          <span className="text-xs text-muted font-bold">ID: {op.codigo_operacao}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                         <div className="flex flex-between items-end mb-4">
                           <div>
                             <span className="stat-label">Resultado Ajustado</span>
                             <span className="stat-value" style={{ color: net >= 0 ? 'var(--gray-900)' : 'var(--danger)' }}>{formatarMoeda(net)}</span>
                           </div>
                           <div className="text-right">
                             <span className="badge badge-gray">{count} Movs</span>
                           </div>
                         </div>
                         <MiniLineChart data={last7Days} color={net >= 0 ? "var(--brand-primary)" : "var(--danger)"} />
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {view === 'detalhe' && selectedOp && (
        <div className="flex flex-col gap-6">
          
          <section className="card" style={{ padding: '1.5rem 1.75rem', marginBottom: '0.5rem' }}>
             <header className="flex flex-between items-center mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                 <div className="flex items-center gap-4">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setView('dashboard')}
                      style={{ width: '40px', height: '40px', padding: 0, borderRadius: '12px' }}
                    >
                       <ChevronLeft size={20} />
                    </button>
                    <div>
                       <h2 className="text-xl font-bold" style={{ margin: 0, letterSpacing: '-0.02em' }}>{selectedOp.nome_operacao}</h2>
                       <p className="text-muted text-xs font-bold text-uppercase tracking-widest mt-1">Detalhamento Operacional</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="badge badge-gray" style={{ padding: '0.5rem 0.75rem' }}>ID: {selectedOp.codigo_operacao}</span>
                 </div>
             </header>

               {(() => {
                 const totalRev = manualStats.revenue;
                 const totalExp = manualStats.expense;
                 const net = manualStats.net;
                 const vol = tickets.length;

                 return (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1rem',
                      alignItems: 'stretch'
                    }}>
                      {/* RECEITA */}
                      <div style={{ 
                        background: 'rgba(59, 130, 246, 0.04)', 
                        padding: '1.25rem', 
                        borderRadius: '16px', 
                        border: '2px solid #3b82f6',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '100px'
                      }}>
                         <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }} />
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#1d4ed8' }}>Receita Total</span>
                         <span className="text-3xl font-black block text-gray-900">{formatarMoeda(totalRev)}</span>
                         <div className="mt-2 flex items-center gap-1">
                            <DollarSign size={10} className="text-blue-500" />
                            <span className="text-[9px] font-bold text-blue-600 uppercase">Volume Bruto</span>
                         </div>
                      </div>

                      {/* DESPESA */}
                      <div style={{ 
                        background: 'rgba(239, 68, 68, 0.04)', 
                        padding: '1.25rem', 
                        borderRadius: '16px', 
                        border: '2px solid #ef4444',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '100px'
                      }}>
                         <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }} />
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#b91c1c' }}>Despesa Total</span>
                         <span className="text-3xl font-black block text-danger">{formatarMoeda(totalExp)}</span>
                         <div className="mt-2 flex items-center gap-1">
                            <TrendingDown size={10} className="text-danger" />
                            <span className="text-[9px] font-bold text-danger uppercase">Saídas e Sangrias</span>
                         </div>
                      </div>

                      {/* LÍQUIDO */}
                      <div style={{ 
                        background: 'rgba(16, 185, 129, 0.04)', 
                        padding: '1.25rem', 
                        borderRadius: '16px', 
                        border: '2px solid #10b981',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '110px'
                      }}>
                         <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#047857' }}>Resultado Líquido</span>
                         <span className="text-3xl font-black block" style={{ color: '#065f46' }}>{formatarMoeda(net)}</span>
                         <div className="mt-2 flex items-center gap-1">
                            <Zap size={10} className="text-success fill-success" />
                            <span className="text-[9px] font-bold text-success uppercase">Consolidação Real</span>
                         </div>
                      </div>

                      {/* VOLUME */}
                      <div style={{ 
                        background: 'rgba(99, 102, 241, 0.04)', 
                        padding: '1.25rem', 
                        borderRadius: '16px', 
                        border: '2px solid #6366f1',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '100px'
                      }}>
                         <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#6366f1' }} />
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#4338ca' }}>Volume Total</span>
                         <span className="text-3xl font-black block text-gray-900">{vol} <span className="text-sm font-bold opacity-30">Movs</span></span>
                         <div className="mt-2 flex items-center gap-1">
                            <Activity size={10} className="text-indigo-500" />
                            <span className="text-[9px] font-bold text-indigo-600 uppercase">Tickets Processados</span>
                         </div>
                      </div>
                    </div>
                 );
               })()}
          </section>

          <div className="flex gap-3 mb-6 scroll-smooth" style={{ 
            overflowX: 'auto', 
            padding: '0.25rem 0.25rem 1rem 0.25rem', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
             {dailySummaries.map((summary: any) => {
                const dateObj = new Date(summary.date + 'T12:00:00');
                const isSelected = activeDate === summary.date;
                return (
                  <button
                     key={summary.date}
                     onClick={() => setActiveDate(summary.date)}
                     className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                     style={{ 
                        height: '64px',
                        padding: '0.5rem 1.25rem', 
                        borderRadius: '18px', 
                        flexShrink: 0, 
                        minWidth: '110px',
                        borderWidth: isSelected ? '2px' : '1px',
                        borderColor: isSelected ? 'var(--brand-primary)' : 'var(--gray-200)',
                        boxShadow: isSelected ? '0 8px 16px rgba(0,0,128,0.15)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                     }}
                  >
                     <span className="text-[10px] uppercase font-black tracking-widest mb-1" style={{ opacity: isSelected ? 0.9 : 0.4 }}>
                       {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                     </span>
                     <span className="text-xl font-black">{dateObj.getDate()}</span>
                  </button>
                );
             })}
          </div>

          {(() => {
             const dayData = dailySummaries.find((s: any) => s.date === activeDate);
             const adjustmentsByDay: any[] = dayData?.ajustes || [];
             
    const byType = dayData?.resumo_tipo || {};
    const totalRevenue = Number(dayData?.total || 1);
    const isAjustado = dayData?.is_ajustado;
    const op = selectedOp;

             return (
               <div className="flex flex-col gap-6">
                  <header className="flex flex-between items-center mb-5">
                     <div className="flex gap-4 items-center">
                       {op.ultima_sincronizacao ? (
                          <div className="flex items-center gap-2 text-success font-black text-[10px] uppercase tracking-wider">
                             <Zap size={14} />
                             Sincronizado: {new Date(op.ultima_sincronizacao).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       ) : (
                         <div className="text-muted text-[10px] font-black uppercase tracking-wider">Agente em Pausa</div>
                       )}

                       {isAjustado && (
                         <span className="badge badge-warning">
                            <AlertCircle size={14} style={{ marginRight: '4px' }} /> Ajustes aplicados
                         </span>
                       )}
                     </div>

                     <button onClick={() => setShowAjusteModal(true)} className="btn btn-primary btn-sm" style={{ borderRadius: '10px', padding: '0.5rem 1rem' }}>
                        <Plus size={16} /> Lançar Ajuste
                     </button>
                  </header>

                  <div className="grid-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
                     {ESTRUTURA_FATURAMENTO.map((grupoObj) => {
                       const itensDoGrupo = grupoObj.itens;
                       
                       const subtotalMovimentos = itensDoGrupo.reduce((acc: number, catName: string) => {
                         return acc + tickets.filter((t: any) => classificarMovimento(t.tipo_movimento, t.forma_pagamento, t.descricao) === catName)
                           .reduce((sum: number, m: any) => sum + Number(m.valor || 0), 0);
                       }, 0);

                       const subtotalAjustes = adjustmentsByDay.filter((a: any) => {
                         if (grupoObj.grupo === 'ROTATIVO') return a.tipo_ajuste === 'Avulso';
                         if (grupoObj.grupo === 'MENSALISTA') return a.tipo_ajuste === 'Mensalista';
                         if (grupoObj.grupo === 'OUTROS') return a.tipo_ajuste === 'Receita' || a.tipo_ajuste === 'Despesa';
                         return false;
                       }).reduce((acc: number, a: any) => acc + (a.tipo_ajuste === 'Despesa' ? -Number(a.valor) : Number(a.valor)), 0);

                       const subtotalGrupo = subtotalMovimentos + subtotalAjustes;

                       return (
                         <div key={grupoObj.grupo} className="card" style={{ padding: 0 }}>
                            <header className="flex flex-between" style={{ padding: '1rem 1.25rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
                               <h3 className="text-xs font-bold text-uppercase tracking-wider text-muted m-0">
                                 {grupoObj.grupo}
                               </h3>
                               <span className="font-bold text-gray-900">{formatarMoeda(subtotalGrupo)}</span>
                            </header>
                            <div className="flex flex-col">
                               {itensDoGrupo.map((catName) => {
                                 // LÓGICA DE PRIORIDADE: Se existe resumo oficial para essa categoria, use ele.
                                 // Senão, fallback para contagem em tempo real (para movimentos recém-sincronizados antes da cron).
                                 const officialData = byType[catName];
                                 
                                 const movs = tickets.filter((t: any) => classificarMovimento(t.tipo_movimento, t.forma_pagamento, t.descricao) === catName);
                                 const total = officialData ? Number(officialData.total || 0) : movs.reduce((sum: number, m: any) => sum + Number(m.valor || 0), 0);
                                 const count = officialData ? Number(officialData.quantidade || 0) : movs.length;
                                 
                                 const percent = ((total / (totalRevenue || 1)) * 100).toFixed(1);
                                 const isSelected = filterCategory === catName;
                                 const styles = getCategoriaStyles(catName);

                                 return (
                                   <div 
                                     key={catName} 
                                     onClick={() => setFilterCategory(isSelected ? null : catName)}
                                     style={{ 
                                       padding: '0.75rem 1.25rem',
                                       borderBottom: '1px solid var(--gray-50)',
                                       cursor: 'pointer',
                                       backgroundColor: isSelected ? 'var(--gray-50)' : 'transparent',
                                       opacity: count === 0 ? 0.4 : 1,
                                       borderLeft: isSelected ? '4px solid var(--brand-primary)' : '4px solid transparent',
                                       display: 'flex',
                                       justifyContent: 'space-between',
                                       alignItems: 'center',
                                       transition: 'var(--transition)'
                                     }}
                                   >
                                     <div className="flex items-center gap-3">
                                       <div style={{ 
                                         background: styles.bg, 
                                         color: styles.color,
                                         width: '32px', height: '32px',
                                         borderRadius: '8px',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                                       }}>
                                         {styles.icon}
                                       </div>
                                       <div>
                                         <div className="font-bold text-xs text-gray-900">{catName}</div>
                                         <div className="text-xs text-muted" style={{ fontSize: '0.65rem' }}>{count} movs • {percent}%</div>
                                       </div>
                                     </div>
                                     <span className="font-bold text-sm text-gray-900">{formatarMoeda(total)}</span>
                                   </div>
                                 );
                               })}
                               
                               {/* Ajustes no Grupo */}
                               {adjustmentsByDay.filter((a: any) => {
                                 if (grupoObj.grupo === 'ROTATIVO') return a.tipo_ajuste === 'Avulso';
                                 if (grupoObj.grupo === 'MENSALISTA') return a.tipo_ajuste === 'Mensalista';
                                 if (grupoObj.grupo === 'OUTROS') return a.tipo_ajuste === 'Receita' || a.tipo_ajuste === 'Despesa';
                                 return false;
                               }).map(ajuste => (
                                 <div key={ajuste.id} style={{ padding: '0.75rem 1.25rem', background: 'var(--brand-primary-light)', borderLeft: '4px solid var(--brand-primary)', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                      <div className="text-xs font-bold text-primary">Ajuste: {ajuste.categoria_ajuste || 'Manual'}</div>
                                      <div className="text-xs text-muted" style={{ fontSize: '0.65rem' }}>{ajuste.motivo}</div>
                                    </div>
                                    <span className="font-bold text-xs" style={{ color: ajuste.sinal === 1 ? 'var(--success-dark)' : 'var(--danger)' }}>
                                      {ajuste.sinal === 1 ? '+' : '-'}{formatarMoeda(ajuste.valor)}
                                    </span>
                                 </div>
                               ))}
                            </div>
                         </div>
                       );
                     })}
                  </div>

                  <div className="card" style={{ padding: 0 }}>
                    <header className="flex flex-between mb-0" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                       <div>
                         <h3 className="card-title" style={{ fontSize: '1rem' }}>Relatório de Movimentações</h3>
                         <p className="text-muted text-xs">Exibindo lançamentos reais registrados no agente</p>
                       </div>
                       {isLoadingDetails && (
                         <div className="flex items-center gap-2 text-primary font-bold text-xs">
                            <RefreshCcw size={14} className="rotate-animation" /> Sincronizando...
                         </div>
                       )}
                    </header>
                    <div className="table-container" style={{ padding: '0.5rem' }}>
                       <VirtualTicketsTable 
                         tickets={tickets.filter((t: any) => !filterCategory || classificarMovimento(t.tipo_movimento, t.forma_pagamento, t.descricao) === filterCategory)}
                         height={600}
                         formatarMoeda={formatarMoeda}
                       />
                    </div>
                  </div>
               </div>
             );
          })()}
        </div>
      )}

      {/* Modal de Ajuste Refatorado */}
      {showAjusteModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: 'min(90%, 500px)', padding: 0, overflow: 'hidden' }}>
            
            <header style={{ padding: '1.25rem 1.5rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
              <h3 className="text-lg font-bold m-0 text-gray-900">Novo Ajuste Financeiro</h3>
              <p className="text-xs text-muted m-0 mt-1">Este ajuste altera os totais consolidados na data selecionada.</p>
            </header>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               <div className="flex gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex-1">
                     <span className="text-xs font-bold text-muted text-uppercase display-block">Operação</span>
                     <span className="text-sm font-bold text-primary display-block truncate">{selectedOp?.nome_operacao}</span>
                  </div>
                  <div style={{ width: '1px', background: 'var(--gray-200)' }} />
                  <div>
                     <span className="text-xs font-bold text-muted text-uppercase display-block">Referente ao dia</span>
                     <span className="text-sm font-bold text-gray-900 display-block">
                        {activeDate ? new Date(activeDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                     </span>
                  </div>
               </div>
               
               <div className="form-group">
                  <label className="form-label">Categoria do Resumo</label>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {['Receita', 'Despesa', 'Avulso', 'Mensalista'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setAjusteType(cat)}
                        className={`btn btn-sm ${ajusteType === cat ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, minWidth: '100px', borderRadius: '10px' }}
                      >{cat}</button>
                    ))}
                  </div>
               </div>

               <div className="form-group">
                  <label className="form-label">Tipo de Impacto</label>
                  <div className="flex gap-2 p-1 rounded-xl bg-gray-100">
                    <button 
                      onClick={() => setAjusteSinal(1)} 
                      className={`btn btn-sm flex-1 ${ajusteSinal === 1 ? 'btn-success' : 'btn-ghost'}`}
                      style={{ borderRadius: '10px', color: ajusteSinal === 1 ? '#fff' : 'var(--gray-500)' }}
                    >
                      <PlusCircle size={16} /> Adicionar (+)
                    </button>
                    <button 
                      onClick={() => setAjusteSinal(-1)} 
                      className={`btn btn-sm flex-1 ${ajusteSinal === -1 ? 'btn-danger' : 'btn-ghost'}`}
                      style={{ borderRadius: '10px', color: ajusteSinal === -1 ? '#fff' : 'var(--gray-500)' }}
                    >
                      <MinusCircle size={16} /> Remover (-)
                    </button>
                  </div>
               </div>

               <div className="form-group">
                  <label className="form-label">Valor do Ajuste</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--gray-400)' }}>R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control"
                      style={{ paddingLeft: '2.5rem', fontSize: '1.25rem', fontWeight: 800 }}
                      placeholder="0,00"
                      value={ajusteValue} 
                      onChange={e => setAjusteValue(e.target.value)}
                    />
                  </div>
               </div>

               <div className="form-group">
                  <label className="form-label">Motivo do Ajuste</label>
                  <textarea 
                    rows={3}
                    className="form-control"
                    placeholder="Ex: Correção de divergência no fechamento manual..."
                    value={ajusteMotivo} 
                    onChange={e => setAjusteMotivo(e.target.value)}
                  />
                  <div className="flex flex-between mt-1">
                     <span className="text-xs text-muted">Explique a necessidade deste ajuste</span>
                     <span className={`text-xs font-bold ${ajusteMotivo.length < 10 ? 'text-danger' : 'text-success'}`}>
                        {ajusteMotivo.length}/10
                     </span>
                  </div>
               </div>
            </div>

            <footer className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
               <button onClick={() => setShowAjusteModal(false)} className="btn btn-secondary flex-1">
                  Cancelar
               </button>
               <button 
                  onClick={handleSalvarAjuste} 
                  disabled={isSubmittingAjuste || !ajusteValue || parseFloat(ajusteValue) <= 0 || ajusteMotivo.length < 10} 
                  className="btn btn-primary flex-2"
               >
                  {isSubmittingAjuste ? 'Aplicando...' : 'Confirmar Ajuste'}
               </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
