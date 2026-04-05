'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { 
  Plus, Tag, ChevronLeft, Layers, Boxes, Edit2, Trash2, 
  CheckCircle2, XCircle, Search, ExternalLink, Loader2
} from 'lucide-react';
import Link from 'next/link';
import SubcategoriaModal from '@/components/patrimonio/SubcategoriaModal';

export default function PatrimonioCategoriasPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoria, setNewCategoria] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<{ id: string, nome: string } | null>(null);

  // Fetch de dados (Categorias)
  const { data: categorias, isLoading: isLoadingCategorias } = useSWR('/api/patrimonio/categorias', fetcher);

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoria) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patrimonio/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newCategoria })
      });

      if (res.ok) {
        setNewCategoria('');
        mutate('/api/patrimonio/categorias');
      } else {
        alert('Erro ao criar categoria');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSubcategorias = (categoria: { id: string, nome: string }) => {
    setCategoriaSelecionada(categoria);
    setIsModalOpen(true);
  };

  return (
    <div className="page-container premium-page">
      <header className="page-header mb-12">
        <div className="flex items-center gap-6 justify-between w-full">
          <div className="flex items-center gap-6">
            <Link href="/admin/patrimonio" className="btn-icon btn-sm" style={{ borderRadius: '14px', background: '#fff' }}>
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 950 }}>Configurações de Patrimônio</h1>
              <p className="page-subtitle font-bold uppercase text-[10px] tracking-widest text-gray-400">Gerenciar Categorias e Itens</p>
            </div>
          </div>
          
          <div className="flex bg-[#F1F4F9] p-2 rounded-[18px]">
              <div className="tab-premium active px-6 py-3 font-bold text-sm bg-white rounded-[14px] shadow-sm">Configuração Geral</div>
              <div className="tab-premium px-6 py-3 font-bold text-sm text-gray-400 opacity-60">Logs de Auditoria</div>
          </div>
        </div>
      </header>

      <div className="grid grid-3 gap-10 items-start" style={{ marginTop: '2.5rem' }}>
        {/* COLUNA 1: FORMULÁRIO DE CATEGORIA */}
        <div className="col-span-1 pr-4">
          <form className="form-card-premium" onSubmit={handleCreateCategoria}>
            <div className="premium-form-section p-8">
              <div className="section-header-premium mb-8">
                <div className="section-icon-box" style={{ background: '#0C0C24', color: 'white' }}>
                  <Layers size={20} />
                </div>
                <div>
                    <h3 className="section-title-premium text-lg">Nova Categoria</h3>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Classificação do ativo</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="input-premium-group">
                  <input 
                    type="text" 
                    className="input-premium" 
                    placeholder="Ex: Eletrônicos, Mobiliário..."
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    required
                  />
                  <Tag className="input-icon-premium" size={20} />
                </div>

                <div className="bg-[#F8F9FA] p-5 rounded-[16px] text-[11px] text-gray-500 font-bold leading-relaxed border border-dashed">
                   Atenção: Categorias bem definidas facilitam o controle de faturamento imobilizado.
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-premium-save w-full">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Criar Categoria
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* COLUNA 2: LISTAGEM DE CATEGORIAS */}
        <div className="col-span-2">
          <div className="form-card-premium">
            <div className="premium-form-section p-8">
              <div className="flex items-center justify-between mb-8">
                  <h4 className="section-title-premium text-lg">Categorias Cadastradas</h4>
                  <div className="flex gap-2">
                      <div className="input-premium-group h-10" style={{ minWidth: '240px' }}>
                          <input type="text" placeholder="Filtrar categorias..." className="input-premium h-10 py-0 pl-10 text-xs" />
                          <Search size={14} className="input-icon-premium" />
                      </div>
                  </div>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingBottom: '1.5rem' }}>Nome da Categoria</th>
                      <th className="text-center" style={{ paddingBottom: '1.5rem' }}>Status</th>
                      <th className="text-right" style={{ paddingBottom: '1.5rem' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingCategorias ? (
                      <tr><td colSpan={3} className="text-center py-12 text-gray-400">Carregando categorias...</td></tr>
                    ) : categorias?.map((c: any) => (
                      <tr key={c.id} className="table-row-hover">
                        <td className="font-bold py-6">{c.nome}</td>
                        <td className="text-center">
                          <span className={`badge badge-${c.ativo ? 'success' : 'danger'} px-4 py-2 rounded-[12px] text-[10px] font-black uppercase tracking-wider`}>
                            {c.ativo ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => openSubcategorias(c)}
                            className="btn btn-detail-table"
                          >
                            <Boxes size={14} /> Subcategorias
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categorias?.length === 0 && !isLoadingCategorias && (
                      <tr><td colSpan={3} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px]">Nenhum registro encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPONENTE DE MODAL MODERNO */}
      <SubcategoriaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categoria={categoriaSelecionada} 
      />

      <style jsx global>{`
        .premium-page {
          animation: pageIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-premium { cursor: pointer; transition: all 0.2s; }
        .tab-premium.active:hover { transform: translateY(-1px); }
        .tab-premium:not(.active):hover { opacity: 1; color: var(--brand-primary); }
      `}</style>
    </div>
  );
}
