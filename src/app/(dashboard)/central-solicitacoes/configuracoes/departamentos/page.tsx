'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Building2,
  Check,
  X,
  Palette
} from 'lucide-react';

export default function ConfigDepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepto, setEditingDepto] = useState<any>(null);

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const fetchDepartamentos = async () => {
    setLoading(true);
    // Simulação
    setTimeout(() => {
      setDepartamentos([
        { id: '1', nome: 'TI', descricao: 'Suporte Técnico e Infra', ativo: true, ordem: 1, cor: '#3B82F6', icone: 'Monitor' },
        { id: '2', nome: 'RH', descricao: 'Recursos Humanos', ativo: true, ordem: 2, cor: '#EC4899', icone: 'Users' },
      ]);
      setLoading(false);
    }, 500);
  };

  const openModal = (depto?: any) => {
    setEditingDepto(depto || { nome: '', descricao: '', ativo: true, ordem: 0, cor: '#3B82F6' });
    setModalOpen(true);
  };

  return (
    <div className="config-depto-content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Departamentos</h1>
          <p className="page-subtitle">Setores que recebem e gerenciam as solicitações</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => openModal()} style={{ borderRadius: '12px' }}>
            <Plus size={18} />
            Novo Departamento
          </button>
        </div>
      </div>

      <div className="filters-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Filtrar departamentos..." 
            style={{ borderRadius: '12px', paddingLeft: '2.5rem', height: '44px' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '64px' }}>Cor</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ordem</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {departamentos.map(depto => (
                <tr key={depto.id}>
                  <td>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: depto.cor }}></div>
                  </td>
                  <td className="cell-main">{depto.nome}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{depto.descricao}</td>
                  <td>{depto.ordem}</td>
                  <td>
                    <span className={`badge ${depto.ativo ? 'badge-success' : 'badge-danger'}`}>
                      {depto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary btn-sm" onClick={() => openModal(depto)} style={{ padding: '8px', borderRadius: '10px' }}><Edit2 size={16} /></button>
                      <button className="btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '10px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>{editingDepto.id ? 'Editar' : 'Novo'} Departamento</h3>
              <button className="btn-ghost" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome do Departamento</label>
                  <input type="text" className="form-control" defaultValue={editingDepto.nome} placeholder="Ex: Financeiro" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Descrição</label>
                  <textarea className="form-control" defaultValue={editingDepto.descricao} placeholder="O que este setor atende?" rows={3} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ordem de Exibição</label>
                    <input type="number" className="form-control" defaultValue={editingDepto.ordem} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cor de Identificação</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" className="form-control" defaultValue={editingDepto.cor} style={{ padding: '2px', width: '40px', height: '40px' }} />
                      <span className="cell-sub">{editingDepto.cor}</span>
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={editingDepto.ativo} />
                    <span>Departamento Ativo</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer" style={{ background: 'var(--gray-50)' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" style={{ padding: '0.625rem 2rem' }}>Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
