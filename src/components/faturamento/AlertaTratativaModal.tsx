'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, AlertTriangle, CheckCircle2, Clock, User, MessageSquare, 
  History, Info, ChevronRight, Save, Trash2, Send, Activity, PenTool,
  CalendarDays, AlertCircle, RefreshCcw, PenLine
} from 'lucide-react';
import { 
  AlertaMeta, StatusAlertaMeta, STATUS_ALERTA_META_LABELS, 
  CRITICIDADE_ALERTA_LABELS, Usuario 
} from '@/types';

interface AlertaTratativaModalProps {
  alerta: any;
  onClose: () => void;
  onRefresh: () => void;
  canEdit: boolean;
  userId?: string;
}

export default function AlertaTratativaModal({ alerta, onClose, onRefresh, canEdit, userId }: AlertaTratativaModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analistas, setAnalistas] = useState<Usuario[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [comentario, setComentario] = useState('');
  
  // Sistema de Notificação Inline
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    status: alerta.status as StatusAlertaMeta || 'novo',
    analista_responsavel_id: alerta.analista_responsavel_id || '',
    justificativa: alerta.justificativa || ''
  });

  // Sincroniza estado interno caso o alerta mude (por refresh do pai)
  useEffect(() => {
    setFormData({
      status: alerta.status as StatusAlertaMeta || 'novo',
      analista_responsavel_id: alerta.analista_responsavel_id || '',
      justificativa: alerta.justificativa || ''
    });
  }, [alerta.id, alerta.status, alerta.justificativa, alerta.analista_responsavel_id]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fixDate = (d: any) => {
    if (!d) return new Date();
    const s = d.toString().split('T')[0];
    return new Date(s + 'T12:00:00');
  };

  useEffect(() => {
    fetchAnalistas();
    fetchHistorico();
    fetchSession();
  }, [alerta.id]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data?.user?.id || null);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAnalistas = async () => {
    try {
      const res = await fetch('/api/usuarios?perfil=auditoria');
      if (res.ok) setAnalistas(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchHistorico = async () => {
    try {
      const res = await fetch(`/api/faturamento/alertas?alerta_id=${alerta.id}&mode=history`);
      if (res.ok) {
        const data = await res.json();
        setHistorico(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = async (isFinalize = false) => {
    if (!formData.status && isFinalize) return showNotification('error', 'Selecione um status conclusivo!');
    
    setLoading(true);
    try {
      const res = await fetch('/api/faturamento/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alerta_id: alerta.id,
          acao: formData.status,
          comentario: formData.justificativa,
          comentario_adicional: comentario,
          analista_responsavel_id: formData.analista_responsavel_id
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar tratativa');

      showNotification('success', isFinalize ? 'Tratativa efetivada com sucesso!' : 'Ação registrada com sucesso!');
      setComentario('');
      
      await fetchHistorico();
      onRefresh();

      if (isFinalize) {
        setTimeout(() => {
          onClose();
          router.push(`/admin/auditoria/metas/operacao/${alerta.operacao_id}`);
        }, 1500);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (fid: string) => {
    try {
       const res = await fetch(`/api/faturamento/alertas?feedback_id=${fid}`, { method: 'DELETE' });
       if (res.ok) {
         showNotification('success', 'Item removido do histórico');
         setConfirmDeleteId(null);
         fetchHistorico();
       }
    } catch (e) { showNotification('error', 'Falha ao remover item'); }
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedbackId) return;
    try {
       const res = await fetch('/api/faturamento/alertas', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ feedback_id: editingFeedbackId, comentario: editingContent })
       });
       if (res.ok) {
         showNotification('success', 'Comentário atualizado');
         setEditingFeedbackId(null);
         fetchHistorico();
       }
    } catch (e) { showNotification('error', 'Falha ao editar'); }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'novo': return 'badge-warning';
      case 'em_analise': return 'badge-info';
      case 'justificado': return 'badge-primary';
      case 'resolvido': return 'badge-success';
      case 'descartado': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-content modal-xl" onClick={e => e.stopPropagation()} style={{ 
        minHeight: '85vh', 
        position: 'relative', 
        borderRadius: '32px', 
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        maxWidth: '1280px' // Aumento para ultra-wide view
      }}>
        
        {notification && (
          <div className={`notification-inline ${notification.type === 'success' ? 'success' : 'error'}`} style={{
            position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
            padding: '1rem 2.5rem', borderRadius: '20px', background: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
            color: 'white', fontWeight: 800, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '14px',
            animation: 'slideDownIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '320px',
            justifyContent: 'center'
          }}>
            {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
            {notification.message}
          </div>
        )}

        <header className="modal-header" style={{ padding: '2.5rem 3rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className={`badge ${getStatusBadgeClass(alerta.status)}`} style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem', fontWeight: 900, borderRadius: '10px' }}>
                    {(STATUS_ALERTA_META_LABELS[alerta.status as StatusAlertaMeta] || alerta.status).toUpperCase()}
                 </span>
                 <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--gray-500)', 
                    fontWeight: 900, 
                    letterSpacing: '1px', 
                    background: 'var(--gray-100)', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '8px' 
                  }}>
                    ID do alerta: #{alerta.id?.substring(0,8)}
                  </span>
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-title)', letterSpacing: '-0.5px' }}>
                {alerta.operacao?.nome_operacao || 'Operação Global'}
              </h2>
           </div>
           <button className="btn-icon btn-ghost" onClick={onClose} style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--gray-50)' }}>
              <X size={24} color="var(--text-main)" />
           </button>
        </header>

        <main className="modal-body custom-scrollbar" style={{ padding: '2rem 3rem', background: 'var(--bg-app)' }}>
           {/* Novo Grid Split para maximizar informações no campo de visão */}
           <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '2rem', height: '100%' }}>
              
              {/* Coluna Esquerda: Dados e Ações */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 
                 <section className="card-v2" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <Info size={16} color="var(--brand-primary)" /> Detalhes do Registro
                    </h3>
                    <div className="flex flex-col gap-4">
                       <div className="flex flex-between items-center text-sm">
                          <span style={{ color: 'var(--gray-500)', fontWeight: 700 }}>Tipo:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{alerta.tipo_alerta || alerta.regra?.codigo || 'Operacional'}</span>
                       </div>
                       <div className="flex flex-between items-center text-sm">
                          <span style={{ color: 'var(--gray-500)', fontWeight: 700 }}>Data:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{fixDate(alerta.data_referencia || alerta.criado_at).toLocaleDateString('pt-BR')}</span>
                       </div>
                       <div className="flex flex-between items-center text-sm">
                          <span style={{ color: 'var(--gray-500)', fontWeight: 700 }}>Criticidade:</span>
                           <div style={{ 
                              padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, color: 'white',
                              background: alerta.severidade === 'critico' ? 'var(--danger)' : alerta.severidade === 'alerta' ? 'var(--warning)' : 'var(--brand-primary)' 
                           }}>
                              {(alerta.severidade || 'insight').toUpperCase()}
                           </div>
                       </div>
                    </div>
                 </section>

                 <section className="card-v2" style={{ padding: '1.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', flex: 1 }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <PenTool size={16} color="var(--brand-primary)" /> Ações de Auditoria
                    </h3>
                    <div className="flex flex-col gap-5">
                       <div className="form-group">
                          <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Alterar Status</label>
                          <select className="form-control" disabled={!canEdit} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as StatusAlertaMeta }))} style={{ borderRadius: '12px', height: '48px', border: '1px solid var(--border-color)', fontWeight: 800, background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                             <option value="novo">Novo / Pendente</option>
                             <option value="em_analise">Em Análise Técnica</option>
                             <option value="justificado">Tratativa Justificada</option>
                             <option value="resolvido">Resolvido / Ajustado</option>
                             <option value="descartado">Falso Alerta / Outros</option>
                          </select>
                       </div>
                       <div className="form-group">
                          <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Designar Analista</label>
                          <select className="form-control" disabled={!canEdit} value={formData.analista_responsavel_id} onChange={e => setFormData(f => ({ ...f, analista_responsavel_id: e.target.value }))} style={{ borderRadius: '12px', height: '48px', border: '1px solid var(--border-color)', fontWeight: 800, background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                             <option value="">-- Selecionar Auditor --</option>
                             {analistas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                          </select>
                       </div>
                       <div className="form-group">
                          <label style={{ fontSize: '10px', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Parecer Técnico</label>
                          <textarea className="form-control" placeholder="Descreva os motivos e medidas..." disabled={!canEdit} value={formData.justificativa} onChange={e => setFormData(f => ({ ...f, justificativa: e.target.value }))} style={{ borderRadius: '16px', minHeight: '140px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-main)', padding: '1rem' }} />
                       </div>
                    </div>
                 </section>

              </div>

              {/* Coluna Direita: Diagnóstico e Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 
                 <section className="card-v2" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <Activity size={16} color="var(--brand-primary)" /> Diagnóstico do Sistema
                    </h3>
                    <div style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '24px', border: '2px dashed var(--border-color)' }}>
                       <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle size={20} color="var(--brand-primary)" />
                          {alerta.resumo || 'Análise de integridade.'}
                       </div>
                       
                       <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--gray-600)', fontWeight: 600 }}>
                          {(() => {
                             const det = alerta.detalhes || {};
                             const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
                             
                             if (det.dias && det.ultimos_valores) {
                                return (
                                   <div className="space-y-4">
                                      <p>Foram detectados <strong>{det.dias} dias</strong> consecutivos com performance abaixo da média.</p>
                                      <div className="flex flex-wrap gap-3">
                                         {det.ultimos_valores.map((v: number, i: number) => (
                                            <span key={i} style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontFamily: 'monospace', fontWeight: 900, color: 'var(--danger)', fontSize: '0.9rem' }}>
                                               {fmt(v)}
                                            </span>
                                         ))}
                                      </div>
                                   </div>
                                );
                             }

                             if (det.valor === 0 && (det.meta !== undefined)) {
                                return (
                                   <div className="space-y-3">
                                      <p>Ocorrência Crítica: Faturamento zerado em período operacional pendente.</p>
                                      <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                                         Realizado: <strong style={{ color: 'var(--danger)' }}>{fmt(0)}</strong> • Esperado: <strong style={{ color: 'var(--text-main)' }}>{fmt(det.meta || 0)}</strong>
                                      </div>
                                   </div>
                                );
                             }
                             return <pre style={{ fontSize: '11px', color: 'var(--gray-400)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{JSON.stringify(det, null, 2)}</pre>;
                          })()}
                       </div>
                    </div>
                 </section>

                 <section className="card-v2 custom-scrollbar" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <History size={16} color="var(--brand-primary)" /> Timeline de Interações
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative', paddingLeft: '0.5rem' }}>
                       <div style={{ position: 'absolute', left: '11px', top: '0', bottom: '0', width: '2px', background: 'var(--gray-100)' }} />
                       
                       {historico.length === 0 ? (
                         <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>
                           Aguardando interações...
                         </div>
                       ) : historico.map((h, idx) => (
                          <div key={idx} style={{ position: 'relative', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                             <div style={{ 
                               position: 'relative', zIndex: 10, width: '12px', height: '12px', borderRadius: '50%', marginTop: '8px',
                               background: h.acao === 'novo' ? 'var(--warning)' : h.acao === 'resolvido' ? 'var(--success)' : 'var(--brand-primary)',
                               border: '2px solid var(--bg-card)'
                             }} />
                             
                             <div style={{ 
                               flex: 1, background: 'var(--bg-app)', borderRadius: '20px', padding: '1.25rem', 
                               border: '1px solid var(--border-color)'
                             }}>
                                <div className="flex flex-between mb-2">
                                   <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                                      {h.usuario?.nome || 'SISTEMA'} • {new Date(h.criado_at).toLocaleString('pt-BR')}
                                   </div>
                                   {h.usuario_id === currentUserId && (
                                     <div className="flex gap-2">
                                        <button onClick={() => { setEditingFeedbackId(h.id); setEditingContent(h.comentario || ''); }} style={{ color: 'var(--brand-primary)' }}><PenLine size={12} /></button>
                                        <button onClick={() => setConfirmDeleteId(h.id)} style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
                                     </div>
                                   )}
                                </div>
                                {editingFeedbackId === h.id ? (
                                  <div className="flex flex-col gap-2 mt-2">
                                     <textarea className="form-control text-xs" value={editingContent} onChange={e => setEditingContent(e.target.value)} />
                                     <div className="flex gap-2 justify-end">
                                        <button className="btn btn-xs btn-ghost" onClick={() => setEditingFeedbackId(null)}>Descartar</button>
                                        <button className="btn btn-xs btn-primary" onClick={handleUpdateFeedback}>Salvar</button>
                                     </div>
                                  </div>
                                ) : confirmDeleteId === h.id ? (
                                  <div className="mt-2 flex items-center justify-between bg-danger-bg p-3 rounded-xl border border-danger">
                                    <span className="text-[10px] text-danger font-bold">Remover registro?</span>
                                    <div className="flex gap-2">
                                      <button className="btn btn-xs btn-ghost" onClick={() => setConfirmDeleteId(null)}>Não</button>
                                      <button className="btn btn-xs btn-primary" style={{ background: 'var(--danger)', border: 'none' }} onClick={() => handleDeleteComment(h.id)}>Sim</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.5' }}>
                                     {h.acao !== 'novo' && <span style={{ fontSize: '8px', padding: '1px 4px', background: 'var(--gray-200)', borderRadius: '4px', marginRight: '6px' }}>{h.acao.toUpperCase()}</span>}
                                     {h.comentario || h.descricao}
                                  </div>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>

                    {/* Campo de comentário rápido fixado ao fim da timeline */}
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                       <div className="flex gap-2">
                          <input type="text" className="form-control flex-1" placeholder="Adicionar nota rápida..." value={comentario} onChange={e => setComentario(e.target.value)} style={{ borderRadius: '12px', height: '44px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', fontSize: '0.875rem' }} />
                          <button className="btn btn-primary" disabled={!comentario.trim() || !canEdit || loading} onClick={() => handleSave(false)} style={{ borderRadius: '12px', width: '44px', height: '44px' }}>
                             {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Send size={18} />}
                          </button>
                       </div>
                    </div>
                 </section>

              </div>

           </div>
        </main>

        <footer className="modal-footer" style={{ padding: '2rem 3rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="flex items-center gap-3">
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <User size={20} className="text-slate-400" />
              </div>
              <div>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Analista Atual</div>
                 <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {analistas.find(u => u.id === currentUserId)?.nome || 'Usuário Leve'}
                 </div>
              </div>
           </div>
           
           <div style={{ flex: 1 }} />
           
           <button className="btn btn-secondary btn-lg" onClick={onClose} style={{ borderRadius: '16px', border: '2px solid var(--border-color)', color: 'var(--text-main)', padding: '0 2.5rem' }}>Cancelar</button>
           {canEdit && (
              <button 
                className="btn btn-primary btn-lg" 
                onClick={() => handleSave(true)} 
                disabled={loading} 
                style={{ 
                  borderRadius: '16px', 
                  padding: '0 4rem', 
                  background: 'var(--brand-secondary)', 
                  fontWeight: 900, 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                }}
              >
                 {loading ? <RefreshCcw className="animate-spin" size={22} /> : <CheckCircle2 size={24} />}
                 {loading ? 'SINCRO...' : 'EFETIVAR TRATATIVA'}
              </button>
           )}
        </footer>
      </div>

      <style jsx>{`
        @keyframes slideDownIn {
          from { transform: translate(-50%, -120%); opacity: 0; scale: 0.9; }
          to { transform: translate(-50%, 0); opacity: 1; scale: 1; }
        }
        .card-v2 {
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-v2:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 10px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
