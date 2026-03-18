'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Save, RefreshCw, AlertCircle, 
  ChevronRight, Lock, Unlock, Eye, Edit2,
  CheckCircle2, Info, Users, Layout, Copy, 
  Download, Upload, Trash2, Plus, Filter,
  Search, Globe, Building2, UserPlus, Fingerprint
} from 'lucide-react';
import { formatarDataHora } from '@/lib/utils';

// Tipos locais para governança V2
interface PerfilV2 {
  id: string;
  identificador: string;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  eh_modelo: boolean;
  perfil_base_id?: string;
  criado_em: string;
  usuario_criador?: { nome: string };
}

interface ModuloV2 {
  id: string;
  identificador: string;
  nome: string;
  categoria: string;
  descricao?: string;
}

interface PermissaoV2 {
  modulo: string;
  nivel: string;
  escopo: 'global' | 'restrito';
  operacoes_permitidas?: string[];
}

const NIVEIS = [
  { id: 'sem_acesso', label: 'Sem Acesso', color: 'var(--gray-400)' },
  { id: 'visualizacao', label: 'Apenas Ver', color: 'var(--info)' },
  { id: 'criacao', label: 'Criar Novos', color: 'var(--success)' },
  { id: 'edicao', label: 'Editar Existentes', color: 'var(--warning)' },
  { id: 'aprovacao', label: 'Aprovar/Reprovar', color: '#8b5cf6' },
  { id: 'execucao', label: 'Executar (TI)', color: '#ec4899' },
  { id: 'total', label: 'Acesso Total', color: 'var(--brand-primary)' }
];

export default function PermissoesPage() {
  // Dados de Referência
  const [perfis, setPerfis] = useState<PerfilV2[]>([]);
  const [modulos, setModulos] = useState<ModuloV2[]>([]);
  const [operacoes, setOperacoes] = useState<{id: string, nome_operacao: string}[]>([]);
  
  // Estado de Seleção
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilV2 | null>(null);
  const [permissoesAtivas, setPermissoesAtivas] = useState<Record<string, PermissaoV2>>({});
  const [todosAcessos, setTodosAcessos] = useState<any[]>([]);
  const [usuariosDoPerfil, setUsuariosDoPerfil] = useState<any[]>([]);

  // UI Control
  const [activeTab, setActiveTab] = useState<'perfil' | 'matriz' | 'gestao_perfis' | 'usuarios'>('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagens, setMensagens] = useState({ tipo: '', texto: '' });
  const [buscaPerfil, setBuscaPerfil] = useState('');

  // Modais
  const [modalNovoPerfil, setModalNovoPerfil] = useState(false);
  const [modalEscopo, setModalEscopo] = useState<{modulo: string} | null>(null);
  const [modalClone, setModalClone] = useState(false);
  const [modalImpacto, setModalImpacto] = useState<any>(null);
  const [modalAlterarUsuario, setModalAlterarUsuario] = useState<{id: string, nome: string} | null>(null);
  const [novoPerfilUsuario, setNovoPerfilUsuario] = useState('');

  // Formulários Modais
  const [formPerfil, setFormPerfil] = useState({ nome: '', identificador: '', descricao: '', status: 'ativo', eh_modelo: false, perfil_base_id: '' });
  const [formClone, setFormClone] = useState({ origemId: '' });

  // Carregamento Inicial
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resPerfis, resModulos, resOps] = await Promise.all([
        fetch('/api/admin/perfis'),
        fetch('/api/admin/modulos'),
        fetch('/api/operacoes')
      ]);

      const perfisData = await resPerfis.json();
      const modulosData = await resModulos.json();
      const opsData = await resOps.json();

      setPerfis(perfisData);
      setModulos(modulosData);
      setOperacoes(opsData);

      if (!perfilAtivo && perfisData.length > 0) {
        setPerfilAtivo(perfisData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [perfilAtivo]);

  // Carregar Permissões quando Perfil muda
  const carregarPermissoes = useCallback(async () => {
    if (!perfilAtivo) return;
    try {
      if (activeTab === 'perfil') {
        const res = await fetch(`/api/permissoes?perfil=${perfilAtivo.identificador}`);
        const data = await res.json();
        const mapped: Record<string, PermissaoV2> = {};
        
        modulos.forEach(m => {
          const p = data.find((item: any) => item.modulo === m.identificador);
          mapped[m.identificador] = p ? {
            modulo: p.modulo,
            nivel: p.nivel,
            escopo: p.escopo || 'global',
            operacoes_permitidas: p.operacoes_permitidas || []
          } : {
            modulo: m.identificador,
            nivel: 'sem_acesso',
            escopo: 'global',
            operacoes_permitidas: []
          };
        });
        setPermissoesAtivas(mapped);
      } else if (activeTab === 'matriz') {
        const res = await fetch('/api/permissoes?perfil=all');
        const data = await res.json();
        setTodosAcessos(data || []);
      } else if (activeTab === 'usuarios') {
        const res = await fetch(`/api/admin/usuarios-perfil?perfil=${perfilAtivo.identificador}`);
        const data = await res.json();
        setUsuariosDoPerfil(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [perfilAtivo, activeTab, modulos]);

  useEffect(() => { carregarDados(); }, []);
  useEffect(() => { carregarPermissoes(); }, [carregarPermissoes]);

  // Handlers
  const handleSavePerms = async () => {
    if (!perfilAtivo) return;

    // Detecção de impacto administrativo
    if (!modalImpacto && usuariosDoPerfil.length > 0) {
      setModalImpacto({
        tipo: 'save',
        usersCount: usuariosDoPerfil.length,
        profileName: perfilAtivo.nome
      });
      return;
    }

    setSaving(true);
    setModalImpacto(null);
    try {
      const res = await fetch('/api/permissoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil: perfilAtivo.identificador, permissoes: permissoesAtivas }),
      });
      if (res.ok) {
        setMensagens({ tipo: 'success', texto: 'Permissões atualizadas com sucesso!' });
        setTimeout(() => setMensagens({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/perfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPerfil),
      });
      if (res.ok) {
        setModalNovoPerfil(false);
        setFormPerfil({ nome: '', identificador: '', descricao: '', status: 'ativo', eh_modelo: false, perfil_base_id: '' });
        await carregarDados();
        setMensagens({ tipo: 'success', texto: 'Perfil criado com sucesso!' });
      } else {
        const e = await res.json();
        alert(e.error);
      }
    } catch (err) {
      alert('Erro ao criar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    if (!perfilAtivo || !formClone.origemId) return;
    const origem = perfis.find(p => p.id === formClone.origemId);
    if (!origem) return;

    setSaving(true);
    try {
      const res = await fetch('/api/permissoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfilOrigem: origem.identificador, perfilDestino: perfilAtivo.identificador }),
      });
      if (res.ok) {
        setModalClone(false);
        setMensagens({ tipo: 'success', texto: 'Permissões clonadas com sucesso!' });
        await carregarPermissoes();
      }
    } catch (err) {
      alert('Erro ao clonar.');
    } finally {
      setSaving(false);
    }
  };

  const handleAlterarPerfilUsuario = async () => {
    if (!modalAlterarUsuario || !novoPerfilUsuario) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/usuarios-perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: modalAlterarUsuario.id, novoPerfil: novoPerfilUsuario }),
      });
      if (res.ok) {
        setModalAlterarUsuario(null);
        setMensagens({ tipo: 'success', texto: 'Perfil do usuário alterado com sucesso!' });
        await carregarPermissoes(); // Atualiza a lista da aba atual
      }
    } catch (err) {
      alert('Erro ao alterar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const toggleOp = (modulo: string, opId: string) => {
    setPermissoesAtivas(prev => {
      const current = prev[modulo].operacoes_permitidas || [];
      const updated = current.includes(opId) 
        ? current.filter(id => id !== opId)
        : [...current, opId];
      return {
        ...prev,
        [modulo]: { ...prev[modulo], operacoes_permitidas: updated }
      };
    });
  };

  const exportarMatriz = () => {
    const data = perfis.map(p => {
      const pPerms = todosAcessos.filter(pa => pa.perfil === p.identificador);
      const row: any = { Perfil: p.nome };
      modulos.forEach(m => {
        const perm = pPerms.find(pa => pa.modulo === m.identificador);
        row[m.nome] = perm ? perm.nivel : 'sem_acesso';
      });
      return row;
    });

    const headers = ["Perfil", ...modulos.map(m => m.nome)];
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Matriz_Permissoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
       const parsed = JSON.parse(text);
       if (confirm(`Arquivo lido. Deseja aplicar as configurações de permissões contidas no JSON?`)) {
          // Lógica de importação massiva via API poderia ser adicionada aqui
          alert('Funcionalidade de importação requer mapeamento JSON -> API (em desenvolvimento)');
       }
    } catch {
       alert('Erro ao processar arquivo. Verifique o formato JSON.');
    }
  };

  // Helper UI
  const filteredPerfis = perfis.filter(p => 
    p.nome.toLowerCase().includes(buscaPerfil.toLowerCase()) || 
    p.identificador.toLowerCase().includes(buscaPerfil.toLowerCase())
  );

  if (loading && perfis.length === 0) return <div className="page-loading"><div className="loading-spinner dark" /><span>Iniciando Governança de Acessos...</span></div>;

  return (
    <div style={{ maxWidth: '1400px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Governança Integrada de Perfis e Permissões</h1>
          <p className="page-subtitle">Ciclo de vida de perfis, hierarquia de acessos e escopo operacional.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={carregarDados}><RefreshCw size={16} /></button>
          
          {activeTab === 'perfil' && perfilAtivo && (
            <>
              <button className="btn btn-outline" onClick={() => setModalClone(true)}><Copy size={16} /> Clonar</button>
              <button className="btn btn-primary" onClick={handleSavePerms} disabled={saving}>
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />} Salvar Matriz
              </button>
            </>
          )}

          {activeTab === 'gestao_perfis' && (
            <button className="btn btn-primary" onClick={() => setModalNovoPerfil(true)}><Plus size={18} /> Novo Perfil</button>
          )}

          {activeTab === 'matriz' && (
             <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = handleFileUpload;
                  input.click();
                }}><Upload size={16} /> Importar Matriz</button>
                <button className="btn btn-secondary" onClick={exportarMatriz}><Download size={16} /> Exportar CSV</button>
             </div>
          )}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}><ShieldCheck size={18} /> Matriz por Perfil</button>
        <button className={`tab-btn ${activeTab === 'matriz' ? 'active' : ''}`} onClick={() => setActiveTab('matriz')}><Layout size={18} /> Visão Global</button>
        <button className={`tab-btn ${activeTab === 'gestao_perfis' ? 'active' : ''}`} onClick={() => setActiveTab('gestao_perfis')}><Users size={18} /> Ciclo de Perfis</button>
        <button className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}><Fingerprint size={18} /> Usuários p/ Perfil</button>
      </div>

      {mensagens.texto && (
        <div className={`alert alert-${mensagens.tipo}`} style={{ marginBottom: '1.5rem' }}>
          {mensagens.tipo === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {mensagens.texto}
        </div>
      )}

      {/* ÁREA PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'matriz' || activeTab === 'gestao_perfis' ? '1fr' : '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Sidebar */}
        {(activeTab === 'perfil' || activeTab === 'usuarios') && (
          <div className="card shadow-sm" style={{ padding: '0.5rem' }}>
            <div className="form-group" style={{ padding: '0.75rem' }}>
              <div className="input-with-icon">
                <Search size={14} /><input className="form-control form-control-sm" placeholder="Buscar perfil..." value={buscaPerfil} onChange={e => setBuscaPerfil(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '600px', overflowY: 'auto' }}>
              {filteredPerfis.map(p => (
                <button key={p.id} className={`sidebar-link ${perfilAtivo?.id === p.id ? 'active' : ''}`} onClick={() => setPerfilAtivo(p)} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.status === 'ativo' ? (p.eh_modelo ? '#8b5cf6' : 'var(--brand-primary)') : 'var(--gray-300)', marginRight: '0.75rem' }} />
                  <span style={{ flex: 1 }}>{p.nome}</span>
                  {p.eh_modelo && <span style={{ fontSize: '0.6rem', padding: '1px 4px', backgroundColor: '#8b5cf620', color: '#8b5cf6', borderRadius: '4px', fontWeight: 700 }}>MODELO</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="content-area">
          {activeTab === 'perfil' && perfilAtivo && (
            <div className="card shadow-sm">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Matriz: {perfilAtivo.nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>ID: {perfilAtivo.identificador}</div>
              </div>
              <div className="card-body" style={{ padding: '0' }}>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th style={{ width: '35%' }}>Módulo</th><th>Nível de Acesso</th><th style={{ width: '120px', textAlign: 'center' }}>Escopo</th></tr></thead>
                    <tbody>
                      {modulos.map(m => {
                        const perm = permissoesAtivas[m.identificador] || { nivel: 'sem_acesso', escopo: 'global' };
                        return (
                          <tr key={m.id}>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: perm.nivel === 'sem_acesso' ? 'var(--gray-100)' : 'var(--brand-primary-light)', color: perm.nivel === 'sem_acesso' ? 'var(--gray-400)' : 'var(--brand-primary)' }}>
                                  {perm.nivel === 'sem_acesso' ? <Lock size={18} /> : <ShieldCheck size={18} />}
                                </div>
                                <div><div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.875rem' }}>{m.nome}</div><div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{m.categoria}</div></div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {NIVEIS.map(n => (
                                  <button key={n.id} onClick={() => setPermissoesAtivas(prev => ({ ...prev, [m.identificador]: { ...prev[m.identificador], nivel: n.id } }))} className={`badge ${perm.nivel === n.id ? '' : 'badge-outline'}`} style={{ cursor: 'pointer', fontSize: '0.675rem', padding: '0.35rem 0.6rem', border: `1px solid ${n.color}`, backgroundColor: perm.nivel === n.id ? n.color : 'transparent', color: perm.nivel === n.id ? 'white' : n.color, fontWeight: perm.nivel === n.id ? 700 : 500 }}>{n.label}</button>
                                ))}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button className={`btn ${perm.escopo === 'restrito' ? 'btn-primary' : 'btn-ghost'} btn-xs`} onClick={() => setModalEscopo({ modulo: m.identificador })} disabled={perm.nivel === 'sem_acesso'} style={{ gap: '4px' }}>
                                {perm.escopo === 'restrito' ? <Building2 size={14} /> : <Globe size={14} />}{perm.escopo === 'restrito' ? 'Op.' : 'Glob.'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matriz' && (
            <div className="card shadow-sm">
                <div className="card-header"><div className="card-title">Matriz Comparativa de Governança</div></div>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                  <table className="table table-sm">
                    <thead><tr><th style={{ position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 20, minWidth: '180px', borderRight: '1px solid var(--gray-200)' }}>Perfil \ Módulo</th>{modulos.map(m => <th key={m.id} style={{ textAlign: 'center', fontSize: '0.65rem' }}>{m.nome.split(' ')[0]}</th>)}</tr></thead>
                    <tbody>
                      {perfis.map(p => (
                        <tr key={p.id} onClick={() => { setPerfilAtivo(p); setActiveTab('perfil'); }} style={{ cursor: 'pointer' }}>
                          <td style={{ position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10, fontWeight: 700, borderRight: '1px solid var(--gray-200)', fontSize: '0.8125rem' }}>{p.nome} {p.status === 'inativo' && <span style={{ color: 'var(--danger)', fontSize: '0.6rem' }}>(OFF)</span>}</td>
                          {modulos.map(m => {
                            const found = todosAcessos.find(a => a.perfil === p.identificador && a.modulo === m.identificador);
                            const nivel = NIVEIS.find(n => n.id === (found?.nivel || 'sem_acesso'));
                            return (
                              <td key={m.id} style={{ textAlign: 'center', padding: '0.4rem' }}>
                                <div style={{ fontSize: '0.6rem', color: nivel?.color, fontWeight: 700, padding: '2px 4px', backgroundColor: nivel?.color + '15', borderRadius: '4px' }}>{nivel?.label.split(' ')[0]}</div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )}

          {activeTab === 'gestao_perfis' && (
            <div className="card shadow-sm">
              <div className="card-header"><div className="card-title">Diretório de Perfis</div></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Perfil</th><th>ID</th><th>Tipo</th><th>Status</th><th>Criação</th><th style={{ width: '100px' }}>Ações</th></tr></thead>
                  <tbody>
                    {perfis.map(p => (
                      <tr key={p.id}>
                        <td><div style={{ fontWeight: 700 }}>{p.nome}</div><div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.descricao || 'Sem descrição'}</div></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{p.identificador}</td>
                        <td>{p.eh_modelo ? <span className="badge" style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>Modelo</span> : <span className="badge badge-gray">Operacional</span>}</td>
                        <td><span className={`badge-dot ${p.status === 'ativo' ? 'bg-success' : 'bg-gray-300'}`} /><span style={{ marginLeft: '4px', textTransform: 'capitalize' }}>{p.status}</span></td>
                        <td style={{ fontSize: '0.75rem' }}>{formatarDataHora(p.criado_em)}</td>
                        <td><button className="btn btn-ghost btn-xs" onClick={() => { setPerfilAtivo(p); setActiveTab('perfil'); }}><Edit2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && perfilAtivo && (
            <div className="card shadow-sm">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div className="card-title">Membros vinculados: {perfilAtivo.nome}</div><div className="badge badge-primary">{usuariosDoPerfil.length} usuários</div></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Nome</th><th>Email</th><th>Status</th><th style={{ width: '120px' }}>Ações</th></tr></thead>
                  <tbody>
                    {usuariosDoPerfil.length === 0 ? (
                      <tr><td colSpan={4} className="table-empty">Nenhum usuário vinculado.</td></tr>
                    ) : usuariosDoPerfil.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.nome}</td><td style={{ color: 'var(--gray-500)' }}>{u.email}</td><td><span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                        <td><button className="btn btn-outline btn-xs" onClick={() => { setModalAlterarUsuario(u); setNovoPerfilUsuario(perfilAtivo.identificador); }} style={{ gap: '4px' }}><Filter size={12} /> Alterar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOVO PERFIL */}
      {modalNovoPerfil && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header"><div className="card-title">Novo Perfil de Governança</div></div>
            <div className="card-body">
              <div className="form-group"><label className="form-label">Nome de Exibição</label><input className="form-control" value={formPerfil.nome} onChange={e => setFormPerfil({...formPerfil, nome: e.target.value})} placeholder="Ex: Supervisor Senior Financeiro" /></div>
              <div className="form-group" style={{ marginTop: '1rem' }}><label className="form-label">Identificador (CamelCase)</label><input className="form-control" value={formPerfil.identificador} onChange={e => setFormPerfil({...formPerfil, identificador: e.target.value})} placeholder="Ex: supervisor_financeiro" /></div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem' }}><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formPerfil.eh_modelo} onChange={e => setFormPerfil({...formPerfil, eh_modelo: e.target.checked})} /><span style={{ fontSize: '0.875rem' }}>Perfil Modelo</span></label></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button className="btn btn-ghost" onClick={() => setModalNovoPerfil(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreateProfile} disabled={!formPerfil.nome || !formPerfil.identificador || saving}>Criar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR PERFIL USUÁRIO */}
      {modalAlterarUsuario && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
             <div className="card-header"><div className="card-title">Redefinir Acesso</div></div>
             <div className="card-body">
                <p style={{ fontSize: '0.875rem' }}>Novo perfil para <strong>{modalAlterarUsuario.nome}</strong>.</p>
                <div className="form-group" style={{ marginTop: '1rem' }}><label className="form-label">Selecione o Cargo</label><select className="form-control" value={novoPerfilUsuario} onChange={e => setNovoPerfilUsuario(e.target.value)}>{perfis.map(p => <option key={p.id} value={p.identificador}>{p.nome}</option>)}</select></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}><button className="btn btn-ghost" onClick={() => setModalAlterarUsuario(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleAlterarPerfilUsuario} disabled={saving}>Confirmar</button></div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPACT PREVIEW */}
      {modalImpacto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ width: '100%', maxWidth: '450px', borderTop: '4px solid var(--warning)' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><AlertCircle style={{ color: 'var(--warning)' }} /><div className="card-title">Resumo de Impacto</div></div>
            <div className="card-body">
              <p style={{ fontSize: '0.9rem' }}>Mudanças estruturais afetarão:</p>
              <div style={{ margin: '1rem 0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}><span>Usuários</span><span className="badge badge-warning">{modalImpacto.usersCount}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px', marginTop: '0.5rem' }}><span>Perfil</span><span>{modalImpacto.profileName}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}><button className="btn btn-ghost" onClick={() => setModalImpacto(null)}>Revisar</button><button className="btn btn-primary" onClick={handleSavePerms}>Confirmar e Aplicar</button></div>
            </div>
          </div>
        </div>
      )}

      {/* CLONE Y ESCOPO MODALS */}
      {modalClone && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header"><div className="card-title">Clonagem de Estrutura</div></div>
            <div className="card-body">
              <div className="form-group"><label className="form-label">Origem</label><select className="form-control" value={formClone.origemId} onChange={e => setFormClone({origemId: e.target.value})}><option value="">Selecione...</option>{perfis.filter(p => p.id !== perfilAtivo?.id).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}><button className="btn btn-ghost" onClick={() => setModalClone(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleClone} disabled={!formClone.origemId || saving}>Confirmar</button></div>
            </div>
          </div>
        </div>
      )}

      {modalEscopo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header"><div className="card-title">Escopo: {modulos.find(m => m.identificador === modalEscopo.modulo)?.nome}</div></div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div className="form-group"><div style={{ display: 'flex', gap: '1rem' }}><label className={`btn btn-sm ${permissoesAtivas[modalEscopo.modulo].escopo === 'global' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}><input type="radio" style={{ display: 'none' }} checked={permissoesAtivas[modalEscopo.modulo].escopo === 'global'} onChange={() => setPermissoesAtivas(p => ({...p, [modalEscopo.modulo]: {...p[modalEscopo.modulo], escopo: 'global'}}))} /><Globe size={14} /> Global</label><label className={`btn btn-sm ${permissoesAtivas[modalEscopo.modulo].escopo === 'restrito' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}><input type="radio" style={{ display: 'none' }} checked={permissoesAtivas[modalEscopo.modulo].escopo === 'restrito'} onChange={() => setPermissoesAtivas(p => ({...p, [modalEscopo.modulo]: {...p[modalEscopo.modulo], escopo: 'restrito'}}))} /><Filter size={14} /> Restrito</label></div></div>
              {permissoesAtivas[modalEscopo.modulo].escopo === 'restrito' && (
                <div style={{ marginTop: '1.5rem' }}><label className="form-label">Unidades/Operações</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>{operacoes.map(op => { const sel = (permissoesAtivas[modalEscopo.modulo].operacoes_permitidas || []).includes(op.id); return (<button key={op.id} className={`btn btn-xs ${sel ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleOp(modalEscopo.modulo, op.id)} style={{ justifyContent: 'flex-start' }}>{op.nome_operacao}</button>);})}</div>
                </div>
              )}
            </div>
            <div className="card-footer" style={{ borderTop: '1px solid var(--gray-100)', padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={() => setModalEscopo(null)}>Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
