'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit, ArrowLeft, Play, RefreshCw, Download,
  AlertTriangle, CheckCircle2, TrendingDown, TrendingUp,
  ShieldAlert, FileText, Sparkles, Clock, Target,
  ChevronDown, Info, X, Loader2, Building2
} from 'lucide-react';

interface Operacao {
  id: string;
  nome_operacao: string;
  bandeira?: string;
}

interface AnaliseResultado {
  resumo_executivo: string;
  score_risco: number;
  nivel_risco: 'baixo' | 'medio' | 'alto' | 'critico';
  total_movimentos: number;
  valor_total: number;
  anomalias: {
    tipo: string;
    descricao: string;
    impacto: string;
    severidade: 'info' | 'alerta' | 'critico';
  }[];
  metricas: {
    label: string;
    valor: string;
    tendencia: 'up' | 'down' | 'neutral';
    cor: string;
  }[];
  recomendacoes: string[];
  parecer_final: string;
  gerado_em: string;
}

const formatMoeda = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ScoreGauge = ({ score }: { score: number }) => {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 75 ? '#EF4444' : score >= 50 ? '#F97316' : score >= 25 ? '#F59E0B' : '#10B981';
  const label = score >= 75 ? 'CRÍTICO' : score >= 50 ? 'ALTO' : score >= 25 ? 'MÉDIO' : 'BAIXO';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Background arc */}
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="var(--gray-100)" strokeWidth="14" strokeLinecap="round" />
        {/* Colored arc segments */}
        <path d="M 10 80 A 70 70 0 0 1 45 24" fill="none" stroke="#10B981" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <path d="M 45 24 A 70 70 0 0 1 80 10" fill="none" stroke="#F59E0B" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <path d="M 80 10 A 70 70 0 0 1 115 24" fill="none" stroke="#F97316" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <path d="M 115 24 A 70 70 0 0 1 150 80" fill="none" stroke="#EF4444" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        {/* Needle */}
        <line
          x1="80" y1="80"
          x2={80 + 55 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={80 + 55 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="80" cy="80" r="6" fill={color} />
        <text x="80" y="72" textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>{score}</text>
      </svg>
      <div style={{
        fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px',
        padding: '0.25rem 0.875rem', borderRadius: 'var(--radius-full)',
        background: `${color}15`, color,
      }}>
        RISCO {label}
      </div>
    </div>
  );
};

export default function AuditorSeniorPage() {
  const router = useRouter();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);

  const [form, setForm] = useState({
    operacao_id: '',
    data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    data_fim: new Date().toISOString().split('T')[0],
    tipo_analise: 'completa',
  });

  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<AnaliseResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/operacoes?status=ativa')
      .then(r => r.json())
      .then(data => setOperacoes(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingOps(false));
  }, []);

  const handleAnalisar = async () => {
    if (!form.operacao_id) {
      setErro('Selecione uma operação para analisar.');
      return;
    }
    setErro(null);
    setAnalisando(true);
    setResultado(null);

    try {
      const res = await fetch('/api/auditoria/auditor-senior/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${res.status} ao processar análise.`);
      }

      const data = await res.json();
      setResultado(data);
    } catch (err: any) {
      setErro(err.message || 'Falha ao conectar com o serviço de análise.');
    } finally {
      setAnalisando(false);
    }
  };

  const handleExport = () => {
    if (!resultado) return;
    const op = operacoes.find(o => o.id === form.operacao_id);
    const lines = [
      `LAUDO DE AUDITORIA SÊNIOR — LEVE ERP`,
      `Operação: ${op?.nome_operacao || ''}`,
      `Período: ${form.data_inicio} a ${form.data_fim}`,
      `Gerado em: ${resultado.gerado_em}`,
      ``,
      `SCORE DE RISCO: ${resultado.score_risco}/100 (${resultado.nivel_risco.toUpperCase()})`,
      ``,
      `RESUMO EXECUTIVO`,
      resultado.resumo_executivo,
      ``,
      `ANOMALIAS DETECTADAS`,
      ...resultado.anomalias.map(a => `[${a.severidade.toUpperCase()}] ${a.tipo}: ${a.descricao}`),
      ``,
      `RECOMENDAÇÕES`,
      ...resultado.recomendacoes.map((r, i) => `${i + 1}. ${r}`),
      ``,
      `PARECER FINAL`,
      resultado.parecer_final,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo_auditoria_${op?.nome_operacao?.replace(/\s+/g, '_') || 'op'}_${form.data_inicio}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nivelColor: Record<string, string> = {
    baixo: '#10B981',
    medio: '#F59E0B',
    alto: '#F97316',
    critico: '#EF4444',
  };

  const severidadeStyle: Record<string, { bg: string; color: string }> = {
    info: { bg: '#EFF6FF', color: '#000080' },
    alerta: { bg: '#FEF3C7', color: '#92400E' },
    critico: { bg: '#FEE2E2', color: '#991B1B' },
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/admin/auditoria')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--gray-600)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
              <Sparkles size={13} color="#6366F1" />
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '2px' }}>IA Premium</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.5px', margin: 0 }}>Auditor Sênior IA</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 500, margin: 0 }}>Análise profunda assistida por inteligência artificial</p>
          </div>
        </div>

        {resultado && (
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', color: 'var(--gray-700)' }}
          >
            <Download size={16} /> Exportar Laudo
          </button>
        )}
      </div>

      {/* Config Panel */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: '#EEF2FF', color: '#6366F1', display: 'flex' }}>
            <BrainCircuit size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>Configurar Análise</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Selecione o escopo para gerar o laudo de auditoria</div>
          </div>
        </div>

        <div style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1.25rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Building2 size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
              Operação
            </label>
            <select
              className="form-control"
              value={form.operacao_id}
              onChange={e => setForm(f => ({ ...f, operacao_id: e.target.value }))}
              disabled={loadingOps || analisando}
              style={{ fontWeight: 600 }}
            >
              <option value="">
                {loadingOps ? 'Carregando...' : '— Selecione —'}
              </option>
              {operacoes.map(op => (
                <option key={op.id} value={op.id}>{op.nome_operacao}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
              Data Início
            </label>
            <input
              type="date"
              className="form-control"
              value={form.data_inicio}
              onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
              disabled={analisando}
              style={{ fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '0.35rem' }} />
              Data Fim
            </label>
            <input
              type="date"
              className="form-control"
              value={form.data_fim}
              onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))}
              disabled={analisando}
              style={{ fontWeight: 600 }}
            />
          </div>

          <button
            onClick={handleAnalisar}
            disabled={analisando || !form.operacao_id}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.75rem 2rem', borderRadius: 'var(--radius)',
              background: analisando || !form.operacao_id ? 'var(--gray-200)' : 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
              color: analisando || !form.operacao_id ? 'var(--gray-400)' : 'white',
              border: 'none', cursor: analisando || !form.operacao_id ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontSize: '0.875rem', whiteSpace: 'nowrap',
              boxShadow: analisando || !form.operacao_id ? 'none' : '0 8px 20px -4px rgba(99,102,241,0.4)',
              transition: 'var(--transition)',
            }}
          >
            {analisando ? (
              <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Analisando...</>
            ) : (
              <><Sparkles size={17} /> Gerar Análise</>
            )}
          </button>
        </div>

        {erro && (
          <div style={{ margin: '0 1.75rem 1.25rem', padding: '0.875rem 1.25rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={16} color="var(--danger)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--danger-dark)', fontWeight: 600 }}>{erro}</span>
            <button onClick={() => setErro(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {analisando && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '3rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'linear-gradient(135deg, #4338CA10 0%, #6366F120 100%)', marginBottom: '1.5rem' }}>
            <BrainCircuit size={40} color="#6366F1" style={{ animation: 'pulse 2s infinite' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Processando Análise Inteligente</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            A IA está examinando os movimentos de faturamento, detectando padrões e gerando o laudo de auditoria...
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {['Coletando dados', 'Detectando anomalias', 'Gerando parecer'].map((step, i) => (
              <span key={i} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', background: '#EEF2FF', color: '#6366F1', animation: `fadeInOut 1.5s ${i * 0.5}s infinite` }}>
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {resultado && !analisando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Score + Metricas */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>

            {/* Score Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: `2px solid ${nivelColor[resultado.nivel_risco]}30`, boxShadow: `0 8px 24px -4px ${nivelColor[resultado.nivel_risco]}20`, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score de Risco</div>
              <ScoreGauge score={resultado.score_risco} />
              <div style={{ textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', width: '100%' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {resultado.total_movimentos} movimentos · {formatMoeda(resultado.valor_total)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>
                  {new Date(resultado.gerado_em).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Metricas Grid */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding: '1.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem' }}>Métricas do Período</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {resultado.metricas.map((m, i) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--gray-50)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{m.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: m.cor }}>{m.valor}</span>
                      {m.tendencia === 'up' && <TrendingUp size={14} color="#10B981" />}
                      {m.tendencia === 'down' && <TrendingDown size={14} color="#EF4444" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: '#EEF2FF', color: '#6366F1', display: 'flex' }}>
                <FileText size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gray-900)', margin: 0 }}>Resumo Executivo</h3>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#EEF2FF', color: '#6366F1', letterSpacing: '1px', textTransform: 'uppercase' }}>IA</span>
            </div>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--gray-700)', margin: 0, padding: '1.25rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', borderLeft: '4px solid #6366F1' }}>
              {resultado.resumo_executivo}
            </p>
          </div>

          {/* Anomalias */}
          {resultado.anomalias.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex' }}>
                  <ShieldAlert size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gray-900)', margin: 0 }}>Anomalias Detectadas</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  {resultado.anomalias.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {resultado.anomalias.map((a, i) => {
                  const s = severidadeStyle[a.severidade] || severidadeStyle.info;
                  return (
                    <div key={i} style={{ padding: '1.25rem', borderRadius: 'var(--radius)', background: s.bg, border: `1px solid ${s.color}20`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', background: `${s.color}15`, color: s.color, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {a.severidade}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--gray-900)', marginBottom: '0.2rem' }}>{a.tipo}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>{a.descricao}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {a.impacto}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recomendacoes + Parecer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success-dark)', display: 'flex' }}>
                  <CheckCircle2 size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gray-900)', margin: 0 }}>Recomendações</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {resultado.recomendacoes.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', fontSize: '0.65rem', fontWeight: 900, marginTop: '0.1rem' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex' }}>
                  <Target size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gray-900)', margin: 0 }}>Parecer Final</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: '#EEF2FF', color: '#6366F1', letterSpacing: '1px', textTransform: 'uppercase' }}>Auditor IA</span>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--gray-700)', margin: 0, fontStyle: 'italic' }}>
                "{resultado.parecer_final}"
              </p>
              <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                Análise gerada automaticamente por IA com base nos dados de faturamento. Revisão humana recomendada.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Empty State */}
      {!resultado && !analisando && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', padding: '4rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', background: '#EEF2FF', marginBottom: '1.5rem' }}>
            <BrainCircuit size={48} color="#6366F1" style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Pronto para Auditar</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            Selecione uma operação e o período desejado, depois clique em <strong>Gerar Análise</strong> para obter o laudo completo.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes fadeInOut { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
