'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Edit2, PowerOff, Power,
  Search, RefreshCw, X, Wifi, WifiOff, FileText, CheckCircle, ShieldAlert,
  Users, MapPin, Settings, Download, Cloud, Cpu
} from 'lucide-react';
import {
  Bandeira, TipoOperacao, BANDEIRA_OPTIONS,
  TIPO_OPERACAO_LABELS, UF_OPTIONS
} from '@/types';

const TIPO_OPTIONS: TipoOperacao[] = ['supermercado','shopping','hospital','predio_comercial','estacionamento','outro'];

const emptyForm = {
  nome_operacao: '', codigo_operacao: '', bandeira: 'GPA' as Bandeira,
  tipo_operacao: 'supermercado' as TipoOperacao,
  status: 'ativa',
  // Localização
  cidade: '', uf: 'SP', endereco: '', cep: '',
  // Estrutura
  quantidade_vagas: 0, quantidade_vagas_moto: 0,
  possui_bicicletario: false, vagas_bicicletario: 0,
  recuo_calcada: false, ticket_manual: false, segmento_local: '',
  horario_funcionamento: '', horario_fechamento: '',
  // Segurança e Sinistro
  pernoita_veiculo: false, local_guarda_chaves: '',
  seguro_sinistro: false, possui_manobra: false, manobra_fora_estacionamento: false,
  qtd_cancelas: 0, possui_cftv: false, qtd_cftv: 0,
  // Equipe
  total_escopo_funcionarios: 0, qtd_lideres: 0, qtd_operadores_caixa: 0,
  qtd_operadores_estacionamento: 0, qtd_asg: 0,
  // Benefícios
  direito_assiduidade: false, direito_cesta: false, valor_cesta: 0,
  direito_ticket: false, valor_ticket: 0,
  consumo_bobinas: false, bobinas_tipo_modelo: '',
  // Gestão
  supervisor_id: '', gerente_operacoes_id: '',
  observacoes_operacionais: '', obs_gerente_operacoes: '',
  aprovacao_diretoria: false, evidencia_alteracoes: '', data_encerramento: '',
  // Automação e Integração
  automacao_sistema: '',
  automacao_arquitetura: '', // x86 ou x64
  habilitar_faturamento: false,
  ponto_bat: '',
  script_coleta: '',
  // Campos técnicos/legados para compatibilidade
  id_legado: null,
  slug: '',
  sql_server: '',
  sql_database: '',
  automacao_tipo: '',
  supervisor: null,
  gerente: null
};

export default function AdminOperacoesPage() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [gerentes, setGerentes] = useState<any[]>([]);
  const [automacoes, setAutomacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [filtros, setFiltros] = useState({ busca: '', status: '', bandeira: '' });
  const [activeTab, setActiveTab] = useState('identificacao');
  const [perfilUsuario, setPerfilUsuario] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    const [opsRes, supsRes, gerRes, autRes, sessionRes] = await Promise.all([
      fetch('/api/operacoes').then(r => r.json()),
      fetch('/api/usuarios?perfil=supervisor').then(r => r.json()),
      fetch('/api/usuarios?perfil=gerente_operacoes').then(r => r.json()),
      fetch('/api/automacoes').then(r => r.json()),
      fetch('/api/auth/session').then(r => r.json())
    ]);
    setOperacoes(Array.isArray(opsRes) ? opsRes : []);
    setSupervisores(Array.isArray(supsRes) ? supsRes : []);
    setGerentes(Array.isArray(gerRes) ? gerRes : []);
    setAutomacoes(Array.isArray(autRes) ? autRes : []);
    setPerfilUsuario(sessionRes?.user?.perfil || '');
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const calcScore = (data: any) => {
    let filled = 0, totalFields = 28;
    if (data.nome_operacao) filled++;
    if (data.codigo_operacao) filled++;
    if (data.bandeira) filled++;
    if (data.tipo_operacao) filled++;
    if (data.cidade) filled++;
    if (data.uf) filled++;
    if (data.endereco) filled++;
    if (data.quantidade_vagas > 0) filled++;
    if (data.quantidade_vagas_moto > 0) filled++;
    if (data.supervisor_id) filled++;
    if (data.gerente_operacoes_id) filled++;
    if (data.cep) filled++;
    if (data.horario_funcionamento) filled++;
    if (data.horario_fechamento) filled++;
    if (data.segmento_local) filled++;
    if (data.qtd_cancelas >= 0) filled++;
    if (data.qtd_cftv > 0) filled++;
    if (data.possui_cftv !== undefined) filled++;
    if (data.pernoita_veiculo !== undefined) filled++;
    if (data.seguro_sinistro !== undefined) filled++;
    if (data.possui_manobra !== undefined) filled++;
    if (data.total_escopo_funcionarios > 0) filled++;
    if (data.qtd_lideres > 0) filled++;
    if (data.qtd_operadores_caixa >= 0) filled++;
    if (data.qtd_operadores_estacionamento >= 0) filled++;
    if (data.qtd_asg >= 0) filled++;
    if (data.direito_cesta !== undefined) filled++;
    if (data.direito_ticket !== undefined) filled++;

    return Math.round((filled / totalFields) * 100);
  };

  const abrirModal = (op?: any) => {
    if (op) {
      setEditando(op);
      setFormData({
        ...emptyForm,
        ...op,
        endereco: op.endereco || '',
        cep: op.cep || '',
        observacoes_operacionais: op.observacoes_operacionais || '',
        obs_gerente_operacoes: op.obs_gerente_operacoes || '',
        horario_funcionamento: op.horario_funcionamento || '',
        horario_fechamento: op.horario_fechamento || '',
        segmento_local: op.segmento_local || '',
        local_guarda_chaves: op.local_guarda_chaves || '',
        bobinas_tipo_modelo: op.bobinas_tipo_modelo || '',
        evidencia_alteracoes: op.evidencia_alteracoes || '',
        data_encerramento: op.data_encerramento || '',
        habilitar_faturamento: !!(op.operacoes_automacao?.[0]?.habilitar_faturamento || op.habilitar_faturamento),
        automacao_sistema: op.operacoes_automacao?.[0]?.sistema?.nome || op.automacao_sistema || '',
        automacao_arquitetura: op.operacoes_automacao?.[0]?.arquitetura || op.automacao_arquitetura || '',
        ponto_bat: op.operacoes_automacao?.[0]?.ponto_bat || op.ponto_bat || '',
        script_coleta: op.operacoes_automacao?.[0]?.script_coleta || op.script_coleta || '',
        sql_server: op.operacoes_automacao?.[0]?.sql_server || op.sql_server || '',
        sql_database: op.operacoes_automacao?.[0]?.sql_database || op.sql_database || '',
      });
      console.log('DEBUG: Operação carregada no modal:', op.id, {
        sync_db: op.operacoes_automacao?.[0]?.habilitar_faturamento,
        sync_legado: op.habilitar_faturamento
      });
    } else {
      setEditando(null);
      setFormData(emptyForm);
    }
    setActiveTab('identificacao');
    setShowModal(true);
  };

  const salvar = async () => {
    if (!formData.supervisor_id) { alert('Selecione um supervisor responsável'); return; }
    
    setSaving(true);

    const url = editando ? `/api/operacoes/${editando.id}` : '/api/operacoes';
    const method = editando ? 'PUT' : 'POST';

    // Limpar payload apenas de objetos complexos (arrays/objetos do join) que o banco não aceita na tabela de operações
    const { 
      supervisor, gerente, operacoes_automacao, automacao,
      slug, id_legado,
      ...payload 
    } = formData;

    console.log('DEBUG: Salvando operação...', url, payload);

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        data_encerramento: payload.data_encerramento || null
      }),
    });

    setSaving(false);
    if (res.ok) { setShowModal(false); carregar(); }
    else { const e = await res.json(); alert('Erro: ' + (e.error || 'Falha ao salvar')); }
  };

  const toggleStatus = async (op: any) => {
    const newStatus = op.status === 'ativa' ? 'inativa' : 'ativa';
    await fetch(`/api/operacoes/${op.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    carregar();
  };

  const filtradas = operacoes.filter(o => {
    const busca = filtros.busca.toLowerCase();
    if (busca && !o.nome_operacao.toLowerCase().includes(busca) && !o.codigo_operacao.toLowerCase().includes(busca)) return false;
    if (filtros.status && o.status !== filtros.status) return false;
    if (filtros.bandeira && o.bandeira !== filtros.bandeira) return false;
    return true;
  });

  const temPermissaoEdicao = ['administrador', 'administrativo', 'diretoria', 'ti'].includes(perfilUsuario);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerenciar Operações</h1>
          <p className="page-subtitle">{filtradas.length} operação(ões)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={carregar}><RefreshCw size={14} /> Atualizar</button>
          {temPermissaoEdicao && (
            <button className="btn btn-primary" onClick={() => abrirModal()}><Plus size={16} /> Nova Operação</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="filter-search">
            <Search size={15} className="filter-search-icon" />
            <input placeholder="Buscar por nome ou código..." value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} />
          </div>
          <select className="filter-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
            <option value="">Todos os status</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
          <select className="filter-control" value={filtros.bandeira} onChange={e => setFiltros(p => ({ ...p, bandeira: e.target.value }))}>
            <option value="">Todas as bandeiras</option>
            {BANDEIRA_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Operação</th>
                <th>Preenchimento</th>
                <th>Bandeira</th>
                <th>Cidade/UF</th>
                <th>Vagas</th>
                <th>CFTV</th>
                <th>Supervisor</th>
                <th>Gerente</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="table-empty"><div className="page-loading"><div className="loading-spinner dark" /><span>Carregando...</span></div></td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={10}><div className="table-empty">
                  <Building2 size={40} style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--gray-300)' }} />
                  Nenhuma operação encontrada
                </div></td></tr>
              ) : filtradas.map(o => {
                  const score = calcScore(o);
                  const getScoreColor = (s: number) => {
                    if (s > 80) return 'var(--success)';
                    if (s > 50) return 'var(--warning)';
                    return 'var(--danger)';
                  };
                  return (
                <tr 
                  key={o.id} 
                  onClick={() => abrirModal(o)} 
                  style={{ cursor: 'pointer' }}
                  className="clickable-row"
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{o.nome_operacao}</div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--gray-500)' }}>{o.codigo_operacao}</span>
                    {(!o.supervisor_id || !o.horario_funcionamento) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--warning-dark)', marginTop: '4px' }}>
                        <ShieldAlert size={10} /> Dados críticos faltando
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '100%', maxWidth: '60px', height: '6px', backgroundColor: 'var(--gray-200)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, backgroundColor: getScoreColor(score) }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)' }}>{score}%</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{o.bandeira}</span></td>
                  <td style={{ color: 'var(--gray-500)' }}>{o.cidade}/{o.uf}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{o.quantidade_vagas}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {o.possui_cftv
                        ? <div title={`Sim, ${o.qtd_cftv} câmeras`}><Wifi size={15} color="var(--success)" /></div>
                        : <WifiOff size={15} color="var(--gray-300)" />
                      }
                      {o.seguro_sinistro && (
                        <div title="Possui Seguro"><ShieldAlert size={15} color="#00D284" /></div>
                      )}
                      {o.possui_manobra && (
                        <div title="Possui Manobra"><Building2 size={15} color="#7638FF" /></div>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>{o.supervisor?.nome || <span style={{ color: 'var(--danger)', fontSize: '0.7rem' }}>Não atrelado</span>}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{o.gerente?.nome || '-'}</td>
                  <td>
                    {o.status === 'ativa'
                      ? <span className="badge badge-green"><span className="badge-dot" />Ativa</span>
                      : <span className="badge badge-gray"><span className="badge-dot" />Inativa</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="action-btn" onClick={() => abrirModal(o)} title={temPermissaoEdicao ? "Editar" : "Visualizar"}>
                        {temPermissaoEdicao ? <Edit2 size={15} /> : <Search size={15} />}
                      </button>
                      {temPermissaoEdicao && (
                        <button
                          className={`action-btn ${o.status === 'ativa' ? 'danger' : 'success'}`}
                          onClick={(e) => { e.stopPropagation(); toggleStatus(o); }}
                          title={o.status === 'ativa' ? 'Inativar' : 'Ativar'}
                        >
                          {o.status === 'ativa' ? <PowerOff size={15} /> : <Power size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Multi-Abas */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editando ? (temPermissaoEdicao ? 'Editar Operação' : 'Visualizar Operação') : 'Nova Operação'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            
            <div className="tabs" style={{ padding: '0 1.5rem', borderBottom: '1px solid var(--gray-200)', marginBottom: '1.5rem', background: 'var(--gray-50)', marginTop: '-1rem' }}>
              <button className={`tab-btn ${activeTab === 'identificacao' ? 'active' : ''}`} onClick={() => setActiveTab('identificacao')}><MapPin size={16}/> Identificação</button>
              <button className={`tab-btn ${activeTab === 'estrutura' ? 'active' : ''}`} onClick={() => setActiveTab('estrutura')}><Building2 size={16}/> Estrutura</button>
              <button className={`tab-btn ${activeTab === 'seguranca' ? 'active' : ''}`} onClick={() => setActiveTab('seguranca')}><ShieldAlert size={16}/> Segurança/Sinistro</button>
              <button className={`tab-btn ${activeTab === 'equipe' ? 'active' : ''}`} onClick={() => setActiveTab('equipe')}><Users size={16}/> Equipe/Benefícios</button>
              <button className={`tab-btn ${activeTab === 'automacao' ? 'active' : ''}`} onClick={() => setActiveTab('automacao')}><Cpu size={16}/> Automação</button>
              <button className={`tab-btn ${activeTab === 'gestao' ? 'active' : ''}`} onClick={() => setActiveTab('gestao')}><Settings size={16}/> Governança</button>
            </div>

            <div className="modal-body" style={{ minHeight: '400px' }}>
              {/* ABA: Identificação */}
              {activeTab === 'identificacao' && (
                <div className="form-section">
                  <div className="form-grid form-grid-3">
                    <div className="form-group span-2">
                      <label className="form-label required">Nome da Operação</label>
                      <input className="form-control" value={formData.nome_operacao} onChange={e => setFormData(p => ({ ...p, nome_operacao: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Código</label>
                      <input className="form-control" value={formData.codigo_operacao} onChange={e => setFormData(p => ({ ...p, codigo_operacao: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Bandeira</label>
                      <select className="form-control" value={formData.bandeira} onChange={e => setFormData(p => ({ ...p, bandeira: e.target.value as Bandeira }))} disabled={!temPermissaoEdicao}>
                        {BANDEIRA_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Tipo</label>
                      <select className="form-control" value={formData.tipo_operacao} onChange={e => setFormData(p => ({ ...p, tipo_operacao: e.target.value as TipoOperacao }))} disabled={!temPermissaoEdicao}>
                        {TIPO_OPTIONS.map(t => <option key={t} value={t}>{TIPO_OPERACAO_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-control" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} disabled={!temPermissaoEdicao}>
                        <option value="ativa">Ativa</option>
                        <option value="inativa">Inativa</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Cidade</label>
                      <input className="form-control" value={formData.cidade} onChange={e => setFormData(p => ({ ...p, cidade: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">UF</label>
                      <select className="form-control" value={formData.uf} onChange={e => setFormData(p => ({ ...p, uf: e.target.value }))} disabled={!temPermissaoEdicao}>
                        {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">CEP</label>
                      <input className="form-control" value={formData.cep} onChange={e => setFormData(p => ({ ...p, cep: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group span-3">
                      <label className="form-label">Endereço Completo</label>
                      <input className="form-control" value={formData.endereco} onChange={e => setFormData(p => ({ ...p, endereco: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: Estrutura */}
              {activeTab === 'estrutura' && (
                <div className="form-section">
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label required">Vagas Carro</label>
                      <input className="form-control" type="number" min={0} value={formData.quantidade_vagas} onChange={e => setFormData(p => ({ ...p, quantidade_vagas: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Vagas Moto</label>
                      <input className="form-control" type="number" min={0} value={formData.quantidade_vagas_moto} onChange={e => setFormData(p => ({ ...p, quantidade_vagas_moto: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={formData.possui_bicicletario} onChange={e => setFormData(p => ({ ...p, possui_bicicletario: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Possui Bicicletário?</label>
                    </div>
                    {formData.possui_bicicletario && (
                      <div className="form-group">
                        <label className="form-label">Vagas Bicicletário</label>
                        <input className="form-control" type="number" min={0} value={formData.vagas_bicicletario} onChange={e => setFormData(p => ({ ...p, vagas_bicicletario: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Segmento do Local</label>
                      <input className="form-control" value={formData.segmento_local} onChange={e => setFormData(p => ({ ...p, segmento_local: e.target.value }))} disabled={!temPermissaoEdicao} placeholder="Ex: Premium, Popular..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Horário de Funcionamento</label>
                      <input className="form-control" type="time" value={formData.horario_funcionamento} onChange={e => setFormData(p => ({ ...p, horario_funcionamento: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Horário de Fechamento</label>
                      <input className="form-control" type="time" value={formData.horario_fechamento} onChange={e => setFormData(p => ({ ...p, horario_fechamento: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={formData.recuo_calcada} onChange={e => setFormData(p => ({ ...p, recuo_calcada: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Possui Recuo de Calçada?</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={formData.ticket_manual} onChange={e => setFormData(p => ({ ...p, ticket_manual: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Ticket Manual?</label>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: Segurança */}
              {activeTab === 'seguranca' && (
                <div className="form-section">
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Possui CFTV?</label>
                      <select className="form-control" value={formData.possui_cftv ? 'sim' : 'nao'} onChange={e => setFormData(p => ({ ...p, possui_cftv: e.target.value === 'sim' }))} disabled={!temPermissaoEdicao}>
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                    {formData.possui_cftv && (
                      <div className="form-group">
                        <label className="form-label">Quantidade de Câmeras CFTV</label>
                        <input className="form-control" type="number" min={0} value={formData.qtd_cftv} onChange={e => setFormData(p => ({ ...p, qtd_cftv: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Quantidade de Cancelas</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_cancelas} onChange={e => setFormData(p => ({ ...p, qtd_cancelas: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Seguro para Sinistro?</label>
                      <select className="form-control" value={formData.seguro_sinistro ? 'sim' : 'nao'} onChange={e => setFormData(p => ({ ...p, seguro_sinistro: e.target.value === 'sim' }))} disabled={!temPermissaoEdicao}>
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Local Guarda Chaves</label>
                      <input className="form-control" value={formData.local_guarda_chaves} onChange={e => setFormData(p => ({ ...p, local_guarda_chaves: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={formData.pernoita_veiculo} onChange={e => setFormData(p => ({ ...p, pernoita_veiculo: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Pernoita Veículo?</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.possui_manobra} onChange={e => setFormData(p => ({ ...p, possui_manobra: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Possui Manobra?</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.manobra_fora_estacionamento} onChange={e => setFormData(p => ({ ...p, manobra_fora_estacionamento: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Manobra fora do Estacionamento?</label>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: Equipe */}
              {activeTab === 'equipe' && (
                <div className="form-section">
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label required">Total Escopo Funcionários</label>
                      <input className="form-control" type="number" min={0} value={formData.total_escopo_funcionarios} onChange={e => setFormData(p => ({ ...p, total_escopo_funcionarios: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Líderes</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_lideres} onChange={e => setFormData(p => ({ ...p, qtd_lideres: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Operadores de Caixa</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_operadores_caixa} onChange={e => setFormData(p => ({ ...p, qtd_operadores_caixa: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Operadores Estacionamento</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_operadores_estacionamento} onChange={e => setFormData(p => ({ ...p, qtd_operadores_estacionamento: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">A.S.G.</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_asg} onChange={e => setFormData(p => ({ ...p, qtd_asg: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group span-3" style={{ borderTop: '1px solid var(--gray-200)', marginTop: '1rem', paddingTop: '1rem' }} />
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.direito_assiduidade} onChange={e => setFormData(p => ({ ...p, direito_assiduidade: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Direito à Assiduidade?</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.direito_cesta} onChange={e => setFormData(p => ({ ...p, direito_cesta: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Direito à Cesta?</label>
                    </div>
                    {formData.direito_cesta && (
                      <div className="form-group">
                        <label className="form-label">Valor da Cesta (R$)</label>
                        <input className="form-control" type="number" step="0.01" value={formData.valor_cesta} onChange={e => setFormData(p => ({ ...p, valor_cesta: parseFloat(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.direito_ticket} onChange={e => setFormData(p => ({ ...p, direito_ticket: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Direito à Ticket?</label>
                    </div>
                    {formData.direito_ticket && (
                      <div className="form-group">
                        <label className="form-label">Valor do Ticket (R$)</label>
                        <input className="form-control" type="number" step="0.01" value={formData.valor_ticket} onChange={e => setFormData(p => ({ ...p, valor_ticket: parseFloat(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.consumo_bobinas} onChange={e => setFormData(p => ({ ...p, consumo_bobinas: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Consumo de Bobinas?</label>
                    </div>
                    {formData.consumo_bobinas && (
                      <div className="form-group">
                        <label className="form-label">Tipo/Modelo Bobina</label>
                        <input className="form-control" value={formData.bobinas_tipo_modelo} onChange={e => setFormData(p => ({ ...p, bobinas_tipo_modelo: e.target.value }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA: Automação */}
              {activeTab === 'automacao' && (
                <div className="form-section">
                  <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--brand-primary-light)', borderRadius: '12px', border: '1px solid var(--brand-primary-opacity)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Cpu size={24} color="var(--brand-primary)" />
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-primary-dark)' }}>Configurações de Software</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Selecione o sistema de automação e configure a sincronização automática.</p>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid form-grid-2">
                    <div className="form-group span-2">
                      <label className="form-label required">Sistema de Automação Utilizado</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {automacoes.map(sistema => (
                          <div 
                            key={sistema.id} 
                            onClick={() => temPermissaoEdicao && setFormData(p => ({ ...p, automacao_sistema: sistema.nome }))}
                            style={{ 
                              padding: '1rem', 
                              borderRadius: '10px', 
                              border: `2px solid ${formData.automacao_sistema === sistema.nome ? 'var(--brand-primary)' : 'var(--gray-100)'}`,
                              background: formData.automacao_sistema === sistema.nome ? 'white' : 'var(--gray-50)',
                              cursor: temPermissaoEdicao ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                borderRadius: '50%', 
                                border: `2px solid ${formData.automacao_sistema === sistema.nome ? 'var(--brand-primary)' : 'var(--gray-300)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {formData.automacao_sistema === sistema.nome && <div style={{ width: '8px', height: '8px', background: 'var(--brand-primary)', borderRadius: '50%' }} />}
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: formData.automacao_sistema === sistema.nome ? 'var(--gray-900)' : 'var(--gray-500)' }}>{sistema.nome}</span>
                            </div>
                            {sistema.homologado && <div title="Homologado" style={{ color: 'var(--success)' }}><CheckCircle size={14} /></div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group span-2" style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>Sincronização Automática</div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: 0 }}>Habilitar coleta automática de dados para o faturamento</p>
                        </div>
                        <div 
                          className={`toggle-switch ${formData.habilitar_faturamento ? 'active' : ''}`} 
                          onClick={() => temPermissaoEdicao && setFormData(p => ({ ...p, habilitar_faturamento: !p.habilitar_faturamento }))} 
                          style={{ 
                            cursor: temPermissaoEdicao ? 'pointer' : 'not-allowed',
                            width: '44px',
                            height: '24px',
                            background: formData.habilitar_faturamento ? 'var(--brand-primary)' : 'var(--gray-300)',
                            borderRadius: '12px',
                            position: 'relative',
                            transition: 'all 0.3s'
                          }}
                        >
                          <div style={{ 
                            width: '18px', 
                            height: '18px', 
                            background: 'white', 
                            borderRadius: '50%', 
                            position: 'absolute',
                            top: '3px',
                            left: formData.habilitar_faturamento ? '23px' : '3px',
                            transition: 'all 0.3s'
                          }} />
                        </div>
                      </div>

                      {formData.habilitar_faturamento && (
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-100)' }}>
                          <label className="form-label required">Arquitetura do Servidor Local</label>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>Selecione a arquitetura correta para baixar o agente compatível.</p>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                              { id: 'x86', label: 'Windows x86 (32 bits)' },
                              { id: 'x64', label: 'Windows x64 (64 bits)' }
                            ].map(arq => (
                              <div 
                                key={arq.id}
                                onClick={() => temPermissaoEdicao && setFormData(p => ({ ...p, automacao_arquitetura: arq.id }))}
                                style={{
                                  flex: 1,
                                  padding: '1rem',
                                  borderRadius: '10px',
                                  border: `2px solid ${formData.automacao_arquitetura === arq.id ? 'var(--brand-primary)' : 'var(--gray-100)'}`,
                                  background: formData.automacao_arquitetura === arq.id ? 'white' : 'var(--gray-50)',
                                  cursor: temPermissaoEdicao ? 'pointer' : 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: formData.automacao_arquitetura === arq.id ? 'var(--gray-900)' : 'var(--gray-500)' }}>{arq.label}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            {(() => {
                              const auto = editando?.operacoes_automacao?.[0];
                              const configSalva = editando && 
                                (formData.automacao_sistema || '').trim() === (auto?.sistema?.nome || editando.automacao_sistema || '').trim() &&
                                (formData.automacao_arquitetura || '').trim() === (auto?.arquitetura || editando.automacao_arquitetura || '').trim() &&
                                !!formData.habilitar_faturamento === (!!auto?.habilitar_faturamento || !!editando.habilitar_faturamento);

                              const incompleto = !formData.automacao_sistema || !formData.automacao_arquitetura;

                              if (!editando) {
                                return (
                                  <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px dashed var(--gray-300)', borderRadius: '8px', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                    <ShieldAlert size={16} style={{ marginBottom: '4px' }} /> <br/>
                                    Salve a nova operação para gerar o script.
                                  </div>
                                );
                              }

                              if (incompleto) {
                                return (
                                  <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'var(--warning-light)', border: '1px solid var(--warning-opacity)', borderRadius: '8px', color: 'var(--warning-dark)', fontSize: '0.85rem' }}>
                                    Selecione o Sistema e a Arquitetura para liberar o script.
                                  </div>
                                );
                              }

                              if (!configSalva) {
                                return (
                                  <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'var(--brand-primary-light)', border: '1px solid var(--brand-primary-opacity)', borderRadius: '8px', color: 'var(--brand-primary-dark)', fontSize: '0.85rem' }}>
                                    Clique em "Salvar alterações" abaixo para atualizar o script com as novas seleções.
                                  </div>
                                );
                              }

                              return (
                                <>
                                  <button className="btn btn-secondary" style={{ flex: 1, gap: '8px' }} onClick={() => window.open(`/api/operacoes/${editando.id}/agente-config`, '_blank')}>
                                    <Download size={18} /> Baixar Script (.bat)
                                  </button>
                                  <div style={{ flex: 1.5, background: 'var(--success-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--success-opacity)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--success-dark)', lineHeight: 1.4 }}>
                                      Script pronto para uso! Ele utiliza o ID permanente da unidade para segurança.
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: Gestão e Governança */}
              {activeTab === 'gestao' && (
                <div className="form-section">
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label required">Supervisor Responsável</label>
                      <select className="form-control" value={formData.supervisor_id || ''} onChange={e => setFormData(p => ({ ...p, supervisor_id: e.target.value }))} disabled={!temPermissaoEdicao}>
                        <option value="">Selecione...</option>
                        {supervisores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Gerente de Operações</label>
                      <select className="form-control" value={formData.gerente_operacoes_id || ''} onChange={e => setFormData(p => ({ ...p, gerente_operacoes_id: e.target.value }))} disabled={!temPermissaoEdicao}>
                        <option value="">Selecione...</option>
                        {gerentes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data de Encerramento (se houver)</label>
                      <input className="form-control" type="date" value={formData.data_encerramento} onChange={e => setFormData(p => ({ ...p, data_encerramento: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={formData.aprovacao_diretoria} onChange={e => setFormData(p => ({ ...p, aprovacao_diretoria: e.target.checked }))} disabled={!temPermissaoEdicao} />
                      <label className="form-label" style={{ marginBottom: 0 }}>Aprovação Diretoria?</label>
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Observações Complementares do Processo (Gestor Operações)</label>
                      <textarea className="form-control" value={formData.obs_gerente_operacoes} onChange={e => setFormData(p => ({ ...p, obs_gerente_operacoes: e.target.value }))} rows={2} disabled={!['administrador', 'administrativo', 'diretoria', 'gerente_operacoes'].includes(perfilUsuario)} />
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Observações Administrativas</label>
                      <textarea className="form-control" value={formData.observacoes_operacionais} onChange={e => setFormData(p => ({ ...p, observacoes_operacionais: e.target.value }))} rows={2} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Evidências de Alterações (Cole Links do Drive ou Notas)</label>
                      <textarea className="form-control" value={formData.evidencia_alteracoes} onChange={e => setFormData(p => ({ ...p, evidencia_alteracoes: e.target.value }))} rows={2} disabled={!temPermissaoEdicao} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar / Fechar</button>
              {temPermissaoEdicao && (
                <button className="btn btn-primary" onClick={salvar} disabled={saving}>
                  {saving ? <><span className="loading-spinner" />Salvando...</> : editando ? 'Salvar alterações' : 'Criar operação'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
