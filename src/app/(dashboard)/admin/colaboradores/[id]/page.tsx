'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { 
  Plus, Save, ArrowLeft, 
  UserCheck, Building2, Calendar, 
  Info, Briefcase, FileText,
  History, Shield, Trash2, CheckCircle2,
  Contact
} from 'lucide-react';
import { 
  Colaborador, STATUS_COLABORADOR_LABELS, 
  TIPO_VINCULO_COLABORADOR_LABELS, StatusColaborador, 
  TipoVinculoColaborador, ColaboradorOperacao 
} from '@/types';
import Link from 'next/link';

export default function ColaboradorDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVinculoModal, setShowVinculoModal] = useState(false);

  const { data: colaborador, mutate: mutateColab } = useSWR<Colaborador>(`/api/colaboradores/${id}`, fetcher);
  const { data: usuarios } = useSWR('/api/usuarios', fetcher);
  const { data: operacoes } = useSWR('/api/operacoes', fetcher);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaborador) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/colaboradores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colaborador)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao atualizar');
      }
      await mutateColab();
      alert('Dados atualizados com sucesso!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    mutateColab(prev => prev ? ({ ...prev, [name]: value }) : prev, false);
  };

  const handleToggleVinculo = async (vinculoId: string, atual: boolean) => {
    try {
      await fetch(`/api/colaboradores/${id}/operacoes/${vinculoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !atual, data_fim: !atual ? null : new Date().toISOString() })
      });
      mutateColab();
    } catch (e) {
      alert('Erro ao atualizar vínculo');
    }
  };

  const handleAddVinculo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/colaboradores/${id}/operacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error);
      }
      setShowVinculoModal(false);
      mutateColab();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!colaborador) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="loading-spinner" />
      <span className="text-muted font-bold text-lg">Carregando dados do colaborador...</span>
    </div>
  );

  return (
    <div className="detail-page-content">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/admin/colaboradores" className="btn btn-secondary btn-icon btn-sm" title="Voltar">
            <ArrowLeft size={16} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
               width: '48px', height: '48px', borderRadius: '14px', 
               background: 'var(--brand-primary)', color: 'white',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               fontSize: '1.2rem', fontWeight: 900, boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              {colaborador.nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="page-title">{colaborador.nome}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge badge-${colaborador.status === 'ativo' ? 'success' : 'danger'}`}>
                  <span className="badge-dot" /> {STATUS_COLABORADOR_LABELS[colaborador.status]}
                </span>
                <span className="badge badge-info">{colaborador.cargo || 'Funcional'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="page-actions">
           <button form="form-edit-colab" type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
           </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <Info size={18} /> {error}
        </div>
      )}

      <div className="detail-grid">
        <div className="main-content">
          <form id="form-edit-colab" onSubmit={handleUpdate} className="premium-form-grid">
             {/* Dados Cadastrais */}
             <section className="card">
               <div className="card-header">
                 <h3 className="card-title text-brand"><Contact size={18} /> Cadastro Principal</h3>
               </div>
               <div className="card-body">
                 <div className="form-grid-2">
                   <div className="form-group">
                     <label className="form-label required">Nome Completo</label>
                     <input className="form-control" name="nome" value={colaborador.nome} onChange={handleChange} required />
                   </div>
                   <div className="form-group">
                     <label className="form-label">CPF (Bloqueado)</label>
                     <input className="form-control" value={colaborador.cpf} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                   </div>
                   <div className="form-group">
                     <label className="form-label">E-mail Pessoal</label>
                     <input className="form-control" name="email" value={colaborador.email || ''} onChange={handleChange} />
                   </div>
                   <div className="form-group">
                     <label className="form-label">Telefone</label>
                     <input className="form-control" name="telefone" value={colaborador.telefone || ''} onChange={handleChange} />
                   </div>
                 </div>
               </div>
             </section>

             {/* Dados Funcionais */}
             <section className="card mt-6">
               <div className="card-header">
                 <h3 className="card-title text-brand"><Briefcase size={18} /> Estrutura Funcional</h3>
               </div>
               <div className="card-body">
                 <div className="form-grid-2">
                   <div className="form-group">
                     <label className="form-label">Matrícula</label>
                     <input className="form-control" name="matricula" value={colaborador.matricula || ''} onChange={handleChange} />
                   </div>
                   <div className="form-group">
                     <label className="form-label">Cargo / Função</label>
                     <input className="form-control" name="cargo" value={colaborador.cargo || ''} onChange={handleChange} />
                   </div>
                   <div className="form-group">
                     <label className="form-label">Departamento</label>
                     <input className="form-control" name="departamento" value={colaborador.departamento || ''} onChange={handleChange} />
                   </div>
                   <div className="form-group">
                     <label className="form-label required">Tipo de Vínculo</label>
                     <select className="form-control" name="tipo_vinculo" value={colaborador.tipo_vinculo} onChange={handleChange}>
                        {Object.entries(TIPO_VINCULO_COLABORADOR_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                     </select>
                   </div>
                   <div className="form-group">
                     <label className="form-label required">Status Funcional</label>
                     <select className="form-control" name="status" value={colaborador.status} onChange={handleChange}>
                        {Object.entries(STATUS_COLABORADOR_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                     </select>
                   </div>
                   <div className="form-group">
                     <label className="form-label required">Data de Admissão</label>
                     <input className="form-control" type="date" name="data_admissao" value={colaborador.data_admissao} onChange={handleChange} />
                   </div>
                 </div>
               </div>
             </section>

             {/* Observações */}
             <section className="card mt-6">
               <div className="card-header">
                 <h3 className="card-title text-brand"><FileText size={18} /> Observações Internas</h3>
               </div>
               <div className="card-body">
                 <textarea 
                    className="form-control" 
                    name="observacoes" 
                    rows={3} 
                    value={colaborador.observacoes || ''} 
                    onChange={handleChange}
                    style={{ resize: 'none' }}
                 />
               </div>
             </section>
          </form>
        </div>

        <aside className="side-content">
          {/* Acesso ao Sistema */}
          <section className="card mb-6">
            <div className="card-header">
              <h3 className="card-title text-brand"><Shield size={18} /> Acesso ao Sistema</h3>
            </div>
            <div className="card-body">
               {colaborador.usuario_id ? (
                 <div>
                   <div className="flex items-center gap-3 mb-4">
                     <div className="avatar-sm">
                       <UserCheck size={18} />
                     </div>
                     <div>
                       <div className="font-bold text-gray-900">{colaborador.usuario?.nome}</div>
                       <div className="text-xs text-muted font-medium uppercase tracking-wider">{colaborador.usuario?.perfil}</div>
                     </div>
                   </div>
                   <div className="badge badge-success w-full justify-center">Conta Ativa</div>
                   <button 
                     className="btn btn-ghost btn-sm w-full mt-4" 
                     onClick={() => handleChange({ target: { name: 'usuario_id', value: '' } } as any)}
                   >
                     Desvincular Usuário
                   </button>
                 </div>
               ) : (
                 <div>
                   <p className="text-sm text-muted mb-4">Colaborador não possui acesso ao sistema.</p>
                   <select 
                      className="form-control" 
                      name="usuario_id" 
                      value={colaborador.usuario_id || ''} 
                      onChange={handleChange}
                   >
                      <option value="">Selecione um usuário...</option>
                      {usuarios?.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                      ))}
                   </select>
                 </div>
               )}
            </div>
          </section>

          {/* Vínculos Operacionais */}
          <section className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="card-title text-brand"><Building2 size={18} /> Operações</h3>
              <button className="btn btn-primary btn-icon btn-xs" onClick={() => setShowVinculoModal(true)}>
                <Plus size={14} />
              </button>
            </div>
            <div className="card-body p-0">
               {colaborador.operacoes && colaborador.operacoes.length > 0 ? (
                 <div className="vinculos-list">
                    {colaborador.operacoes.map(v => (
                       <div key={v.id} className={`vinculo-item ${!v.ativo ? 'inativo' : ''}`}>
                          <div className="flex justify-between items-start">
                             <div>
                               <div className="font-bold text-gray-900">{v.operacao?.nome_operacao}</div>
                               <div className="text-xs text-muted">{v.operacao?.cidade} - {v.operacao?.uf}</div>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="badge-mini">{v.funcao_operacao || 'Colaborador'}</span>
                                  {v.responsavel_principal && <CheckCircle2 size={12} className="text-success" />}
                               </div>
                             </div>
                             <button 
                                className={`btn-icon-link ${v.ativo ? 'text-danger' : 'text-success'}`}
                                onClick={() => handleToggleVinculo(v.id, v.ativo)}
                                title={v.ativo ? 'Encerrar Operação' : 'Reativar Operação'}
                             >
                                <History size={14} />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-6 text-center text-muted italic text-sm">
                    Nenhuma operação vinculada.
                 </div>
               )}
            </div>
          </section>
        </aside>
      </div>

      {/* Modal Novo Vínculo */}
      {showVinculoModal && (
        <div className="modal-overlay" onClick={() => setShowVinculoModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Vincular a Operação</h3>
            </div>
            <form onSubmit={handleAddVinculo}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Operação</label>
                  <select className="form-control" name="operacao_id" required>
                    <option value="">Selecione...</option>
                    {operacoes?.map((op: any) => (
                      <option key={op.id} value={op.id}>{op.nome_operacao}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Função nesta operação</label>
                  <input className="form-control" name="funcao_operacao" defaultValue={colaborador.cargo} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="responsavel_principal" id="resp-check" />
                  <label htmlFor="resp-check" className="form-label" style={{ marginBottom: 0 }}>Responsável Principal?</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVinculoModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Adicionar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .detail-page-content { max-width: 1200px; margin: 0 auto; }
        .detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: flex-start; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .text-brand { color: var(--brand-primary); }
        .avatar-sm { width: 40px; height: 40px; border-radius: 10px; background: var(--brand-primary-bg); color: var(--brand-primary); display: flex; alignItems: center; justifyContent: center; }
        
        .vinculos-list { border-top: 1px solid var(--gray-200); }
        .vinculo-item { padding: 1rem 1.5rem; border-bottom: 1px solid var(--gray-100); transition: 0.2s; }
        .vinculo-item:hover { background: var(--gray-50); }
        .vinculo-item.inativo { opacity: 0.4; filter: grayscale(1); }
        .badge-mini { background: var(--gray-100); color: var(--gray-600); font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr; }
          .side-content { order: -1; }
        }
      `}</style>
    </div>
  );
}
