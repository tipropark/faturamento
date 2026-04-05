'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { 
  ArrowLeft, ShieldAlert, Target, DollarSign, 
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  Save, History, User, MessageCircle
} from 'lucide-react';
import { 
  AlertaMeta, ApuracaoMeta, MetaFaturamento, TratativaAlerta,
  STATUS_ALERTA_META_LABELS, CRITICIDADE_ALERTA_LABELS,
  STATUS_APURACAO_LABELS, CATEGORIA_CAUSA_META_LABELS,
  StatusAlertaMeta, StatusTratativaAlerta, CategoriaCausaMeta,
  CriticidadeAlertaMeta
} from '@/types';
import Link from 'next/link';

export default function AlertaTratativaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [tratativaForm, setTratativaForm] = useState<Partial<TratativaAlerta>>({
    status: 'pendente' as StatusTratativaAlerta,
    categoria_causa: 'outros' as CategoriaCausaMeta,
    descricao_analise: '',
    causa_raiz: '',
    acao_corretiva: '',
    parecer_final: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metas-faturamento/alertas/${id}`);
      const json = await res.json();
      setData(json);
      if (json.tratativa) {
          setTratativaForm(json.tratativa);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (novoStatusAlerta?: string, novoStatusTratativa?: string) => {
    setSaving(true);
    try {
      const payload = {
        status_alerta: novoStatusAlerta || data.status,
        tratativa: {
          ...tratativaForm,
          status: novoStatusTratativa || tratativaForm.status,
          concluida_em: (novoStatusTratativa === 'concluida' || novoStatusTratativa === 'sem_procedencia') ? new Date().toISOString() : tratativaForm.concluida_em
        }
      };
      
      const res = await fetch(`/api/metas-faturamento/alertas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Carregando detalhes do alerta...</div>;
  if (!data) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Alerta não encontrado.</div>;

  const { meta, operacao, apuracao, tratativa } = data;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/admin/faturamento/alertas" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1rem', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Voltar para Central de Alertas
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-title)' }}>Tratativa de Alerta</h1>
            <p style={{ color: 'var(--text-muted)' }}>Análise e correção de desvio de faturamento em <strong>{operacao?.nome_operacao || 'GLOBAL'}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
             <span style={{ 
               padding: '0.4rem 1rem', borderRadius: '12px', background: 'var(--bg-card)', 
               border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700 
             }}>
               Status: {STATUS_ALERTA_META_LABELS[data.status as StatusAlertaMeta]}
             </span>
             <span style={{ 
               padding: '0.4rem 1rem', borderRadius: '12px', 
               background: data.criticidade === 'alta' || data.criticidade === 'critica' ? 'var(--danger-bg)' : 'var(--warning-bg)', 
               color: data.criticidade === 'alta' || data.criticidade === 'critica' ? 'var(--danger)' : 'var(--warning)', 
               border: '1px solid transparent', fontSize: '0.85rem', fontWeight: 700 
             }}>
               Criticidade: {CRITICIDADE_ALERTA_LABELS[data.criticidade as CriticidadeAlertaMeta]}
             </span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Lado Esquerdo: Formulário de Tratativa */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <ShieldAlert size={20} color="var(--brand-primary)" />
                 Fluxo de Auditoria
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Status da Tratativa</label>
                  <select 
                    className="form-control"
                    value={tratativaForm.status}
                    onChange={e => setTratativaForm(p => ({ ...p, status: e.target.value as StatusTratativaAlerta }))}
                  >
                     <option value="pendente">Pendente</option>
                     <option value="em_analise">Em Análise</option>
                     <option value="concluida">Concluída</option>
                     <option value="sem_procedencia">Sem Procedência</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoria da Causa</label>
                  <select 
                    className="form-control"
                    value={tratativaForm.categoria_causa}
                    onChange={e => setTratativaForm(p => ({ ...p, categoria_causa: e.target.value as CategoriaCausaMeta }))}
                  >
                     {Object.entries(CATEGORIA_CAUSA_META_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                 <label>Descrição da Análise Técnica</label>
                 <textarea 
                    className="form-control" 
                    rows={4} 
                    value={tratativaForm.descricao_analise}
                    onChange={e => setTratativaForm(p => ({ ...p, descricao_analise: e.target.value }))}
                    placeholder="Detalhamento da investigação realizada..."
                 />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Causa Raiz Identificada</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={tratativaForm.causa_raiz}
                    onChange={e => setTratativaForm(p => ({ ...p, causa_raiz: e.target.value }))}
                    placeholder="Qual o motivo principal do desvio?"
                  />
                </div>
                <div className="form-group">
                  <label>Ação Corretiva Proposta</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={tratativaForm.acao_corretiva}
                    onChange={e => setTratativaForm(p => ({ ...p, acao_corretiva: e.target.value }))}
                    placeholder="O que foi ou será feito para corrigir?"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                 <label>Parecer Final da Auditoria</label>
                 <textarea 
                    className="form-control" 
                    rows={3} 
                    value={tratativaForm.parecer_final}
                    onChange={e => setTratativaForm(p => ({ ...p, parecer_final: e.target.value }))}
                    placeholder="Conclusão formal para encerramento do alerta..."
                 />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                 <button 
                   onClick={() => handleSave('em_analise', 'em_analise')}
                   className="btn btn-ghost" 
                   disabled={saving}
                 >
                   Assumir Tratativa
                 </button>
                 <button 
                   onClick={() => handleSave()}
                   className="btn btn-secondary" 
                   style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                   disabled={saving}
                 >
                   <Save size={18} /> Apenas Salvar
                 </button>
                 <button 
                   onClick={() => handleSave('concluido', 'concluida')}
                   className="btn btn-primary" 
                   disabled={saving}
                 >
                   Finalizar Análise
                 </button>
              </div>
           </div>

           <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 700 }}>Histórico de Tratativa</h3>
              {data.tratativa?.criado_em ? (
                <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
                   <div style={{ background: 'var(--brand-primary-light)', padding: '0.5rem', borderRadius: '50%', height: 'fit-content' }}>
                      <User size={16} color="var(--brand-primary)" />
                   </div>
                   <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{data.tratativa.auditor?.nome || 'Auditor não atribuído'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         Iniciada em {new Date(data.tratativa.criado_em).toLocaleString()}
                      </div>
                      {data.tratativa.concluida_em && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.25rem' }}>
                           Concluída em {new Date(data.tratativa.concluida_em).toLocaleString()}
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum histórico registrado para esta tratativa.</p>
              )}
           </div>
        </section>

        {/* Lado Direito: Info de Contexto */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <Target size={18} /> Contexto da Meta
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Competência</span>
                    <span style={{ fontWeight: 700 }}>{meta.mes}/{meta.ano}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meta Mensal</span>
                    <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(meta.valor_meta)}</span>
                 </div>
              </div>
           </div>

           <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-app)', border: '1px dashed var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <History size={18} /> Apuração do Snap
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Realizado</span>
                    <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apuracao.valor_realizado)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desvio</span>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apuracao.desvio_valor)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Atingimento</span>
                    <span style={{ fontWeight: 900, color: 'var(--danger)', fontSize: '1.1rem' }}>{apuracao.percentual_atingimento?.toFixed(1)}%</span>
                 </div>
                 <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                 <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Saúde dos dados:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                       <Clock size={14} />
                       <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sync: {apuracao.confianca_apuracao}</span>
                    </div>
                    {operacao?.ultima_sincronizacao && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '1.4rem' }}>
                         Última: {new Date(operacao.ultima_sincronizacao).toLocaleString()}
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <MessageCircle size={18} /> Motivo Preliminar
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                 {data.motivo_preliminar || "Nenhum resumo gerado automaticamente."}
              </p>
           </div>
        </aside>
      </div>
    </div>
  );
}
