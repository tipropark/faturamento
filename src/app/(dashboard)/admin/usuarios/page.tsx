'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Edit2, ToggleLeft, ToggleRight,
  Search, Filter, RefreshCw, X, Eye, EyeOff
} from 'lucide-react';
import { Usuario, Perfil, PERFIL_LABELS, StatusUsuario } from '@/types';

const PERFIL_OPTIONS: Perfil[] = [
  'administrador','diretoria','gerente_operacoes','supervisor',
  'analista_sinistro','financeiro','rh','dp','auditoria','ti','administrativo'
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [gerentes, setGerentes] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({ busca: '', perfil: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', perfil: 'supervisor' as Perfil,
    telefone: '', status: 'ativo', ativo: true, gerente_operacoes_id: ''
  });
  const [showSenha, setShowSenha] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsuarios(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const carregarGerentes = useCallback(async () => {
    const res = await fetch('/api/usuarios?perfil=gerente_operacoes');
    const data = await res.json();
    setGerentes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    carregarUsuarios();
    carregarGerentes();
  }, [carregarUsuarios, carregarGerentes]);

  const abrirModal = (usuario?: any) => {
    if (usuario) {
      setEditando(usuario);
      setFormData({
        nome: usuario.nome, email: usuario.email, senha: '',
        perfil: usuario.perfil, telefone: usuario.telefone || '',
        status: usuario.status, ativo: usuario.ativo,
        gerente_operacoes_id: usuario.gerente_operacoes_id || ''
      });
    } else {
      setEditando(null);
      setFormData({ nome: '', email: '', senha: '', perfil: 'supervisor', telefone: '', status: 'ativo', ativo: true, gerente_operacoes_id: '' });
    }
    setShowModal(true);
  };

  const salvar = async () => {
    setSaving(true);
    const payload: any = { ...formData };
    if (!payload.senha) delete payload.senha;
    if (!payload.gerente_operacoes_id) payload.gerente_operacoes_id = null;

    const url = editando ? `/api/usuarios/${editando.id}` : '/api/usuarios';
    const method = editando ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      setShowModal(false);
      carregarUsuarios();
    } else {
      const err = await res.json();
      alert('Erro: ' + (err.error || 'Falha ao salvar'));
    }
  };

  const toggleAtivo = async (usuario: any) => {
    await fetch(`/api/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !usuario.ativo, status: !usuario.ativo ? 'ativo' : 'inativo' }),
    });
    carregarUsuarios();
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const busca = filtros.busca.toLowerCase();
    if (busca && !u.nome.toLowerCase().includes(busca) && !u.email.toLowerCase().includes(busca)) return false;
    if (filtros.perfil && u.perfil !== filtros.perfil) return false;
    if (filtros.status === 'ativo' && !u.ativo) return false;
    if (filtros.status === 'inativo' && u.ativo) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">{usuariosFiltrados.length} usuário(s) encontrado(s)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={carregarUsuarios}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={() => abrirModal()}>
            <Plus size={16} /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="card">
        {/* Filtros */}
        <div className="filters-bar">
          <div className="filter-search">
            <Search size={15} className="filter-search-icon" />
            <input
              placeholder="Buscar por nome ou email..."
              value={filtros.busca}
              onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))}
            />
          </div>
          <select
            className="filter-control"
            value={filtros.perfil}
            onChange={e => setFiltros(p => ({ ...p, perfil: e.target.value }))}
          >
            <option value="">Todos os perfis</option>
            {PERFIL_OPTIONS.map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
          </select>
          <select
            className="filter-control"
            value={filtros.status}
            onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Gerente</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-empty">
                  <div className="page-loading"><div className="loading-spinner dark" /><span>Carregando...</span></div>
                </td></tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={7}><div className="table-empty">
                  <Users size={40} style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--gray-300)' }} />
                  <div>Nenhum usuário encontrado</div>
                </div></td></tr>
              ) : usuariosFiltrados.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{u.nome}</div>
                  </td>
                  <td style={{ color: 'var(--gray-500)' }}>{u.email}</td>
                  <td>
                    <span className="badge badge-blue">{PERFIL_LABELS[u.perfil as Perfil]}</span>
                  </td>
                  <td style={{ color: 'var(--gray-500)' }}>
                    {u.gerente?.nome || '-'}
                  </td>
                  <td style={{ color: 'var(--gray-500)' }}>{u.telefone || '-'}</td>
                  <td>
                    {u.ativo ? (
                      <span className="badge badge-green"><span className="badge-dot" />Ativo</span>
                    ) : (
                      <span className="badge badge-red"><span className="badge-dot" />Inativo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="action-btn" onClick={() => abrirModal(u)} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`action-btn ${u.ativo ? 'danger' : 'success'}`}
                        onClick={() => toggleAtivo(u)}
                        title={u.ativo ? 'Inativar' : 'Ativar'}
                      >
                        {u.ativo ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editando ? 'Editar Usuário' : 'Novo Usuário'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label required">Nome completo</label>
                  <input className="form-control" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do usuário" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input className="form-control" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
                </div>
                <div className="form-group">
                  <label className="form-label required={!editando}">
                    {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={e => setFormData(p => ({ ...p, senha: e.target.value }))}
                      placeholder={editando ? '••••••••' : 'Mínimo 6 caracteres'}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button type="button" onClick={() => setShowSenha(!showSenha)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
                      {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-control" value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Perfil</label>
                  <select className="form-control" value={formData.perfil} onChange={e => setFormData(p => ({ ...p, perfil: e.target.value as Perfil }))}>
                    {PERFIL_OPTIONS.map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value, ativo: e.target.value === 'ativo' }))}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                {formData.perfil === 'supervisor' && (
                  <div className="form-group span-2">
                    <label className="form-label">Gerente de Operações</label>
                    <select className="form-control" value={formData.gerente_operacoes_id} onChange={e => setFormData(p => ({ ...p, gerente_operacoes_id: e.target.value }))}>
                      <option value="">Nenhum</option>
                      {gerentes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>
                {saving ? <><span className="loading-spinner" />Salvando...</> : editando ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
