'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Filter, MoreVertical, Key, AlertCircle, Building2,
  Server, Lock, CheckCircle2, ChevronLeft, Save, X, Edit, Trash2, Cpu,
  ExternalLink, ArrowRight, ShieldCheck, Monitor
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface ChaveTEF {
  id: string;
  operacao_id: string;
  automacao_id: string | null;
  chave: string;
  concentrador: string;
  nome_dispositivo: string;
  anydesk_id: string | null;
  sistema_operacional: string | null;
  status: string;
  observacao: string;
  criado_em: string;
  operacao?: {
    id: string;
    nome_operacao: string;
    codigo_operacao: string;
  };
  automacao?: {
    id: string;
    nome: string;
  };
}

interface OperacaoOption {
  id: string;
  nome_operacao: string;
  codigo_operacao: string;
}

interface AutomacaoOption {
  id: string;
  nome: string;
}

const statusOptions = ['ATIVO', 'INATIVO', 'BLOQUEADO', 'TESTE'];
const concentradorOptions = ['Fiserv / Skytef', 'DTEF / Linx'];

export default function ChavesTEFPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [data, setData] = useState<ChaveTEF[]>([]);
  const [filteredData, setFilteredData] = useState<ChaveTEF[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dependências de Formulário
  const [operacoes, setOperacoes] = useState<OperacaoOption[]>([]);
  const [sistemas, setSistemas] = useState<AutomacaoOption[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentChave, setCurrentChave] = useState<Partial<ChaveTEF> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
    fetchDependencies();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, statusFilter, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tecnologia-ia/chaves-tef');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error('Erro ao carregar dados: ' + json.error);
      }
    } catch (err) {
      toast.error('Erro de conexão ao buscar chaves.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      console.log('Buscando dependências...');
      
      // 1. Tentar via API Auditoria (Recomendado)
      const resOps = await fetch('/api/operacoes');
      let opsResult = [];
      
      if (resOps.ok) {
        const json = await resOps.json();
        opsResult = Array.isArray(json) ? json : [];
      }

      // 2. Fallback direto se a API falhar ou retornar vazio
      if (opsResult.length === 0) {
        const { data: directOps, error: dbError } = await supabase
          .from('operacoes')
          .select('id, nome_operacao, codigo_operacao, status')
          .order('nome_operacao');
        
        if (directOps) opsResult = directOps;
        if (dbError) console.error('Erro na busca direta de operações:', dbError);
      }
      
      console.log('Operações encontradas:', opsResult.length);

      if (opsResult.length > 0) {
        // Filtrar ativas — o enum usa 'ativa'/'inativa' (sem 'o')
        const activeOps = opsResult.filter(op =>
          !op.status || ['ativa', 'ativo'].includes((op.status || '').toLowerCase())
        );

        setOperacoes(activeOps.map(op => ({
          id: op.id,
          nome_operacao: op.nome_operacao,
          codigo_operacao: op.codigo_operacao
        })));
      } else {
        toast.error('Nenhuma operação encontrada no sistema.');
      }
      
      // Carregar Sistemas via API
      const resSys = await fetch('/api/automacoes');
      if (resSys.ok) {
        const sysData = await resSys.json();
        if (Array.isArray(sysData)) setSistemas(sysData);
      } else {
        // Fallback direto
        const { data: sysData } = await supabase
          .from('automacoes_catalogo')
          .select('id, nome')
          .order('nome');
        if (sysData) setSistemas(sysData);
      }
    } catch (err) {
      console.error('Erro crítico ao carregar dependências:', err);
      toast.error('Falha ao conectar com o servidor de dados.');
    }
  };

  const filterData = () => {
    let result = [...data];

    if (statusFilter !== 'ALL') {
      result = result.filter(item => item.status === statusFilter);
    }

    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.chave.toLowerCase().includes(lowSearch) ||
        (item.concentrador || '').toLowerCase().includes(lowSearch) ||
        (item.nome_dispositivo || '').toLowerCase().includes(lowSearch) ||
        item.operacao?.nome_operacao.toLowerCase().includes(lowSearch) ||
        item.operacao?.codigo_operacao.toLowerCase().includes(lowSearch)
      );
    }

    setFilteredData(result);
  };

  const handleOpenModal = (chave: Partial<ChaveTEF> | null = null) => {
    setCurrentChave(chave || { 
      status: 'ATIVO', 
      concentrador: 'Fiserv / Skytef', 
      observacao: '',
      nome_dispositivo: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const method = currentChave?.id ? 'PUT' : 'POST';
      const url = currentChave?.id 
        ? `/api/tecnologia-ia/chaves-tef/${currentChave.id}`
        : '/api/tecnologia-ia/chaves-tef';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentChave),
      });

      if (res.ok) {
        toast.success(currentChave?.id ? 'Chave atualizada!' : 'Chave criada com sucesso!');
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error('Erro ao salvar: ' + err.error);
      }
    } catch (err) {
      toast.error('Erro crítico ao salvar chave.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta chave TEF?')) return;

    try {
      const res = await fetch(`/api/tecnologia-ia/chaves-tef/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Chave removida.');
        fetchData();
      } else {
        toast.error('Erro ao excluir.');
      }
    } catch (err) {
      toast.error('Falha na exclusão.');
    }
  };

  return (
    <div className="app-pwa-container">
      
      {/* HEADER SECTION - App Style */}
      <header className="app-header">
        <div className="header-top">
          <button className="btn-back-circle" onClick={() => router.push('/admin/tecnologia-ia')}>
            <ChevronLeft size={24} />
          </button>
          <div className="header-headings">
            <h1>Chaves TEF</h1>
            <p>Gerenciamento Centralizado de Transações</p>
          </div>
          <div className="header-actions">
            <div className="badge-total">{data.length} Total</div>
          </div>
        </div>

        {/* SEARCH & FILTERS - App Inspired */}
        <div className="app-toolbar">
          <div className="search-pill">
            <Search size={20} className="icon-search" />
            <input 
              type="text" 
              placeholder="Buscar por operação, chave ou dispositivo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-scroll">
            <button 
              className={`chip ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos
            </button>
            {statusOptions.map(st => (
              <button 
                key={st} 
                className={`chip ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="app-content">
        {loading ? (
          <div className="app-loading">
            <div className="spinner"></div>
            <span>Sincronizando dados...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="app-empty">
            <div className="empty-illustration">
              <Key size={64} strokeWidth={1} />
            </div>
            <h3>Nenhum Registro</h3>
            <p>Tente ajustar os filtros ou adicione uma nova chave TEF.</p>
          </div>
        ) : (
          <div className="app-list-grid">
            {filteredData.map((item) => (
              <div key={item.id} className="app-card" onClick={() => handleOpenModal(item)}>
                <div className="card-status-line">
                  <span className={`status-tag st-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
                
                <div className="card-main">
                  <div className="card-icon-box">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="card-info">
                    <div className="card-row-top">
                      <span className="op-badge">{item.operacao?.codigo_operacao || '???'}</span>
                      <h3 className="op-name">{item.operacao?.nome_operacao || 'Operação Selecionada'}</h3>
                    </div>
                    <div className="card-key-row">
                      <Key size={14} />
                      <code>{item.chave}</code>
                    </div>
                    <div className="card-device-row">
                      <Monitor size={14} />
                      <span>{item.nome_dispositivo || 'Dispositivo não inf.'}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="concentrador-info">
                    <Server size={14} />
                    <span>{item.concentrador || 'N/A'} • {item.automacao?.nome || 'Manual'}</span>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn-card-action" 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="btn-card-action delete" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button className="app-fab" onClick={() => handleOpenModal()} title="Novo Registro">
        <Plus size={32} />
      </button>

      {/* MODERN MODAL */}
      {isModalOpen && (
        <div className="app-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="app-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-handle"></div>
            <div className="modal-sheet-header">
              <h2>{currentChave?.id ? 'Editar Chave' : 'Nova Chave TEF'}</h2>
              <button className="btn-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-sheet-content">
              
              {/* DISPOSITIVO - PRIMEIRO CAMPO */}
              <div className="sheet-row">
                <div className="sheet-group">
                  <label>Dispositivo/PDV *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: PDV 01, Checkout 02..."
                    value={currentChave?.nome_dispositivo || ''}
                    onChange={(e) => setCurrentChave({...currentChave, nome_dispositivo: e.target.value})}
                  />
                </div>
              </div>

              {/* OPERAÇÃO E SISTEMA */}
              <div className="sheet-row">
                <div className="sheet-group">
                  <label>Operação *</label>
                  <select 
                    required
                    value={currentChave?.operacao_id || ''}
                    onChange={(e) => setCurrentChave({...currentChave, operacao_id: e.target.value})}
                  >
                    <option value="" disabled>Selecione a Operação...</option>
                    {operacoes.map(op => (
                      <option key={op.id} value={op.id}>{op.nome_operacao}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sheet-grid">
                <div className="sheet-group">
                  <label>Sistema / Automação *</label>
                  <select
                    value={currentChave?.automacao_id || ''}
                    onChange={(e) => setCurrentChave({...currentChave, automacao_id: e.target.value || null})}
                  >
                    <option value="">Selecione o Sistema...</option>
                    {sistemas.map(sys => (
                      <option key={sys.id} value={sys.id}>{sys.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="sheet-group">
                  <label>Status Operacional</label>
                  <select 
                    value={currentChave?.status || 'ATIVO'}
                    onChange={(e) => setCurrentChave({...currentChave, status: e.target.value})}
                  >
                    {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              {/* CONCENTRADOR E CHAVE */}
              <div className="sheet-grid">
                <div className="sheet-group">
                  <label>Concentrador TEF *</label>
                  <select
                    required
                    value={currentChave?.concentrador || 'Fiserv / Skytef'}
                    onChange={(e) => setCurrentChave({...currentChave, concentrador: e.target.value})}
                  >
                    {concentradorOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="sheet-group">
                  <label>Chave de Identificação *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 0001234F"
                    style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                    value={currentChave?.chave || ''}
                    onChange={(e) => setCurrentChave({...currentChave, chave: e.target.value})}
                  />
                </div>
              </div>

              {/* ANYDESK + SISTEMA OPERACIONAL */}
              <div className="sheet-grid">
                <div className="sheet-group">
                  <label>ID AnyDesk</label>
                  <input
                    type="text"
                    placeholder="Ex: 123 456 789"
                    style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                    value={currentChave?.anydesk_id || ''}
                    onChange={(e) => setCurrentChave({...currentChave, anydesk_id: e.target.value || null})}
                  />
                </div>
                <div className="sheet-group">
                  <label>Sistema Operacional</label>
                  <select
                    value={currentChave?.sistema_operacional || ''}
                    onChange={(e) => setCurrentChave({...currentChave, sistema_operacional: e.target.value || null})}
                  >
                    <option value="">Selecione...</option>
                    <option value="Windows">Windows</option>
                    <option value="Linux">Linux</option>
                  </select>
                </div>
              </div>

              <div className="sheet-group">
                <label>Observações / Info Técnica</label>
                <textarea 
                  rows={3}
                  placeholder="Instruções de configuração, portas, IPs..."
                  value={currentChave?.observacao || ''}
                  onChange={(e) => setCurrentChave({...currentChave, observacao: e.target.value})}
                />
              </div>

              <div className="modal-sheet-actions">
                <button type="button" className="btn-app-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-app-primary" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : currentChave?.id ? 'Atualizar Chave' : 'Criar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS APP-FIRST (MANTIDOS) */}
      <style jsx>{`
        .app-pwa-container {
          min-height: 100vh;
          background: #F8F9FE;
          font-family: 'Outfit', sans-serif;
          position: relative;
          padding-bottom: 9rem;
        }

        .app-header {
          background: #FFFFFF;
          padding: 1.5rem 1rem 1rem 1rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn-back-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #F1F4F9;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.2s;
        }

        .header-headings h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          color: #0F172A;
          letter-spacing: -0.5px;
        }
        .header-headings p {
          font-size: 0.85rem;
          color: var(--gray-500);
          margin: 0;
          font-weight: 500;
        }

        .badge-total {
          background: var(--brand-primary-light);
          color: var(--brand-primary);
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .app-toolbar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .search-pill {
          background: #F1F4F9;
          border-radius: 16px;
          padding: 0.25rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          height: 52px;
        }
        .icon-search { color: var(--gray-400); }
        .search-pill input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--gray-800);
          outline: none;
        }

        .filter-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }
        .chip {
          padding: 0.5rem 1.25rem;
          border-radius: 12px;
          background: white;
          border: 1px solid var(--gray-200);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--gray-500);
          white-space: nowrap;
          cursor: pointer;
        }
        .chip.active {
          background: var(--brand-primary);
          color: white;
          border-color: var(--brand-primary);
        }

        .app-content { padding: 1.5rem 1rem; }
        .app-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .app-card {
          background: white;
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          border: 1px solid var(--gray-100);
          cursor: pointer;
          transition: all 0.25s;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card-status-line { display: flex; justify-content: flex-end; }
        .status-tag {
          padding: 0.4rem 0.8rem;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .st-ativo { background: #DCFCE7; color: #166534; }
        .st-inativo { background: #FEE2E2; color: #991B1B; }
        .st-bloqueado { background: #FEF3C7; color: #92400E; }
        .st-teste { background: #E0E7FF; color: #4338CA; }

        .card-main { display: flex; gap: 1rem; }
        .card-icon-box {
          width: 56px; height: 56px;
          background: #F1F4F9; color: var(--brand-primary);
          border-radius: 16px; display: flex; align-items: center; justify-content: center;
        }
        .card-info { flex: 1; min-width: 0; }
        .op-badge { background: #0F172A; color: white; font-weight: 900; font-size: 0.65rem; padding: 2px 6px; border-radius: 6px; }
        .op-name { font-size: 1rem; font-weight: 800; color: #1E293B; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .card-key-row, .card-device-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--gray-500); font-weight: 600; }
        .card-key-row code { background: #F8FAFC; padding: 2px 6px; border-radius: 6px; color: var(--brand-primary-dark); font-family: monospace; }

        .card-footer { border-top: 1px solid var(--gray-50); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .concentrador-info { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: var(--gray-400); }
        .card-actions { display: flex; gap: 0.5rem; }
        .btn-card-action { width: 42px; height: 42px; border-radius: 12px; border: none; background: #F1F4F9; color: var(--gray-600); display: flex; align-items: center; justify-content: center; }

        .app-fab {
          position: fixed; bottom: 7.5rem; right: 1.5rem;
          width: 64px; height: 64px; border-radius: 20px;
          background: var(--brand-primary); color: white; border: none;
          box-shadow: 0 12px 24px rgba(0, 0, 128, 0.4); z-index: 100;
        }

        .app-modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px); z-index: 1100; display: flex; align-items: flex-end; justify-content: center;
        }
        .app-modal-sheet {
          width: 100%; background: white; border-radius: 32px 32px 0 0;
          padding: 1.5rem; max-height: 92vh; overflow-y: auto;
        }
        @media (min-width: 768px) {
          .app-modal-overlay { align-items: center; }
          .app-modal-sheet { width: 750px; border-radius: 28px; }
        }

        .modal-sheet-handle { width: 40px; height: 4px; background: #E2E8F0; border-radius: 10px; margin: 0 auto 1.5rem auto; }
        .modal-sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .btn-modal-close { width: 44px; height: 44px; border-radius: 50%; border: none; background: #F1F4F9; display: flex; align-items: center; justify-content: center; }

        .modal-sheet-content { display: flex; flex-direction: column; gap: 1.5rem; }
        .sheet-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 640px) { .sheet-grid { grid-template-columns: 1fr 1fr; gap: 1.5rem; } }
        .sheet-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .sheet-group label { font-size: 0.75rem; font-weight: 800; color: var(--gray-500); text-transform: uppercase; padding-left: 0.25rem; }
        .sheet-group input, .sheet-group select, .sheet-group textarea {
          background: #F8FAFC; border: 2px solid #F1F5F9; border-radius: 16px;
          padding: 1rem 1.25rem; font-size: 1rem; font-weight: 600; width: 100%;
        }

        .modal-sheet-actions { margin-top: 1rem; display: flex; gap: 1rem; }
        .btn-app-primary { flex: 2; height: 60px; border-radius: 18px; background: var(--brand-primary); color: white; font-weight: 800; border: none; }
        .btn-app-secondary { flex: 1; height: 60px; border-radius: 18px; background: #F1F4F9; color: var(--gray-600); font-weight: 800; border: none; }

        .app-loading, .app-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; }
        .spinner { width: 40px; height: 40px; border: 4px solid #F1F4F9; border-top: 4px solid var(--brand-primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
