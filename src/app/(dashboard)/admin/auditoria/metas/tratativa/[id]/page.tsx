'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, AlertTriangle, CheckCircle2, 
  ArrowLeft, Target, Activity, Clock, RefreshCcw,
  Save, ShieldCheck, Ban, UserCheck, MessageSquare, Info
} from 'lucide-react';
import { 
  AlertaMeta, TratativaAlerta, Operacao,
  STATUS_ALERTA_META_LABELS, 
  CRITICIDADE_ALERTA_LABELS,
  STATUS_TRATATIVA_LABELS,
  CATEGORIA_CAUSA_META_LABELS
} from '@/types';

const formatMoeda = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function TratativaAlertaPage({ params }: { params: { id: string } }) {
  const [alerta, setAlerta] = useState<any>(null);
  const [tratativa, setTratativa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    status: 'pendente',
    categoria_causa: '',
    descricao_analise: '',
    causa_raiz: '',
    acao_corretiva: '',
    parecer_final: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/metas-faturamento/alertas/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAlerta(data);
        if (data.tratativa?.[0]) {
          const t = data.tratativa[0];
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveTratativa = async (statusOverride?: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/metas-faturamento/alertas/${params.id}/tratativa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          status: statusOverride || formData.status 
        })
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

  if (loading) return <div className="page-container"><div style={{ padding: '4rem', textAlign: 'center' }}>Carregando dados da tratativa...</div></div>;
  if (!alerta) return <div className="page-container"><div style={{ padding: '4rem', textAlign: 'center' }}>Alerta não encontrado.</div></div>;

  const meta = alerta.meta || {};
  const apu = alerta.apuracao || {};
  const isConcluido = formData.status === 'concluida' || formData.status === 'sem_procedencia';

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => window.history.back()} className="action-btn" style={{ background: 'var(--bg-card)' }}>
             <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Tratativa de Alerta</h1>
            <p className="page-subtitle">Ref: Meta {meta.mes}/{meta.ano} • {alerta.operacao?.nome_operacao}</p>
          </div>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '1rem' }}>
            {formData.status === 'pendente' && (
               <button className="btn btn-primary" onClick={() => handleSaveTratativa('em_analise')} disabled={saving}>
                  <UserCheck size={16} /> Assumir Tratativa
               </button>
            )}
            {!isConcluido && (
               <>
                 <button className="btn btn-secondary" onClick={() => handleSaveTratativa('concluida')} disabled={saving}>
                    <ShieldCheck size={16} /> Concluir
                 </button>
                 <button className="btn btn-ghost" onClick={() => handleSaveTratativa('sem_procedencia')} disabled={saving}>
                    <Ban size={16} /> Sem Procedência
                 </button>
               </>
            )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem' }}>
        
        {/* Lado Esquerdo: Formulário de Análise */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Sessão 1: Motivo do Alerta */}
          <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
             <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} color="var(--danger)" />
                <h3 className="card-title">Origem do Alerta: {alerta.tipo_alerta}</h3>
             </div>
             <div className="card-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                   {alerta.motivo_preliminar}
                </p>
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                   <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Meta Mensal</span><br/>
                      <span style={{ fontWeight: 700 }}>{formatMoeda(meta.valor_meta)}</span>
                   </div>
                   <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Realizado até Alerta</span><br/>
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{formatMoeda(apu.valor_realizado)}</span>
                   </div>
                   <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Desvio Valor</span><br/>
                      <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatMoeda(apu.desvio_valor)}</span>
                   </div>
                   <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Atingimento</span><br/>
                      <span style={{ fontWeight: 700 }}>{apu.percentual_atingimento?.toFixed(1)}%</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Sessão 2: Formulário de Auditoria */}
          <div className="card">
             <div className="card-header">
                <h3 className="card-title">Análise de Auditoria</h3>
             </div>
             <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div className="form-group">
                   <label>Categoria da Causa</label>
                   <select 
                     className="form-control"
                     value={formData.categoria_causa}
                     onChange={e => setFormData(p => ({ ...p, categoria_causa: e.target.value }))}
                     disabled={isConcluido}
                   >
                      <option value="">Selecione...</option>
                      {Object.entries(CATEGORIA_CAUSA_META_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                   </select>
                </div>

                <div className="form-group">
                   <label>Descrição da Análise Preliminar</label>
                   <textarea 
                     className="form-control" 
                     rows={4}
                     placeholder="Detalhe o que foi observado inicialmente..."
                     value={formData.descricao_analise}
                     onChange={e => setFormData(p => ({ ...p, descricao_analise: e.target.value }))}
                     disabled={isConcluido}
                   />
                </div>

                <div className="form-group">
                   <label>Identificação de Causa Raiz</label>
                   <textarea 
                     className="form-control" 
                     rows={3}
                     placeholder="Qual foi o motivo real do desvio identificado?"
                     value={formData.causa_raiz}
                     onChange={e => setFormData(p => ({ ...p, causa_raiz: e.target.value }))}
                     disabled={isConcluido}
                   />
                </div>

                <div className="form-group">
                   <label>Plano de Ação Corretiva / Recomendação</label>
                   <textarea 
                     className="form-control" 
                     rows={3}
                     placeholder="O que deve ser feito para corrigir ou mitigar este desvio?"
                     value={formData.acao_corretiva}
                     onChange={e => setFormData(p => ({ ...p, acao_corretiva: e.target.value }))}
                     disabled={isConcluido}
                   />
                </div>

                <div className="form-group">
                   <label>Parecer Final da Auditoria</label>
                   <textarea 
                     className="form-control" 
                     rows={3}
                     placeholder="Conslusão final do auditor..."
                     value={formData.parecer_final}
                     onChange={e => setFormData(p => ({ ...p, parecer_final: e.target.value }))}
                     disabled={isConcluido}
                   />
                </div>

                {!isConcluido && (
                   <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                      <button className="btn btn-primary" onClick={() => handleSaveTratativa()} disabled={saving}>
                         <Save size={16} /> Salvar Alterações
                      </button>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Lado Direito: Infos e Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           
           <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Informações da Tratativa</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>Status Atual:</span>
                    <span style={{ 
                      fontSize: '0.9rem', fontWeight: 800, 
                      color: formData.status === 'pendente' ? 'var(--danger)' : formData.status === 'em_analise' ? 'var(--brand-primary)' : 'var(--success)'
                    }}>
                       {STATUS_TRATATIVA_LABELS[formData.status as any] || formData.status}
                    </span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>Auditor Responsável:</span>
                    <span style={{ fontWeight: 700 }}>{tratativa?.auditor?.nome || 'Pendente'}</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>Data Início:</span>
                    <span style={{ fontWeight: 600 }}>{tratativa?.criado_em ? new Date(tratativa.criado_em).toLocaleString('pt-BR') : '-'}</span>
                 </div>
                 {tratativa?.concluida_em && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                       <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>Data Conclusão:</span>
                       <span style={{ fontWeight: 600 }}>{new Date(tratativa.concluida_em).toLocaleString('pt-BR')}</span>
                    </div>
                 )}
              </div>
           </div>

           <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                 <div style={{ padding: '0.5rem', background: 'var(--info-bg)', color: 'var(--info)', borderRadius: '8px' }}>
                    <Info size={16} />
                 </div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Esta tratativa é auditada. Todas as alterações ficam registradas no histórico do sistema. Use este espaço para formalizar a justificativa e as ações tomadas sobre este desvio.
                 </div>
              </div>
              <button 
                className="btn btn-ghost btn-full" 
                style={{ marginTop: '1.5rem', fontSize: '0.75rem' }}
                onClick={() => window.location.href = `/admin/faturamento/metas/${alerta.meta_id}`}
              >
                 Ver Detalhes da Meta
              </button>
           </div>

        </div>

      </div>
    </div>
  );
}
