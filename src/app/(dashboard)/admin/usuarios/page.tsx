'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Edit2, ToggleLeft, ToggleRight,
  Search, Filter, RefreshCw, XCircle, Eye, EyeOff
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
    <div className="list-page-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">{usuariosFiltrados.length} usuário(s) encontrado(s)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={carregarUsuarios}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={() => abrirModal()}>
            <Plus size={18} /> Novo Usuário
          </button>
        </div>
      </header>

      {/* Strategic Summary (Benchmark: Metas) */}
      <div className="stats-grid">
        {[
          { label: 'Total de Contas', value: usuarios.length, icon: Users, color: 'var(--brand-primary)' },
          { label: 'Contas Ativas', value: usuarios.filter(u => u.ativo).length, icon: ToggleRight, color: 'var(--success)' },
          { label: 'Administradores', value: usuarios.filter(u => u.perfil === 'administrador').length, icon: Edit2, color: 'var(--info)' },
          { label: 'Inativos', value: usuarios.filter(u => !u.ativo).length, icon: XCircle, color: 'var(--danger)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: stat.color, background: `${stat.color}10` }}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Área de Filtros Standard */}
      <section className="filters-card">
        <div className="filters-grid">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              className="form-control search-input"
              placeholder="Buscar por nome ou email..."
              value={filtros.busca}
              onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Perfil</label>
            <select
              className="form-control"
              value={filtros.perfil}
              onChange={e => setFiltros(p => ({ ...p, perfil: e.target.value }))}
            >
              <option value="">Todos os perfis</option>
              {PERFIL_OPTIONS.map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filtros.status}
              onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tabela Standard */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Nome / Email</th>
              <th>Perfil</th>
              <th>Gerente</th>
              <th>Telefone</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="py-20 flex flex-col items-center gap-4">
                    <div className="loading-spinner" />
                    <span className="text-muted font-medium">Carregando usuários...</span>
                  </div>
                </td>
              </tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty py-20">
                    <Users size={48} className="text-muted mb-4 mx-auto" style={{ opacity: 0.3 }} />
                    <div className="text-lg font-bold text-gray-900">Nenhum usuário encontrado</div>
                    <p className="text-muted">Tente ajustar seus filtros de busca.</p>
                  </div>
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-main">{u.nome}</div>
                    <div className="cell-sub">{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{PERFIL_LABELS[u.perfil as Perfil]}</span>
                  </td>
                  <td>
                    <div className="cell-main">{u.gerente?.nome || '-'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.telefone || '-'}</div>
                  </td>
                  <td>
                    {u.ativo ? (
                      <span className="badge badge-success"><span className="badge-dot" />Ativo</span>
                    ) : (
                      <span className="badge badge-danger"><span className="badge-dot" />Inativo</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => abrirModal(u)} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`btn btn-icon btn-sm ${u.ativo ? 'btn-danger' : 'btn-success'}`}
                        style={{ background: u.ativo ? 'var(--danger-bg)' : 'var(--success-bg)', color: u.ativo ? 'var(--danger)' : 'var(--success)' }}
                        onClick={() => toggleAtivo(u)}
                        title={u.ativo ? 'Inativar' : 'Ativar'}
                      >
                        {u.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Standard */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editando ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label required">Nome completo</label>
                  <input className="form-control" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do usuário" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input className="form-control" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {editando ? 'Nova senha (opcional)' : 'Senha de Acesso *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showSenha ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={e => setFormData(p => ({ ...p, senha: e.target.value }))}
                      placeholder={editando ? '••••••••' : 'Mínimo 6 caracteres'}
                      style={{ paddingRight: '3rem' }}
                    />
                    <button type="button" onClick={() => setShowSenha(!showSenha)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input className="form-control" value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Perfil de Acesso</label>
                  <select className="form-control" value={formData.perfil} onChange={e => setFormData(p => ({ ...p, perfil: e.target.value as Perfil }))}>
                    {PERFIL_OPTIONS.map(p => <option key={p} value={p}>{PERFIL_LABELS[p]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status da Conta</label>
                  <select className="form-control" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value, ativo: e.target.value === 'ativo' }))}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                {formData.perfil === 'supervisor' && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Gerente de Operações Responsável</label>
                    <select className="form-control" value={formData.gerente_operacoes_id} onChange={e => setFormData(p => ({ ...p, gerente_operacoes_id: e.target.value }))}>
                      <option value="">Nenhum gerente vinculado</option>
                      {gerentes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving} style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
                {saving ? 'Gravando...' : editando ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
