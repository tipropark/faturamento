'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { 
  X, Boxes, Save, Plus, Trash2,
  CheckCircle2, XCircle, ChevronRight, Layers, Loader2
} from 'lucide-react';

interface SubcategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: { id: string, nome: string } | null;
}

export default function SubcategoriaModal({ isOpen, onClose, categoria }: SubcategoriaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSubcategoria, setNewSubcategoria] = useState('');

  // Fetch de subcategorias vinculadas à categoria selecionada
  const { data: subcategorias, isLoading } = useSWR(
    isOpen && categoria?.id ? `/api/patrimonio/subcategorias?categoria_id=${categoria.id}` : null, 
    fetcher
  );

  // Limpar formulário ao fechar/trocar categoria
  useEffect(() => {
    if (!isOpen) {
      setNewSubcategoria('');
    }
  }, [isOpen]);

  const handleCreateSubcategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoria || !categoria?.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patrimonio/subcategorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria_id: categoria.id, nome: newSubcategoria })
      });

      if (res.ok) {
        setNewSubcategoria('');
        mutate(`/api/patrimonio/subcategorias?categoria_id=${categoria.id}`);
      } else {
        alert('Erro ao criar subcategoria');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubcategoria = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir a subcategoria "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/patrimonio/subcategorias?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        mutate(`/api/patrimonio/subcategorias?categoria_id=${categoria?.id}`);
      } else {
        alert('Erro ao excluir subcategoria. Verifique se existem ativos vinculados.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-premium" onClick={onClose}>
      <div className="modal-container-premium animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        <header className="modal-header-premium">
          <div className="flex items-center gap-4">
            <div className="section-icon-box" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 className="section-title-premium text-lg">{categoria?.nome}</h3>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gestão de Subcategorias</p>
            </div>
          </div>
          <button className="btn-icon btn-sm" onClick={onClose} style={{ borderRadius: '12px' }}>
            <X size={20} />
          </button>
        </header>

        <main className="modal-body-premium p-8">
          <form className="form-card-premium mb-8 no-shadow border" onSubmit={handleCreateSubcategoria}>
            <div className="premium-form-section">
              <div className="section-header-premium mb-4">
                <h4 className="section-title-premium text-sm">Nova Subcategoria</h4>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="input-premium-group h-[52px]">
                    <input 
                      type="text" 
                      className="input-premium" 
                      placeholder="ex: Laptops, Cadeiras, Monitores..."
                      value={newSubcategoria}
                      onChange={(e) => setNewSubcategoria(e.target.value)}
                      required
                      autoFocus
                    />
                    <Boxes className="input-icon-premium" size={18} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary h-[52px] px-8 font-bold flex gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Adicionar
                </button>
              </div>
            </div>
          </form>

          <div className="subcategorias-list-premium">
            <h4 className="section-title-premium text-xs mb-4 flex items-center gap-2">
              <ChevronRight size={14} className="text-brand-primary" /> itens Cadastrados
            </h4>
            
            <div className="table-responsive max-h-[400px]">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subcategoria</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={3} className="text-center py-12 text-gray-400">Carregando itens...</td></tr>
                  ) : subcategorias?.map((s: any) => (
                    <tr key={s.id} className="table-row-hover">
                      <td className="font-bold py-4 text-sm">{s.nome}</td>
                      <td className="text-center">
                        {s.ativo ? (
                          <span className="badge badge-success text-[10px]">Ativa</span>
                        ) : (
                          <span className="badge badge-danger text-[10px]">Inativa</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleDeleteSubcategoria(s.id, s.nome)}
                          className="btn-delete-table"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subcategorias?.length === 0 && !isLoading && (
                    <tr><td colSpan={3} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px]">Nenhuma subcategoria vinculada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <footer className="modal-footer-premium p-6 border-t flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Fechar Painel</button>
        </footer>

      </div>

      <style jsx>{`
        .modal-overlay-premium {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(12, 12, 36, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-container-premium {
          background: white;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          border-radius: 24px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header-premium {
          padding: 1.5rem 2rem;
          background: #F8F9FA;
          border-bottom: 1px solid #E9ECEF;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .modal-body-premium {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer-premium {
          padding: 1.25rem 2rem;
          border-top: 1px solid #E9ECEF;
          display: flex;
          justify-content: flex-end;
          flex-shrink: 0;
          background: white;
        }

        .no-shadow { box-shadow: none !important; }
      `}</style>
    </div>
  );
}
