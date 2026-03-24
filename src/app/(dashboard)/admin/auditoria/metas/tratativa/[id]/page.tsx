'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, AlertTriangle, CheckCircle2, 
  ArrowLeft, Target, Activity, Clock, RefreshCcw,
  Save, ShieldCheck, Ban, UserCheck, MessageSquare, Info,
  TrendingDown, TrendingUp, BarChart3, Calendar, PenLine, Zap, ChevronRight, X
} from 'lucide-react';
import { 
  AlertaMeta, TratativaAlerta, Operacao,
  STATUS_ALERTA_META_LABELS, 
  CRITICIDADE_ALERTA_LABELS,
  STATUS_TRATATIVA_LABELS,
  CATEGORIA_CAUSA_META_LABELS,
  TIPO_META_LABELS
} from '@/types';

// Helper: Formatação de moeda
const formatMoeda = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// Chart Component (SVG)
const EvolutionLineChart = ({ data }: { data: any[] }) => {
  if (!data || data.length < 2) return <div style={{ height: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>Dados insuficientes para gerar curva de evolução...</div>;
  const maxVal = Math.max(...data.map(d => Math.max(d.valor_acumulado_mes || 0, d.valor_meta_parcial_esperada || 0)), 100);
  const minVal = 0;
  const range = maxVal - minVal;
  const pointsReal = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (((d.valor_acumulado_mes || 0) - minVal) / range) * 90 - 5}`).join(" ");
  const pointsExpected = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (((d.valor_meta_parcial_esperada || 0) - minVal) / range) * 90 - 5}`).join(" ");
  return (
    <div style={{ height: 200, position: 'relative', padding: '1rem 0' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map(p => <line key={p} x1="0" y1={p} x2="100" y2={p} stroke="var(--border-color)" strokeWidth="0.2" opacity="0.5" />)}
        <polyline fill="none" stroke="var(--gray-400)" strokeWidth="1" strokeDasharray="2" points={pointsExpected} />
        <polyline fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsReal} />
        {data.length > 0 && <circle cx="100" cy={100 - (((data[data.length-1].valor_acumulado_mes || 0) - minVal) / range) * 90 - 5} r="2" fill="var(--brand-primary)" />}
      </svg>
    </div>
  );
};

const REGRA_ALERTA_LABELS: Record<string, string> = {
  'DIA_ZERADO': 'Faturamento Não Identificado',
  'SEQUENCIA_ABAIXO_META': 'Sequência abaixo da Meta',
  'QUEDA_BRUSCA_HISTORICA': 'Queda Brusca de Receita',
  'DESVIO_META_DIARIA': 'Desvio de Meta Diária',
  'ATINGIMENTO_CRITICO': 'Atingimento Crítico',
  'ESTAGNACAO_FATURAMENTO': 'Estagnação de Faturamento',
  'FATURAMENTO_ZERO': 'Faturamento Zerado'
};

export default function TratativaAlertaComplexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [alerta, setAlerta] = useState<any>(null);
  const [metaFull, setMetaFull] = useState<any>(null);
  const [tratativa, setTratativa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Sistema de Notificação
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    status: 'pendente',
    categoria_causa: '',
    descricao_analise: '',
    causa_raiz: '',
    acao_corretiva: '',
    parecer_final: ''
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const resAlert = await fetch(`/api/metas-faturamento/alertas/${id}`);
      if (!resAlert.ok) throw new Error('Alerta não encontrado');
      const dataAlert = await resAlert.json();
      setAlerta(dataAlert);

      if (dataAlert.meta_id) {
        const resMeta = await fetch(`/api/metas-faturamento/${dataAlert.meta_id}`);
        if (resMeta.ok) setMetaFull(await resMeta.json());
      }
      
      if (dataAlert.tratativa?.[0]) {
        const t = dataAlert.tratativa[0];
        setTratativa(t);
        setFormData({
          status: t.status || 'pendente',
          categoria_causa: t.categoria_causa || '',
          descricao_analise: t.descricao_analise || '',
          causa_raiz: t.causa_raiz || '',
          acao_corretiva: t.acao_corretiva || '',
          parecer_final: t.parecer_final || ''
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveTratativa = async (statusOverride?: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/metas-faturamento/alertas/${id}/tratativa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: statusOverride || formData.status })
      });
      if (res.ok) {
        fetchData();
        showNotification('success', 'Tratativa auditada e salva com sucesso!');
      } else {
        throw new Error('Falha na comunicação com servidor');
      }
    } catch (err) {
      showNotification('error', 'Erro ao salvar alterações na auditoria.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-container"><div style={{ padding: '4rem', textAlign: 'center' }}>Carregando auditoria...</div></div>;
  if (!alerta) return <div className="page-container"><div style={{ padding: '4rem', textAlign: 'center' }}>Alerta não encontrado.</div></div>;

  const isConcluido = formData.status === 'concluida' || formData.status === 'sem_procedencia';
  const meta = alerta.meta || {};
  const apu = alerta.apuracao || {};
  const diarias = metaFull?.evolucao_diaria || [];

  return (
    <div className="page-container" style={{ paddingBottom: '4rem', position: 'relative' }}>
      
      {/* NOTIFICAÇÃO INLINE (ESTILO LAZY LOAD) */}
      {notification && (
        <div className={`notification-inline ${notification.type === 'success' ? 'success' : 'error'}`} style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          zIndex: 9999,
          padding: '1rem 1.5rem',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderLeft: `6px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ color: notification.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-secondary)' }}>
              {notification.type === 'success' ? 'Sucesso' : 'Atenção'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{notification.message}</div>
          </div>
          <button onClick={() => setNotification(null)} style={{ marginLeft: '1rem', background: 'transparent', border: 'none', color: 'var(--gray-300)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header Mirror */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => window.history.back()} className="action-btn" style={{ background: 'var(--bg-card)' }}><ArrowLeft size={20} /></button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <h1 className="page-title">Auditando: {alerta.operacao?.nome_operacao || 'Global'}</h1>
               <span className={`badge ${formData.status === 'pendente' ? 'badge-danger' : formData.status === 'em_analise' ? 'badge-info' : 'badge-success'}`}>
                  {STATUS_TRATATIVA_LABELS[formData.status as keyof typeof STATUS_TRATATIVA_LABELS] || formData.status}
               </span>
            </div>
            <p className="page-subtitle">Competência {meta.mes}/{meta.ano} • Meta: {formatMoeda(meta.valor_meta)}</p>
          </div>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '1rem' }}>
            {formData.status === 'pendente' && (
               <button className="btn btn-primary" onClick={() => handleSaveTratativa('em_analise')} disabled={saving}>
                  {saving ? <RefreshCcw size={16} className="rotate-animation" /> : <UserCheck size={16} />} 
                  Assumir Alerta
               </button>
            )}
            {!isConcluido && (
               <>
                 <button className="btn btn-secondary" onClick={() => handleSaveTratativa('concluida')} disabled={saving} style={{ background: 'var(--success)', border: 'none' }}>
                    {saving ? <RefreshCcw size={16} className="rotate-animation" /> : <ShieldCheck size={16} />} Concluir Auditoria
                 </button>
                 <button className="btn btn-ghost" onClick={() => handleSaveTratativa('sem_procedencia')} disabled={saving}>
                    {saving ? <RefreshCcw size={16} className="rotate-animation" /> : <Ban size={16} />} Descartar
                 </button>
               </>
            )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: 'none' }}>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
               <div className="stat-card" style={{ padding: '0', background: 'transparent' }}><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Realizado</span><div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatMoeda(apu.valor_realizado || 0)}</div></div>
               <div className="stat-card" style={{ padding: '0', background: 'transparent' }}><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Atingimento</span><div style={{ fontSize: '1.2rem', fontWeight: 800, color: (apu.percentual_atingimento || 0) >= 100 ? 'var(--success)' : 'var(--danger)' }}>{(apu.percentual_atingimento || 0).toFixed(1)}%</div></div>
               <div className="stat-card" style={{ padding: '0', background: 'transparent' }}><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Desvio Valor</span><div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>{formatMoeda(apu.desvio_valor || 0)}</div></div>
               <div className="stat-card" style={{ padding: '0', background: 'transparent' }}><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Severidade</span><div style={{ fontSize: '1.2rem', fontWeight: 800, color: alerta.severidade === 'critica' ? 'var(--danger)' : 'var(--warning-dark)' }}>{alerta.severidade?.toUpperCase() || 'ALERTA'}</div></div>
            </div>
            <div style={{ padding: '1.5rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><h3 className="card-title" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} color="var(--brand-primary)" />Execução Acumulada</h3></div>
               <EvolutionLineChart data={diarias} />
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><AlertCircle size={20} color="var(--danger)" /><h3 className="card-title" style={{ fontSize: '1rem' }}>Incidente: {REGRA_ALERTA_LABELS[alerta.tipo_alerta] || alerta.tipo_alerta.replace(/_/g, ' ')}</h3></div>
             <p style={{ fontSize: '0.95rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontStyle: 'italic' }}>"{alerta.motivo_preliminar}"</p>
          </div>

          <div className="card shadow-sm" style={{ padding: '2rem' }}>
             <h3 className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><PenLine size={20} className="text-primary" /> Análise de Auditoria</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Categoria da Causa</label><select className="form-control" value={formData.categoria_causa} onChange={e => setFormData(p => ({ ...p, categoria_causa: e.target.value }))} disabled={isConcluido}><option value="">Selecione...</option>{Object.entries(CATEGORIA_CAUSA_META_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Análise Técnica</label><textarea className="form-control" rows={3} value={formData.descricao_analise} onChange={e => setFormData(p => ({ ...p, descricao_analise: e.target.value }))} disabled={isConcluido}/></div>
                <div className="form-group"><label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Causa Raiz</label><textarea className="form-control" rows={3} value={formData.causa_raiz} onChange={e => setFormData(p => ({ ...p, causa_raiz: e.target.value }))} disabled={isConcluido}/></div>
                <div className="grid grid-2 gap-4">
                   <div className="form-group"><label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Plano de Ação</label><textarea className="form-control" rows={4} value={formData.acao_corretiva} onChange={e => setFormData(p => ({ ...p, acao_corretiva: e.target.value }))} disabled={isConcluido}/></div>
                   <div className="form-group"><label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Parecer Final</label><textarea className="form-control" rows={4} value={formData.parecer_final} onChange={e => setFormData(p => ({ ...p, parecer_final: e.target.value }))} disabled={isConcluido}/></div>
                </div>
                {!isConcluido && (
                   <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <button className="btn btn-primary btn-lg" onClick={() => handleSaveTratativa()} disabled={saving}>
                         {saving ? <RefreshCcw size={18} className="rotate-animation" /> : <Save size={18} />} Salvar Parecer
                      </button>
                   </div>
                )}
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18} color="var(--brand-primary)" />Detalhamento Diário</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                 {diarias.map((d: any, idx: number) => (
                    <div key={idx} style={{ padding: '0.85rem', borderRadius: '12px', background: d.data_referencia === alerta.data_referencia ? 'var(--danger-bg)' : 'var(--bg-app)', border: `1px solid ${d.data_referencia === alerta.data_referencia ? 'var(--danger)' : 'var(--border-color)'}` }}>
                       <div className="flex flex-between align-center mb-1"><span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{new Date(d.data_referencia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span><span style={{ fontSize: '0.75rem', fontWeight: 700, color: d.desvio_ritmo >= 0 ? 'var(--success)' : 'var(--danger)' }}>{d.desvio_ritmo >= 0 ? '+' : ''}{formatMoeda(d.desvio_ritmo)}</span></div>
                       <div className="flex flex-between"><span style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>Realizado:</span><span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{formatMoeda(d.valor_realizado_dia)}</span></div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              <h3 className="card-title" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Metadados</h3>
              <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '12px', marginBottom: '1rem' }}><div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', fontWeight: 700 }}>AUDITOR</div><div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{tratativa?.auditor?.nome || 'Pendente'}</div></div>
              <button className="btn btn-ghost btn-full" style={{ fontSize: '0.75rem' }} onClick={() => window.location.href = `/admin/faturamento/metas/${alerta.meta_id}`}>Ver Dashboard Meta</button>
           </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .rotate-animation { animation: rotate 2s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
