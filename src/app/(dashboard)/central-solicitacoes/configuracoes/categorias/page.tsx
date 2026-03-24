'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Building2,
  Clock,
  Settings,
  X
} from 'lucide-react';

export default function ConfigCategoriasPage() {
  const [loading, setLoading] = useState(true);
  const [expandedDeptos, setExpandedDeptos] = useState<string[]>(['1']);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<'categoria' | 'subcategoria'>('categoria');

  // Mock
  const deptos = [
    { 
      id: '1', 
      nome: 'TI', 
      categorias: [
        { 
          id: 'c1', 
          nome: 'Sistemas', 
          exige_operacao: 'opcional', 
          sla: 48,
          subcategorias: [
            { id: 's1', nome: 'Acesso / Login' },
            { id: 's2', nome: 'Erro de Processamento' }
          ]
        },
        { 
          id: 'c2', 
          nome: 'Equipamentos', 
          exige_operacao: 'obrigatoria', 
          sla: 8,
          subcategorias: [
            { id: 's3', nome: 'Troca de Teclado/Mouse' },
            { id: 's4', nome: 'Nova Máquina' }
          ]
        }
      ] 
    },
    { id: '2', nome: 'RH', categorias: [] },
  ];

  const toggleDepto = (id: string) => {
    setExpandedDeptos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="config-categorias-content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Categorias e Subcategorias</h1>
          <p className="page-subtitle">Estruture os tipos de solicitações por departamento</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => {setEditingType('categoria'); setModalOpen(true)}} style={{ borderRadius: '12px' }}>
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {deptos.map((depto) => (
          <div key={depto.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div 
              onClick={() => toggleDepto(depto.id)}
              style={{ 
                padding: '1.25rem 1.5rem', 
                background: 'var(--brand-primary-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.125rem', color: 'var(--brand-primary)', fontWeight: 800 }}>{depto.nome}</h3>
                <span className="badge badge-primary">{depto.categorias.length} Categorias</span>
              </div>
              {expandedDeptos.includes(depto.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>

            {expandedDeptos.includes(depto.id) && (
              <div style={{ padding: '0.5rem 0' }}>
                {depto.categorias.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>Sem categorias cadastradas</div>
                ) : (
                  depto.categorias.map(cat => (
                    <div key={cat.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'white' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{cat.nome}</h4>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                            <div className="cell-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              SLA: {cat.sla}h
                            </div>
                            <div className="cell-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Settings size={12} />
                              Operação: {cat.exige_operacao}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn-ghost btn-sm" 
                            style={{ gap: '4px' }}
                            onClick={() => {setEditingType('subcategoria'); setModalOpen(true)}}
                          >
                            <Plus size={14} />
                            Add Sub
                          </button>
                          <button className="btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '8px' }}><Edit2 size={16} /></button>
                          <button className="btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '8px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      
                      {/* Subcategorias */}
                      {cat.subcategorias.length > 0 && (
                        <div style={{ padding: '0 0 1rem 3rem' }}>
                          <div style={{ borderLeft: '2px solid var(--gray-100)' }}>
                            {cat.subcategorias.map(sub => (
                              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', position: 'relative' }}>
                                <div style={{ 
                                  position: 'absolute', 
                                  left: 0, 
                                  top: '50%', 
                                  width: '20px', 
                                  height: '2px', 
                                  background: 'var(--gray-100)' 
                                }}></div>
                                <span style={{ fontWeight: 500, color: 'var(--gray-700)', fontSize: '0.875rem' }}>{sub.nome}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button className="btn-ghost btn-sm" style={{ padding: '4px' }}><Edit2 size={14} /></button>
                                  <button className="btn-ghost btn-sm" style={{ padding: '4px', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Nova {editingType}</h3>
              <button className="btn-ghost" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nome da {editingType}</label>
                <input type="text" className="form-control" placeholder={`Digite o nome da ${editingType}...`} />
              </div>
              {editingType === 'categoria' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Departamento Atribuído</label>
                    <select className="form-control"><option value="">Selecione...</option><option value="1">TI</option></select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Exigência de Operação</label>
                    <select className="form-control"><option value="opcional">Opcional</option><option value="obrigatoria">Obrigatória</option><option value="dispensada">Dispensada</option></select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">SLA de Conclusão (Horas)</label>
                    <input type="number" className="form-control" defaultValue={48} />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer" style={{ background: 'var(--gray-50)' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" style={{ padding: '0.625rem 2rem' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
