'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, CheckCircle2, Clock, User, MessageSquare, 
  History, Info, ChevronRight, Save, Trash2, Send, Activity, PenTool,
  CalendarDays, AlertCircle, RefreshCcw
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
  const [loading, setLoading] = useState(false);
  const [analistas, setAnalistas] = useState<Usuario[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [comentario, setComentario] = useState('');
  const [desativarDiaRecorrente, setDesativarDiaRecorrente] = useState(false);
  
  // Sistema de Notificação Inline (Substitui o alert popup)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const [formData, setFormData] = useState({
    status: alerta.status as StatusAlertaMeta || 'novo',
    analista_responsavel_id: alerta.analista_responsavel_id || '',
    justificativa: alerta.justificativa || ''
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000); // Auto-hide após 4s
  };

  const fixDate = (d: any) => {
    if (!d) return new Date();
    const s = d.toString().split('T')[0];
    return new Date(s + 'T12:00:00');
  };

  const dataRef = fixDate(alerta.data_referencia);
  const diaSemanaIndex = dataRef.getDay();
  const DIAS_NOMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const diaSemanaNome = DIAS_NOMES[diaSemanaIndex];
  const isFinalDeSemana = diaSemanaIndex === 0 || diaSemanaIndex === 6;

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

  const handleSave = async () => {
    if (!formData.status) return showNotification('error', 'Selecione um status obrigatório!');
    
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

      if (desativarDiaRecorrente && isFinalDeSemana) {
         // ... logica de calendario se necessário ...
      }

      showNotification('success', 'Ação registrada com sucesso!');
      setComentario('');
      await fetchHistorico(); // RECARGA IMEDIATA
      onRefresh();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (fid: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;
    try {
       const res = await fetch(`/api/faturamento/alertas?feedback_id=${fid}`, { method: 'DELETE' });
       if (res.ok) {
         showNotification('success', 'Item removido do histórico');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ minHeight: '80vh', position: 'relative', borderRadius: '24px' }}>
        
        {/* NOTIFICAÇÃO INLINE EXCLUSIVA */}
        {notification && (
          <div className={`notification-inline ${notification.type === 'success' ? 'success' : 'error'}`} style={{
            position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
            padding: '1rem 2rem', borderRadius: '16px', background: notification.type === 'success' ? '#22C55E' : '#EF4444',
            color: 'white', fontWeight: 700, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'slideDownIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {notification.message}
          </div>
        )}

        <header className="modal-header" style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #F1F5F9' }}>
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className={`badge ${getStatusBadgeClass(alerta.status)}`} style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', fontWeight: 800 }}>
                    {(STATUS_ALERTA_META_LABELS[alerta.status as StatusAlertaMeta] || alerta.status).toUpperCase()}
                 </span>
                 <span className="text-[10px] text-slate-400 font-black tracking-widest bg-slate-100 px-2 py-1 rounded">AUDIT PRO #{alerta.id?.substring(0,8)}</span>
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{alerta.operacao?.nome_operacao || 'Operação Global'}</h2>
           </div>
           <button className="btn-icon btn-ghost" onClick={onClose} style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
              <X size={28} />
           </button>
        </header>

        <main className="modal-body custom-scrollbar" style={{ padding: '2.5rem', background: '#F8FAFC' }}>
           <div className="form-grid form-grid-2">
              
              <section className="card-v2" style={{ padding: '1.5rem', background: 'white' }}>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Info size={14} className="text-primary" /> Sumário do Desvio
                 </h3>
                 <div className="flex flex-col gap-4">
                    <div className="flex flex-between items-center text-sm">
                       <span className="text-slate-500 font-bold">Natureza:</span>
                       <span className="font-extrabold text-slate-900">{alerta.tipo_alerta || alerta.regra?.codigo || 'Operacional'}</span>
                    </div>
                    <div className="flex flex-between items-center text-sm">
                       <span className="text-slate-500 font-bold">Incidência:</span>
                       <span className="font-extrabold text-slate-900">{fixDate(alerta.data_referencia || alerta.criado_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex flex-between items-center text-sm">
                       <span className="text-slate-500 font-bold">Nível Crítico:</span>
                        <div style={{ 
                           padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, color: 'white',
                           background: alerta.severidade === 'critico' ? '#EF4444' : alerta.severidade === 'alerta' ? '#F97316' : '#3B82F6' 
                        }}>
                           {(alerta.severidade || 'insight').toUpperCase()}
                        </div>
                    </div>
                    <hr className="my-2 border-slate-100" />
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <User size={20} />
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 leading-none">AUDITOR RESPONSÁVEL</div>
                          <div className="text-sm font-extrabold text-primary">
                             {analistas.find(u => u.id === alerta.analista_responsavel_id)?.nome || 'Pendente de Atribuição'}
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              <section className="card-v2" style={{ padding: '1.5rem', background: 'white' }}>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Activity size={14} className="text-primary" /> Diagnóstico do Sistema
                  </h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                       <AlertCircle size={16} className="text-primary" />
                       {alerta.resumo || 'Análise de integridade.'}
                    </div>
                    
                    <div className="diagnostic-content text-xs leading-relaxed text-slate-600">
                       {(() => {
                          const det = alerta.detalhes || {};
                          const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
                          
                          if (det.dias && det.ultimos_valores) {
                             return (
                                <div className="space-y-3">
                                   <p>Ocorrência de <strong>{det.dias} dias</strong> abaixo da performance esperada.</p>
                                   <div className="flex flex-wrap gap-2">
                                      {det.ultimos_valores.map((v: number, i: number) => (
                                         <span key={i} className="px-2 py-1 bg-white border-2 border-slate-100 rounded-lg font-mono font-black text-danger">
                                            {fmt(v)}
                                         </span>
                                      ))}
                                   </div>
                                </div>
                             );
                          }

                          if (det.valor === 0 && (det.meta !== undefined)) {
                             return (
                                <div className="space-y-2">
                                   <p>Unidade identificada com lançamento zero em dia operacional.</p>
                                   <div className="bg-white p-2 rounded-xl border border-slate-100">
                                      Realizado: <strong className="text-danger">{fmt(0)}</strong> • Meta: <strong className="text-slate-900">{fmt(det.meta || 0)}</strong>
                                   </div>
                                </div>
                             );
                          }
                          return <pre className="text-[10px] font-mono text-slate-400">{JSON.stringify(det, null, 2)}</pre>;
                       })()}
                    </div>
                  </div>
              </section>

              <section className="span-2 card-v2" style={{ padding: '2rem', background: 'white' }}>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <PenTool size={14} className="text-primary" /> Decisão de Auditoria
                 </h3>
                 <div className="form-grid form-grid-2">
                    <div className="form-group"><label className="form-label font-black text-slate-500 uppercase text-[10px]">Alterar Status</label>
                       <select className="form-control" disabled={!canEdit} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as StatusAlertaMeta }))} style={{ borderRadius: '12px', height: '48px', border: '2px solid #F1F5F9', fontWeight: 800 }}>
                          <option value="novo">Novo / Pendente</option>
                          <option value="em_analise">Em Análise</option>
                          <option value="justificado">Justificado</option>
                          <option value="resolvido">Resolvido</option>
                          <option value="descartado">Falso Alerta</option>
                       </select>
                    </div>
                    <div className="form-group"><label className="form-label font-black text-slate-500 uppercase text-[10px]">Mudar Responsável</label>
                       <select className="form-control" disabled={!canEdit} value={formData.analista_responsavel_id} onChange={e => setFormData(f => ({ ...f, analista_responsavel_id: e.target.value }))} style={{ borderRadius: '12px', height: '48px', border: '2px solid #F1F5F9', fontWeight: 800 }}>
                          <option value="">-- Designar Analista --</option>
                          {analistas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                       </select>
                    </div>
                    <div className="form-group span-2"><label className="form-label font-black text-slate-500 uppercase text-[10px]">Parecer Técnico Final</label>
                       <textarea className="form-control" placeholder="Escreva a análise conclusiva aqui..." disabled={!canEdit} value={formData.justificativa} onChange={e => setFormData(f => ({ ...f, justificativa: e.target.value }))} style={{ borderRadius: '16px', minHeight: '100px', border: '2px solid #F1F5F9' }} />
                    </div>
                 </div>
                 <div className="mt-6 pt-6 border-t border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Nova Observação de Campo</label>
                    <div className="flex gap-3">
                       <input type="text" className="form-control flex-1" placeholder="Adicionar detalhe operacional..." value={comentario} onChange={e => setComentario(e.target.value)} style={{ borderRadius: '12px', height: '48px', border: '2px solid #F1F5F9' }} />
                       <button className="btn btn-primary" disabled={!comentario.trim() || !canEdit || loading} onClick={handleSave} style={{ borderRadius: '12px', padding: '0 1.5rem', height: '48px' }}>
                          {loading ? <RefreshCcw className="animate-spin" /> : <Send size={20} />}
                       </button>
                    </div>
                 </div>
              </section>

              {/* TIMELINE DE HISTÓRICO PREMIUM */}
              <section className="span-2 card-v2" style={{ padding: '2rem', background: 'white' }}>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-8 flex items-center gap-2">
                    <History size={14} className="text-primary" /> Timeline de Interações
                 </h3>
                 <div className="timeline-v2 flex flex-col gap-8 relative px-4">
                    <div className="absolute left-6 top-0 bottom-0 w-1 bg-slate-50" />
                    
                    {historico.length === 0 ? (
                      <div className="text-sm text-slate-400 italic py-8 text-center bg-slate-50 rounded-2xl">Aguardando registro inicial do sistema...</div>
                    ) : historico.map((h, idx) => (
                       <div key={idx} className="group relative flex gap-6 items-start">
                          <div className={`relative z-10 w-4 h-4 rounded-full mt-2 ring-4 ring-white ${h.acao === 'novo' ? 'bg-orange-500' : h.acao === 'resolvido' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          
                          <div className="flex-1 bg-slate-50 rounded-2xl p-5 border border-transparent transition-all hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100">
                             <div className="flex flex-between mb-2">
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                   {h.usuario?.nome || 'INTEGRAÇÃO ERP'} • {new Date(h.criado_at).toLocaleString('pt-BR')}
                                </div>
                                
                                {h.usuario_id === currentUserId && (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => { setEditingFeedbackId(h.id); setEditingContent(h.comentario || ''); }} className="text-primary hover:text-primary-dark"><PenLine size={14} /></button>
                                     <button onClick={() => handleDeleteComment(h.id)} className="text-danger hover:text-danger-dark"><Trash2 size={14} /></button>
                                  </div>
                                )}
                             </div>

                             {editingFeedbackId === h.id ? (
                               <div className="mt-2 flex flex-col gap-2">
                                  <textarea className="form-control text-sm w-full" value={editingContent} onChange={e => setEditingContent(e.target.value)} />
                                  <div className="flex gap-2 justify-end">
                                     <button className="btn btn-xs btn-ghost" onClick={() => setEditingFeedbackId(null)}>Cancelar</button>
                                     <button className="btn btn-xs btn-primary" onClick={handleUpdateFeedback}>Salvar Alteração</button>
                                  </div>
                               </div>
                             ) : (
                               <div className="text-sm font-bold text-slate-700 leading-relaxed">
                                  {h.acao !== 'novo' && <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 mr-2">{h.acao.toUpperCase()}</span>}
                                  {h.comentario || h.descricao || 'Alerta registrado pelo motor de diagnóstico.'}
                               </div>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
           </div>
        </main>

        <footer className="modal-footer" style={{ padding: '1.5rem 2.5rem', background: 'white', borderTop: '1px solid #F1F5F9' }}>
           <button className="btn btn-secondary btn-lg" onClick={onClose} style={{ borderRadius: '14px', border: '2px solid #F1F5F9' }}>Fechar Painel</button>
           {canEdit && (
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={loading} style={{ borderRadius: '14px', padding: '0 2.5rem', background: '#0F172A', fontWeight: 900 }}>
                 {loading ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                 {loading ? 'Sincronizando...' : 'Efetivar Tratativa'}
              </button>
           )}
        </footer>
      </div>

      <style jsx>{`
        @keyframes slideDownIn {
          from { transform: translate(-50%, -100%); opacity: 0; scale: 0.9; }
          to { transform: translate(-50%, 0); opacity: 1; scale: 1; }
        }
        .card-v2 {
          border-radius: 24px;
          border: 1px solid #F1F5F9;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-v2:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
