'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Target, MapPin, 
  Activity, Zap, ChevronLeft, Ticket, Tag, RefreshCcw,
  CheckCircle2, AlertCircle, AlertTriangle, Clock, 
  ArrowLeft, Calendar, PenLine, Info, TrendingDown, ChevronRight
} from 'lucide-react';
import { 
  STATUS_APURACAO_LABELS, 
  TIPO_META_LABELS,
  CRITICIDADE_ALERTA_LABELS,
  STATUS_ALERTA_META_LABELS
} from '@/types';

// Função de formatação de moeda local
const formatMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Chart Component: Realized vs Expected Accumulated
const EvolutionLineChart = ({ data }: { data: any[] }) => {
  if (!data || data.length < 2) return <div style={{ height: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>Aguardando dados de apuração para gerar gráfico...</div>;
  
  const maxVal = Math.max(...data.map(d => Math.max(d.valor_acumulado_mes, d.valor_meta_parcial_esperada)), 100);
  const minVal = 0;
  const range = maxVal - minVal;
  
  const pointsReal = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.valor_acumulado_mes - minVal) / range) * 90 - 5}`).join(" ");
  const pointsExpected = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.valor_meta_parcial_esperada - minVal) / range) * 90 - 5}`).join(" ");
  
  return (
    <div style={{ height: 200, position: 'relative', padding: '1rem 0' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
        {/* Grids */}
        {[0, 25, 50, 75, 100].map(p => (
          <line key={p} x1="0" y1={p} x2="100" y2={p} stroke="var(--border-color)" strokeWidth="0.2" opacity="0.5" />
        ))}
        
        {/* Expected Line (Dash) */}
        <polyline 
          fill="none" 
          stroke="var(--gray-400)" 
          strokeWidth="1" 
          strokeDasharray="2"
          points={pointsExpected} 
        />
        
        {/* Realized Line */}
        <polyline 
          fill="none" 
          stroke="var(--brand-primary)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          points={pointsReal} 
        />
        
        {/* End Point Dot */}
        {data.length > 0 && (
          <circle 
            cx="100" 
            cy={100 - ((data[data.length-1].valor_acumulado_mes - minVal) / range) * 90 - 5} 
            r="2" 
            fill="var(--brand-primary)" 
          />
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--gray-400)', fontWeight: 700 }}>
        <span>01/{new Date(data[0].data_referencia).getMonth()+1}</span>
        <span>HOJE</span>
      </div>
    </div>
  );
};

export default function MetaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/metas-faturamento/${id}`);
      if (res.ok) {
        setMeta(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  if (loading) return <div className="page-container"><div style={{ padding: '4rem', textAlign: 'center' }}>Carregando detalhes da meta...</div></div>;
  if (!meta) return <div className="page-container"><div style={{ padding: '4rem', textAlign: 'center' }}>Meta não encontrada.</div></div>;

  const apu = meta.apuracao?.[0] || meta.apuracao || {};
  const diarias = meta.evolucao_diaria || [];
  
  const statusLabels: Record<string, string> = {
    'acima_do_esperado': 'Acima',
    'abaixo_do_esperado': 'Atrasada',
    'em_linha': 'No Ritmo',
    'sem_dados': 'Sem Dados',
    'apuracao_inconclusiva': 'Auditando'
  };

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      
      {/* Header Fixo */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => window.history.back()} className="action-btn" style={{ background: 'var(--bg-card)' }}>
             <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">
              {meta.tipo_meta === 'global' ? 'Meta Global' : meta.operacao?.nome_operacao}
            </h1>
            <p className="page-subtitle">Competência {meta.mes.toString().padStart(2, '0')}/{meta.ano} • Acompanhamento Diário</p>
          </div>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => { setIsRefreshing(true); fetchMeta().finally(() => setIsRefreshing(false)); }} disabled={isRefreshing}>
               <RefreshCcw size={16} className={isRefreshing ? 'rotate-animation' : ''} /> Atualizar Dados
            </button>
            <button className="btn btn-primary">
               <PenLine size={16} /> Editar Meta
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem' }}>
        
        {/* Esquerda: Dashboards Diários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Dashboard Superior - KPIs Executivos */}
          <div className="card" style={{ padding: '2rem', border: 'none', background: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div className="stat-card" style={{ padding: '0', background: 'transparent' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meta Mensal</span>
                 <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{formatMoeda(meta.valor_meta)}</div>
              </div>
              <div className="stat-card" style={{ padding: '0', background: 'transparent' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Realizado Acumulado</span>
                 <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '0.25rem' }}>{formatMoeda(apu.valor_realizado || 0)}</div>
              </div>
              <div className="stat-card" style={{ padding: '0', background: 'transparent' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ritmo Esperado</span>
                 <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    {diarias.length > 0 ? formatMoeda(diarias[diarias.length - 1].valor_meta_parcial_esperada) : formatMoeda(0)}
                 </div>
              </div>
              <div className="stat-card" style={{ padding: '0', background: 'transparent' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atingimento</span>
                 <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (apu.percentual_atingimento || 0) >= 100 ? 'var(--success)' : (apu.percentual_atingimento || 0) >= 80 ? 'var(--warning-dark)' : 'var(--danger)', marginTop: '0.25rem' }}>
                    {(apu.percentual_atingimento || 0).toFixed(1)}%
                 </div>
              </div>
            </div>

            {/* Gráfico de Evolução Integrado */}
            <div style={{ padding: '2rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                     <Activity size={20} color="var(--brand-primary)" />
                     Curva de Execução Acumulada
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', fontWeight: 700 }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '12px', height: '12px', background: 'var(--brand-primary)', borderRadius: '3px' }} /> Realizado
                     </span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-400)' }}>
                        <div style={{ width: '12px', height: '12px', border: '2px dashed var(--gray-300)', borderRadius: '3px' }} /> Ritmo Ideal
                     </span>
                  </div>
               </div>
               <EvolutionLineChart data={diarias} />
            </div>
          </div>

          {/* Tabela Diária de Performance */}
          <div className="card" style={{ border: 'none', background: 'var(--bg-card)' }}>
             <div className="card-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
                      <Calendar size={18} color="var(--brand-primary)" />
                   </div>
                   <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Detalhamento Diário</h3>
                </div>
                <span className="badge badge-primary">{diarias.length} dias apurados</span>
             </div>
             <div className="table-container" style={{ padding: 0 }}>
                <table className="table">
                   <thead style={{ background: 'var(--bg-app)' }}>
                      <tr>
                        <th style={{ paddingLeft: '2rem' }}>Data</th>
                        <th style={{ textAlign: 'right' }}>Realizado Dia</th>
                        <th style={{ textAlign: 'right' }}>Acumulado</th>
                        <th style={{ textAlign: 'right' }}>Desvio Ritmo</th>
                        <th style={{ textAlign: 'center', paddingRight: '2rem' }}>Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {diarias.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                              <RefreshCcw size={32} className="rotate-animation" />
                              Calculando série histórica...
                           </div>
                        </td></tr>
                      ) : (
                        diarias.map((d: any, idx: number) => {
                          const statusKey = d.status_dia as keyof typeof statusLabels;
                          const isAtrasado = d.status_dia === 'abaixo_do_esperado';
                          const isAdiantado = d.status_dia === 'acima_do_esperado';
                          
                          return (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-app-light)' }}>
                              <td style={{ paddingLeft: '2rem', fontWeight: 600 }}>
                                 {new Date(d.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoeda(d.valor_realizado_dia)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)' }}>{formatMoeda(d.valor_acumulado_mes)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: (d.desvio_ritmo >= 0) ? 'var(--success)' : 'var(--danger)' }}>
                                 {d.desvio_ritmo > 0 ? '+' : ''}{formatMoeda(d.desvio_ritmo)}
                              </td>
                              <td style={{ textAlign: 'center', paddingRight: '2rem' }}>
                                 <span style={{ 
                                   fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', padding: '0.4rem 0.8rem', borderRadius: '12px', width: '95px', display: 'inline-block',
                                   background: isAtrasado ? 'var(--danger-bg)' : isAdiantado ? 'var(--success-bg)' : 'var(--warning-bg)',
                                   color: isAtrasado ? 'var(--danger)' : isAdiantado ? 'var(--success)' : 'var(--warning-dark)',
                                   border: `1px solid ${isAtrasado ? 'var(--danger-border)' : isAdiantado ? 'var(--success-border)' : 'var(--warning-border)'}`
                                 }}>
                                    {statusLabels[statusKey] || d.status_dia}
                                 </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                   </tbody>
                </table>
             </div>
          </div>

        </div>

        {/* Direita: Alertas, Auditoria e Infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           
           {/* Alertas Ativos */}
           <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="var(--warning-dark)" />
                    Alertas Críticos
                 </h3>
                 {meta.alertas.length > 0 && <span className="badge badge-danger">{meta.alertas.filter((a:any) => a.status === 'aberto').length}</span>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {meta.alertas.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'var(--bg-app)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                       <CheckCircle2 size={24} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
                       <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Atendimento em linha. Nenhum incidente crítico.</p>
                    </div>
                 ) : (
                    meta.alertas.slice(0, 3).map((alerta: any) => {
                      const critKey = alerta.criticidade as keyof typeof CRITICIDADE_ALERTA_LABELS;
                      const statKey = alerta.status as keyof typeof STATUS_ALERTA_META_LABELS;
                      
                      return (
                        <div key={alerta.id} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: alerta.status === 'aberto' ? 'var(--bg-app)' : 'var(--bg-card)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                              <span style={{ 
                                fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase',
                                background: alerta.criticidade === 'baixa' ? 'var(--gray-100)' : alerta.criticidade === 'media' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                                color: alerta.criticidade === 'baixa' ? 'var(--gray-600)' : alerta.criticidade === 'media' ? 'var(--warning-dark)' : 'var(--danger)',
                                border: '1px solid currentColor'
                              }}>
                                 {CRITICIDADE_ALERTA_LABELS[critKey] || alerta.criticidade}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', fontWeight: 600 }}>{new Date(alerta.gerado_em).toLocaleDateString('pt-BR')}</span>
                           </div>
                           <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>{alerta.tipo_alerta.replace(/_/g, ' ').toUpperCase()}</div>
                           <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', lineHeight: '1.4', marginBottom: '1rem' }}>{alerta.motivo_preliminar}</p>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--brand-primary)', fontWeight: 800 }}>{STATUS_ALERTA_META_LABELS[statKey] || alerta.status}</span>
                              <button 
                                className="action-btn" 
                                style={{ width: '28px', height: '28px', padding: 0 }}
                                onClick={() => window.location.href = `/admin/auditoria/metas/tratativa/${alerta.id}`}
                              >
                                 <ChevronRight size={14} />
                              </button>
                           </div>
                        </div>
                      );
                    })
                 )}
                 <button 
                   className="btn btn-ghost btn-full" 
                   style={{ fontSize: '0.8rem', marginTop: '0.5rem' }} 
                   onClick={() => window.location.href = '/admin/auditoria/metas'}
                 >
                    Central de Auditoria
                 </button>
              </div>
           </div>

           {/* Metadados e Sincronização */}
           <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Info size={18} color="var(--gray-400)" />
                 Detalhes da Apuração
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ padding: '0.86rem', background: 'var(--bg-app)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', fontWeight: 700, marginBottom: '0.2rem' }}>ÚLTIMA SINCRONIZAÇÃO</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                       <Clock size={14} color="var(--brand-primary)" />
                       {apu.ultima_sincronizacao_em ? new Date(apu.ultima_sincronizacao_em).toLocaleString('pt-BR') : 'Sem Sincronismo'}
                    </div>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                       <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Cadastrado por</span>
                       <span style={{ fontWeight: 700 }}>{meta.criado_por?.nome || 'Admin Leve'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                       <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Confiança</span>
                       <span style={{ fontWeight: 700, color: apu.confianca_apuracao === 'baixa' ? 'var(--danger)' : 'var(--success)' }}>
                          {apu.confianca_apuracao?.toUpperCase() || 'ALTA'}
                       </span>
                    </div>
                 </div>
              </div>
              
              <div style={{ marginTop: '1.5rem', background: 'var(--warning-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--warning-border)' }}>
                 <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Zap size={18} color="var(--warning-dark)" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--warning-dark)', fontWeight: 600, lineHeight: '1.5' }}>
                       O ritmo linear é uma projeção. Variações diárias são normais em operações de shopping e supermercados.
                    </p>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
