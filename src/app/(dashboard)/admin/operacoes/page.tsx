'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Edit2, PowerOff, Power,
  Search, RefreshCw, X, Wifi, WifiOff, FileText, CheckCircle, ShieldAlert,
  Users, MapPin, Settings, Download, Cloud, Cpu,
  Clock, Layout, ShieldCheck, AlertCircle, Database, History, Map as MapIcon
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
          <p className="page-subtitle">{filtradas.length} unidade(s) operacionais</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm btn-icon" onClick={carregar} title="Atualizar">
            <RefreshCw size={16} />
          </button>
          {temPermissaoEdicao && (
            <button className="btn btn-primary btn-sm" onClick={() => abrirModal()}>
              <Plus size={18} /> Nova Unidade
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="filter-search" style={{ flex: 1.5 }}>
            <Search size={14} />
            <input 
              className="form-control"
              placeholder="Buscar por unidade, código ou supervisor..." 
              value={filtros.busca} 
              onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} 
            />
          </div>
          <select className="form-control" style={{ maxWidth: '180px' }} value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
            <option value="">Status (Todos)</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
          <select className="form-control" style={{ maxWidth: '180px' }} value={filtros.bandeira} onChange={e => setFiltros(p => ({ ...p, bandeira: e.target.value }))}>
            <option value="">Bandeiras</option>
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
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-xs btn-icon" onClick={() => abrirModal(o)} title={temPermissaoEdicao ? "Editar" : "Visualizar"}>
                        {temPermissaoEdicao ? <Edit2 size={14} /> : <Search size={14} />}
                      </button>
                      {temPermissaoEdicao && (
                        <button
                          className={`btn btn-ghost btn-xs btn-icon ${o.status === 'ativa' ? 'text-danger' : 'text-success'}`}
                          onClick={(e) => { e.stopPropagation(); toggleStatus(o); }}
                          title={o.status === 'ativa' ? 'Inativar' : 'Ativar'}
                        >
                          {o.status === 'ativa' ? <PowerOff size={14} /> : <Power size={14} />}
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
            
            <div className="tabs-container" style={{ padding: '0.25rem 1rem', borderBottom: '1px solid var(--gray-100)', background: 'white' }}>
              <button className={`tab-item ${activeTab === 'identificacao' ? 'active' : ''}`} onClick={() => setActiveTab('identificacao')}><MapPin size={18}/> Identificação</button>
              <button className={`tab-item ${activeTab === 'estrutura' ? 'active' : ''}`} onClick={() => setActiveTab('estrutura')}><Building2 size={18}/> Estrutura</button>
              <button className={`tab-item ${activeTab === 'seguranca' ? 'active' : ''}`} onClick={() => setActiveTab('seguranca')}><ShieldAlert size={18}/> Segurança</button>
              <button className={`tab-item ${activeTab === 'equipe' ? 'active' : ''}`} onClick={() => setActiveTab('equipe')}><Users size={18}/> Equipe</button>
              <button className={`tab-item ${activeTab === 'automacao' ? 'active' : ''}`} onClick={() => setActiveTab('automacao')}><Cpu size={18}/> Automação</button>
              <button className={`tab-item ${activeTab === 'gestao' ? 'active' : ''}`} onClick={() => setActiveTab('gestao')}><Settings size={18}/> Governança</button>
            </div>

            <div className="modal-body" style={{ minHeight: '400px' }}>
              {/* ABA: Identificação */}
              {activeTab === 'identificacao' && (
                <div className="form-section">
                  <div className="form-section-title">
                    <MapPin size={20} color="var(--brand-primary)" />
                    Informações Principais da Unidade
                  </div>
                  
                  <div className="form-grid form-grid-3">
                    <div className="form-group span-2">
                      <label className="form-label required">Nome da Operação</label>
                      <input className="form-control" value={formData.nome_operacao} onChange={e => setFormData(p => ({ ...p, nome_operacao: e.target.value }))} disabled={!temPermissaoEdicao} placeholder="Ex: Estacionamento Central" />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Código Externo</label>
                      <input className="form-control" value={formData.codigo_operacao} onChange={e => setFormData(p => ({ ...p, codigo_operacao: e.target.value }))} disabled={!temPermissaoEdicao} placeholder="OP-000" />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Bandeira</label>
                      <select className="form-control" value={formData.bandeira} onChange={e => setFormData(p => ({ ...p, bandeira: e.target.value as Bandeira }))} disabled={!temPermissaoEdicao}>
                        {BANDEIRA_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Segmentação/Tipo</label>
                      <select className="form-control" value={formData.tipo_operacao} onChange={e => setFormData(p => ({ ...p, tipo_operacao: e.target.value as TipoOperacao }))} disabled={!temPermissaoEdicao}>
                        {TIPO_OPTIONS.map(t => <option key={t} value={t}>{TIPO_OPERACAO_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status Regional</label>
                      <select className="form-control" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} disabled={!temPermissaoEdicao}>
                        <option value="ativa">Ativa</option>
                        <option value="inativa">Inativa</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <MapPin size={20} color="var(--brand-primary)" />
                    Localização e Logística
                  </div>

                  <div className="form-grid form-grid-3">
                    <div className="form-group span-2">
                      <label className="form-label required">Cidade / Município</label>
                      <input className="form-control" value={formData.cidade} onChange={e => setFormData(p => ({ ...p, cidade: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">UF (Estado)</label>
                      <select className="form-control" value={formData.uf} onChange={e => setFormData(p => ({ ...p, uf: e.target.value }))} disabled={!temPermissaoEdicao}>
                        {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf ?? '—'}</option>)}
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
                  <div className="form-section-title">
                    <Building2 size={20} color="var(--brand-primary)" />
                    Capacidade e Segmentação
                  </div>

                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label required">Vagas Carro (Padrão)</label>
                      <input className="form-control" type="number" min={0} value={formData.quantidade_vagas} onChange={e => setFormData(p => ({ ...p, quantidade_vagas: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Vagas Moto (Padrão)</label>
                      <input className="form-control" type="number" min={0} value={formData.quantidade_vagas_moto} onChange={e => setFormData(p => ({ ...p, quantidade_vagas_moto: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Segmento do Local</label>
                      <input className="form-control" value={formData.segmento_local} onChange={e => setFormData(p => ({ ...p, segmento_local: e.target.value }))} disabled={!temPermissaoEdicao} placeholder="Ex: Premium, Popular..." />
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <Clock size={20} color="var(--brand-primary)" />
                    Horários e Atendimento
                  </div>

                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label required">Início do Turno (Funcionamento)</label>
                      <input className="form-control" type="time" value={formData.horario_funcionamento} onChange={e => setFormData(p => ({ ...p, horario_funcionamento: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Término do Turno (Fechamento)</label>
                      <input className="form-control" type="time" value={formData.horario_fechamento} onChange={e => setFormData(p => ({ ...p, horario_fechamento: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <Layout size={20} color="var(--brand-primary)" />
                    Estrutura de Apoio
                  </div>

                  <div className="form-grid form-grid-4">
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <input type="checkbox" checked={formData.possui_bicicletario} onChange={e => setFormData(p => ({ ...p, possui_bicicletario: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '20px', height: '20px' }} />
                      <label className="form-label mb-0">Bicicletário</label>
                    </div>
                    {formData.possui_bicicletario && (
                      <div className="form-group">
                        <label className="form-label">Vagas Bicicletário</label>
                        <input className="form-control" type="number" min={0} value={formData.vagas_bicicletario} onChange={e => setFormData(p => ({ ...p, vagas_bicicletario: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <input type="checkbox" checked={formData.recuo_calcada} onChange={e => setFormData(p => ({ ...p, recuo_calcada: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '20px', height: '20px' }} />
                      <label className="form-label mb-0">Recuo Calçada</label>
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <input type="checkbox" checked={formData.ticket_manual} onChange={e => setFormData(p => ({ ...p, ticket_manual: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '20px', height: '20px' }} />
                      <label className="form-label mb-0">Ticket Manual</label>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: Segurança */}
              {activeTab === 'seguranca' && (
                <div className="form-section">
                  <div className="form-section-title">
                    <ShieldAlert size={20} color="var(--brand-primary)" />
                    Monitoramento e Prevenção
                  </div>

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
                        <label className="form-label">Câmeras Instaladas</label>
                        <input className="form-control" type="number" min={0} value={formData.qtd_cftv} onChange={e => setFormData(p => ({ ...p, qtd_cftv: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Total de Cancelas</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_cancelas} onChange={e => setFormData(p => ({ ...p, qtd_cancelas: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <AlertCircle size={20} color="var(--brand-primary)" />
                    Seguro e Sinistralidade
                  </div>

                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Cobertura de Sinistro?</label>
                      <select className="form-control" value={formData.seguro_sinistro ? 'sim' : 'nao'} onChange={e => setFormData(p => ({ ...p, seguro_sinistro: e.target.value === 'sim' }))} disabled={!temPermissaoEdicao}>
                        <option value="nao">Critério Local</option>
                        <option value="sim">Seguro Ativo</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cofre / Guarda Chaves</label>
                      <input className="form-control" value={formData.local_guarda_chaves} onChange={e => setFormData(p => ({ ...p, local_guarda_chaves: e.target.value }))} disabled={!temPermissaoEdicao} placeholder="Ex: Guarita, Armário..." />
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <MapIcon size={20} color="var(--brand-primary)" />
                    Regras de Pátio
                  </div>

                  <div className="form-grid form-grid-3">
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.pernoita_veiculo} onChange={e => setFormData(p => ({ ...p, pernoita_veiculo: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }}  />
                      <label className="form-label mb-0">Permite Pernoite</label>
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.possui_manobra} onChange={e => setFormData(p => ({ ...p, possui_manobra: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Possui Manobra</label>
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={formData.manobra_fora_estacionamento} onChange={e => setFormData(p => ({ ...p, manobra_fora_estacionamento: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Manobra em Via Pública</label>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: Equipe */}
              {activeTab === 'equipe' && (
                <div className="form-section">
                  <div className="form-section-title">
                    <Users size={20} color="var(--brand-primary)" />
                    Dimensionamento do Quadro
                  </div>
                  
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label required">Escopo Total (Func.)</label>
                      <input className="form-control" type="number" min={0} value={formData.total_escopo_funcionarios} onChange={e => setFormData(p => ({ ...p, total_escopo_funcionarios: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Líderes de Unidade</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_lideres} onChange={e => setFormData(p => ({ ...p, qtd_lideres: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Operadores de Caixa</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_operadores_caixa} onChange={e => setFormData(p => ({ ...p, qtd_operadores_caixa: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Op. de Estacionamento</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_operadores_estacionamento} onChange={e => setFormData(p => ({ ...p, qtd_operadores_estacionamento: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Serviços Gerais (A.S.G.)</label>
                      <input className="form-control" type="number" min={0} value={formData.qtd_asg} onChange={e => setFormData(p => ({ ...p, qtd_asg: parseInt(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <ShieldCheck size={20} color="var(--brand-primary)" />
                    Benefícios e Suprimentos
                  </div>

                  <div className="form-grid form-grid-3">
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                      <input type="checkbox" checked={formData.direito_assiduidade} onChange={e => setFormData(p => ({ ...p, direito_assiduidade: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Assiduidade</label>
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                      <input type="checkbox" checked={formData.direito_cesta} onChange={e => setFormData(p => ({ ...p, direito_cesta: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Cesta Básica</label>
                    </div>
                    {formData.direito_cesta && (
                      <div className="form-group">
                        <label className="form-label">Valor Unitário (Cesta)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted">R$</span>
                          <input className="form-control" type="number" step="0.01" value={formData.valor_cesta} onChange={e => setFormData(p => ({ ...p, valor_cesta: parseFloat(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                        </div>
                      </div>
                    )}
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                      <input type="checkbox" checked={formData.direito_ticket} onChange={e => setFormData(p => ({ ...p, direito_ticket: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Ticket Refeição</label>
                    </div>
                    {formData.direito_ticket && (
                      <div className="form-group">
                        <label className="form-label">Valor Diário (Ticket)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted">R$</span>
                          <input className="form-control" type="number" step="0.01" value={formData.valor_ticket} onChange={e => setFormData(p => ({ ...p, valor_ticket: parseFloat(e.target.value) || 0 }))} disabled={!temPermissaoEdicao} />
                        </div>
                      </div>
                    )}
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                      <input type="checkbox" checked={formData.consumo_bobinas} onChange={e => setFormData(p => ({ ...p, consumo_bobinas: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Consumo Bobinas</label>
                    </div>
                    {formData.consumo_bobinas && (
                      <div className="form-group">
                        <label className="form-label">Modelo de Bobina</label>
                        <input className="form-control" value={formData.bobinas_tipo_modelo} onChange={e => setFormData(p => ({ ...p, bobinas_tipo_modelo: e.target.value }))} disabled={!temPermissaoEdicao} placeholder="Ex: Térmica 80mm" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA: Automação */}
              {activeTab === 'automacao' && (
                <div className="form-section">
                   <div style={{ marginBottom: '2.5rem', padding: '2rem', background: 'var(--brand-primary-light)', borderRadius: '16px', border: '1px solid var(--brand-primary-opacity)', boxShadow: 'inset 0 2px 4px rgba(39,47,92,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                        <Cpu size={28} color="var(--brand-primary)" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-primary-dark)', marginBottom: '0.25rem' }}>Gestão de Automação Local</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.5' }}>Configure os parâmetros técnicos para o agente de coleta de dados do pátio em tempo real.</p>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid form-grid-1">
                    <div className="form-group" style={{ padding: '2rem', background: 'var(--gray-50)', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Wifi size={20} color="var(--brand-primary)" />
                            Sincronização Ativa
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: '0.5rem 0 0' }}>Habilitar script de coleta automática para faturamento unificado</p>
                        </div>
                        <div 
                          className={`toggle-switch ${formData.habilitar_faturamento ? 'active' : ''}`} 
                          onClick={() => temPermissaoEdicao && setFormData(p => ({ ...p, habilitar_faturamento: !p.habilitar_faturamento }))} 
                          style={{ 
                            cursor: temPermissaoEdicao ? 'pointer' : 'not-allowed',
                            width: '56px',
                            height: '30px',
                            background: formData.habilitar_faturamento ? 'var(--brand-primary)' : 'var(--gray-300)',
                            borderRadius: '20px',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <div style={{ 
                            width: '22px', 
                            height: '22px', 
                            background: 'white', 
                            borderRadius: '50%', 
                            position: 'absolute',
                            top: '4px',
                            left: formData.habilitar_faturamento ? '30px' : '4px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>

                      {formData.habilitar_faturamento && (
                        <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--gray-200)' }}>
                          
                          <div className="form-grid form-grid-2 mb-8">
                            <div className="form-group">
                              <label className="form-label">Sistema de Automação</label>
                              <select 
                                className="form-control" 
                                value={formData.automacao_sistema || ''} 
                                onChange={e => setFormData(p => ({ ...p, automacao_sistema: e.target.value }))} 
                                disabled={!temPermissaoEdicao}
                              >
                                <option value="">Selecione um sistema...</option>
                                {automacoes.map(aut => (
                                  <option key={aut.id} value={aut.nome}>{aut.nome}</option>
                                ))}
                                {/* Fallback/Legacy option if not in catalog */}
                                {formData.automacao_sistema && !automacoes.find(a => a.nome === formData.automacao_sistema) && (
                                  <option value={formData.automacao_sistema}>{formData.automacao_sistema} (Legado)</option>
                                )}
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label className="form-label">Arquitetura do Servidor Local</label>
                              <div className="flex gap-2">
                                {[
                                  { id: 'x86', label: 'Windows 32 bits' },
                                  { id: 'x64', label: 'Windows 64 bits' }
                                ].map(arq => (
                                  <button
                                    key={arq.id}
                                    type="button"
                                    onClick={() => temPermissaoEdicao && setFormData(p => ({ ...p, automacao_arquitetura: arq.id }))}
                                    className={`btn btn-sm ${formData.automacao_arquitetura === arq.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, height: '44px', borderRadius: '10px' }}
                                  >
                                    {arq.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-8" style={{ background: 'var(--gray-100)', padding: '2rem', borderRadius: '16px', border: '1px dashed var(--gray-300)' }}>
                            {(() => {
                              if (!editando) return <p className="text-muted italic text-center text-sm">Salve a operação para habilitar a geração do script.</p>;
                              if (!formData.automacao_arquitetura) return <p className="text-warning italic text-center text-sm font-bold">⚠️ Selecione uma arquitetura para baixar o script.</p>;
                              
                              return (
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center gap-4">
                                    <button className="btn btn-primary" style={{ flex: 1, height: '54px', borderRadius: '14px' }} onClick={() => window.open(`/api/operacoes/${editando.id}/agente-config`, '_blank')}>
                                      <Download size={20} /> Baixar Script de Coleta (.bat)
                                    </button>
                                    <div style={{ flex: 1, background: 'var(--success-bg)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--success)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                      <CheckCircle size={20} color="var(--success)" />
                                      <span style={{ fontSize: '0.8rem', color: 'var(--success-dark)', fontWeight: 700 }}>Validação de Parâmetros Concluída</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted text-center" style={{ marginTop: '0.5rem' }}>O script sincronizará os dados com base do sistema selecionado acima.</p>
                                </div>
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
                  <div className="form-section-title">
                    <Users size={20} color="var(--brand-primary)" />
                    Responsáveis e Aprovações
                  </div>

                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label required">Supervisor Operacional</label>
                      <select className="form-control" value={formData.supervisor_id || ''} onChange={e => setFormData(p => ({ ...p, supervisor_id: e.target.value }))} disabled={!temPermissaoEdicao}>
                        <option value="">Selecione...</option>
                        {supervisores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Gerente Regional / Contrato</label>
                      <select className="form-control" value={formData.gerente_operacoes_id || ''} onChange={e => setFormData(p => ({ ...p, gerente_operacoes_id: e.target.value }))} disabled={!temPermissaoEdicao}>
                        <option value="">Selecione...</option>
                        {gerentes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data de Desativação / Encerramento</label>
                      <input className="form-control" type="date" value={formData.data_encerramento} onChange={e => setFormData(p => ({ ...p, data_encerramento: e.target.value }))} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius)', marginTop: '0.5rem' }}>
                      <input type="checkbox" checked={formData.aprovacao_diretoria} onChange={e => setFormData(p => ({ ...p, aprovacao_diretoria: e.target.checked }))} disabled={!temPermissaoEdicao} style={{ width: '18px', height: '18px' }} />
                      <label className="form-label mb-0">Aprovado pela Diretoria</label>
                    </div>
                  </div>

                  <div className="form-section-title mt-4">
                    <FileText size={20} color="var(--brand-primary)" />
                    Notas e Histórico
                  </div>

                  <div className="form-grid form-grid-1">
                    <div className="form-group">
                      <label className="form-label">Parecer do Gerente de Operações</label>
                      <textarea className="form-control" value={formData.obs_gerente_operacoes} onChange={e => setFormData(p => ({ ...p, obs_gerente_operacoes: e.target.value }))} rows={3} disabled={!['administrador', 'administrativo', 'diretoria', 'gerente_operacoes'].includes(perfilUsuario)} placeholder="Notas sobre a performance ou incidentes..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Observações Administrativas Gerais</label>
                      <textarea className="form-control" value={formData.observacoes_operacionais} onChange={e => setFormData(p => ({ ...p, observacoes_operacionais: e.target.value }))} rows={3} disabled={!temPermissaoEdicao} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Links de Documentação / Drive</label>
                      <textarea className="form-control" value={formData.evidencia_alteracoes} onChange={e => setFormData(p => ({ ...p, evidencia_alteracoes: e.target.value }))} rows={2} disabled={!temPermissaoEdicao} placeholder="https://drive.google.com/..." />
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
