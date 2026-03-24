'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, Search, Filter, Download, 
  ChevronRight, Calendar, User, Shield, 
  AlertCircle, CheckCircle2, XCircle, Info,
  LineChart, Activity, Database, Cloud,
  Eye, Layout, Fingerprint, Clock, Building2,
  RefreshCw, FileText, ExternalLink, AlertTriangle
} from 'lucide-react';
import { formatarDataHora } from '@/lib/utils';

interface AuditoriaLog {
  id: string;
  criado_em: string;
  usuario_id: string;
  modulo: string;
  submodulo: string;
  acao: string;
  descricao: string;
  entidade_afetada: string;
  registro_id: string;
  status: 'sucesso' | 'falha' | 'negado';
  criticidade: 'baixa' | 'media' | 'alta' | 'critica';
  origem: string;
  ip_address: string;
  user_agent: string;
  dados_anteriores: any;
  dados_novos: any;
  detalhes: any;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
}

export default function AuditoriaPage() {
  // Estados de Dados
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Estados de Filtro
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    modulo: '',
    status: '',
    criticidade: '',
    usuarioId: '',
    q: '',
    dataInicio: '',
    dataFim: ''
  });

  // UI
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'users' | 'timeline'>('dashboard');
  const [logSelecionado, setLogSelecionado] = useState<AuditoriaLog | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar Stats
      const resStats = await fetch('/api/auditoria?mode=stats');
      if (resStats.ok) setStats(await resStats.json());

      // Carregar Logs
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...filtros
      });
      const resLogs = await fetch(`/api/auditoria?${params.toString()}`);
      if (resLogs.ok) {
        const result = await resLogs.json();
        setLogs(result.data || []);
        setTotal(result.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filtros]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleExport = () => {
    const csvData = [
      ['Data', 'Usuario', 'Perfil', 'Modulo', 'Acao', 'Descricao', 'Status', 'Criticidade'].join(','),
      ...logs.map(l => [
        formatarDataHora(l.criado_em),
        l.usuario?.nome || 'Sistema',
        l.usuario?.perfil || 'N/A',
        l.modulo,
        l.acao,
        `"${l.descricao.replace(/"/g, '""')}"`,
        l.status,
        l.criticidade
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString()}.csv`;
    a.click();
  };

  const renderBadgeStatus = (status: string) => {
    switch(status) {
      case 'sucesso': return <span className="badge badge-success" style={{ gap: '4px' }}><CheckCircle2 size={10} /> Sucesso</span>;
      case 'falha': return <span className="badge badge-danger" style={{ gap: '4px' }}><XCircle size={10} /> Falha</span>;
      case 'negado': return <span className="badge badge-warning" style={{ gap: '4px' }}><Shield size={10} /> Negado</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  const renderBadgeCriticidade = (crit: string) => {
    switch(crit) {
      case 'critica': return <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 700 }}>CRÍTICA</span>;
      case 'alta': return <span className="badge" style={{ backgroundColor: '#f97316', color: 'white', fontWeight: 600 }}>ALTA</span>;
      case 'media': return <span className="badge" style={{ backgroundColor: '#eab308', color: 'white' }}>MÉDIA</span>;
      default: return <span className="badge badge-gray">BAIXA</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1400px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Governança e Auditoria</h1>
          <p className="page-subtitle">Rastreabilidade completa de ações administrativas e operacionais.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => carregarDados()} title="Atualizar"><RefreshCw size={16} /></button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}><Download size={16} /> Exportar Logs</button>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: '2rem' }}>
        <button className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Layout size={18} /> Panorama</button>
        <button className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}><History size={18} /> Matriz de Logs</button>
        <button className={`tab-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Fingerprint size={18} /> Usuários</button>
        <button className={`tab-item ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}><Clock size={18} /> Timeline</button>
      </div>

      {activeTab === 'dashboard' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--brand-primary)' }}>
                 <div className="card-body" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <div><div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Volume Total</div><div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.total?.toLocaleString()}</div></div>
                       <Activity size={24} color="var(--brand-primary)" />
                    </div>
                 </div>
              </div>
              <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--success)' }}>
                 <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <div><div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Atividade Hoje</div><div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.hoje?.toLocaleString()}</div></div>
                       <Clock size={24} color="var(--success)" />
                    </div>
                 </div>
              </div>
              <div className="card shadow-sm" style={{ borderLeft: '4px solid #f97316' }}>
                 <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <div><div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Eventos Críticos</div><div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.criticos?.toLocaleString()}</div></div>
                       <AlertTriangle size={24} color="#f97316" />
                    </div>
                 </div>
              </div>
              <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--danger)' }}>
                 <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <div><div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Falhas Detectadas</div><div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.falhas?.toLocaleString()}</div></div>
                       <XCircle size={24} color="var(--danger)" />
                    </div>
                 </div>
              </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                 <div className="card-header"><div className="card-title">Alertas de Ações Sensíveis Recentes</div></div>
                 <div className="card-body" style={{ padding: '0' }}>
                    <div className="table-container">
                       <table className="table table-sm">
                          <thead><tr><th>Usuário</th><th>Módulo</th><th>Ação</th><th>Criticidade</th></tr></thead>
                          <tbody>
                             {logs.filter(l => l.criticidade === 'alta' || l.criticidade === 'critica').slice(0, 8).map(l => (
                                <tr key={l.id} onClick={() => { setLogSelecionado(l); setActiveTab('logs'); }} style={{ cursor: 'pointer' }}>
                                   <td style={{ fontWeight: 600 }}>{l.usuario?.nome || 'Sistema'}</td>
                                   <td style={{ fontSize: '0.8rem' }}>{l.modulo}</td>
                                   <td style={{ fontSize: '0.8rem' }}>{l.acao}</td>
                                   <td>{renderBadgeCriticidade(l.criticidade)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
              <div className="card">
                 <div className="card-header"><div className="card-title">Módulos Frequentados</div></div>
                 <div className="card-body">
                    {/* Placeholder para gráfico ou lista de contagem */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                       {['configuracoes', 'permissoes', 'sinistros', 'usuarios'].map(m => (
                          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <div style={{ width: '40px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)' }}>{m.substring(0,4).toUpperCase()}</div>
                             <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.random() * 80 + 20}%`, height: '100%', backgroundColor: 'var(--brand-primary)' }} />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {(activeTab === 'logs' || activeTab === 'users' || activeTab === 'timeline') && (
        <div className="card shadow-sm">
           <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div className="card-title">
                    {activeTab === 'logs' && 'Matriz Completa de Auditoria'}
                    {activeTab === 'users' && 'Trilha Individual por Usuário'}
                    {activeTab === 'timeline' && 'Linha do Tempo de Entidade'}
                 </div>
                 <div className="badge badge-gray">{total} registros</div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowFiltros(!showFiltros)}>
                 <Filter size={14} /> Filtros {showFiltros ? 'Recolher' : 'Expandir'}
              </button>
           </div>
           
           {showFiltros && (
              <div className="card-body" style={{ borderBottom: '1px solid var(--gray-100)', backgroundColor: 'var(--gray-50)' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                       <label className="form-label">Busca Geral</label>
                       <div className="input-with-icon"><Search size={14} /><input className="form-control" placeholder="Ação, descrição, registro..." value={filtros.q} onChange={e => setFiltros({...filtros, q: e.target.value})} /></div>
                    </div>
                    <div className="form-group">
                       <label className="form-label">Módulo</label>
                       <select className="form-control" value={filtros.modulo} onChange={e => setFiltros({...filtros, modulo: e.target.value})}>
                          <option value="">Todos</option>
                          <option value="configuracoes">Configurações</option>
                          <option value="permissoes">Permissões</option>
                          <option value="sinistros">Sinistros</option>
                          <option value="usuarios">Usuários</option>
                       </select>
                    </div>
                    <div className="form-group">
                       <label className="form-label">Status</label>
                       <select className="form-control" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
                          <option value="">Todos</option>
                          <option value="sucesso">Sucesso</option>
                          <option value="falha">Falha</option>
                          <option value="negado">Negado</option>
                       </select>
                    </div>
                    <div className="form-group">
                       <label className="form-label">Criticidade</label>
                       <select className="form-control" value={filtros.criticidade} onChange={e => setFiltros({...filtros, criticidade: e.target.value})}>
                          <option value="">Todas</option>
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                          <option value="critica">Crítica</option>
                       </select>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setFiltros({modulo:'', status:'', criticidade:'', usuarioId:'', q:'', dataInicio:'', dataFim:''}); setPage(1); }}>Limpar</button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); carregarDados(); }}>Aplicar Filtros</button>
                 </div>
              </div>
           )}

           <div className="table-container">
              <table className="table">
                 <thead>
                    <tr>
                       <th style={{ width: '180px' }}>Data/Hora</th>
                       <th>Usuário</th>
                       <th>Módulo</th>
                       <th>Ação</th>
                       <th>Status</th>
                       <th>Criticidade</th>
                       <th style={{ width: '40px' }}></th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                       <tr><td colSpan={7} className="table-loading"><RefreshCw size={20} className="animate-spin" /> Carregando logs...</td></tr>
                    ) : logs.length === 0 ? (
                       <tr><td colSpan={7} className="table-empty">Nenhum evento encontrado para os filtros aplicados.</td></tr>
                    ) : logs.map(l => (
                       <tr key={l.id} onClick={() => setLogSelecionado(l)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontSize: '0.8125rem' }}>{formatarDataHora(l.criado_em)}</td>
                          <td>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={14} style={{ color: 'var(--brand-primary)' }} />
                                <div style={{ lineHeight: '1.2' }}>
                                   <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{l.usuario?.nome || 'Sistema'}</div>
                                   <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{l.usuario?.perfil}</div>
                                </div>
                             </div>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>{l.modulo}</td>
                          <td style={{ fontSize: '0.875rem' }}>
                             <div style={{ fontWeight: 700 }}>{l.acao}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '250px' }}>{l.descricao}</div>
                          </td>
                          <td>{renderBadgeStatus(l.status)}</td>
                          <td>{renderBadgeCriticidade(l.criticidade)}</td>
                          <td><ChevronRight size={16} color="var(--gray-300)" /></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>Página {page} de {Math.ceil(total / 50) || 1}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button className="btn btn-outline btn-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
                 <button className="btn btn-outline btn-xs" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(page + 1)}>Próxima</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DETALHE DO LOG */}
      {logSelecionado && (
         <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card shadow-lg" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
               <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <History size={20} color="var(--brand-primary)" />
                     <div>
                        <div className="card-title">Detalhes do Evento</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>ID Interno: {logSelecionado.id}</div>
                     </div>
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={() => setLogSelecionado(null)}>Fechar</button>
               </div>
               
               <div className="card-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                  
                  {/* Cabeçalho de Status no Modal */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                     <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Responsável</div>
                        <div style={{ fontWeight: 700 }}>{logSelecionado.usuario?.nome || 'Sistema (Automático)'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{logSelecionado.usuario?.email || 'N/A'}</div>
                     </div>
                     <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Data e Hora</div>
                        <div style={{ fontWeight: 700 }}>{formatarDataHora(logSelecionado.criado_em)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>IP: {logSelecionado.ip_address}</div>
                     </div>
                     <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Classificação</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>{renderBadgeStatus(logSelecionado.status)} {renderBadgeCriticidade(logSelecionado.criticidade)}</div>
                     </div>
                  </div>

                  <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FileText size={16} color="var(--gray-400)" />
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Descrição da Ação</h4>
                     </div>
                     <p style={{ fontSize: '0.925rem', paddingLeft: '1.5rem', borderLeft: '3px solid var(--gray-200)' }}>{logSelecionado.descricao}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                     <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Módulo / Submódulo</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <span className="badge badge-outline">{logSelecionado.modulo}</span>
                           {logSelecionado.submodulo && <span className="badge badge-gray">{logSelecionado.submodulo}</span>}
                        </div>
                     </div>
                     <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Registro Afetado</div>
                        <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                           {logSelecionado.entidade_afetada}: <span style={{ color: 'var(--brand-primary)' }}>{logSelecionado.registro_id || 'N/A'}</span>
                        </div>
                     </div>
                  </div>

                  {/* ANTES X DEPOIS */}
                  {(logSelecionado.dados_anteriores || logSelecionado.dados_novos) && (
                     <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                           <RefreshCw size={16} color="var(--gray-400)" />
                           <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Comparativo de Dados (Audit Trail)</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                           <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-400)', marginBottom: '0.4rem' }}>VALOR ANTERIOR</div>
                              <pre style={{ margin: 0, padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', maxH: '200px' }}>
                                 {JSON.stringify(logSelecionado.dados_anteriores || {}, null, 2)}
                              </pre>
                           </div>
                           <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-400)', marginBottom: '0.4rem' }}>VALOR NOVO</div>
                              <pre style={{ margin: 0, padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', maxH: '200px' }}>
                                 {JSON.stringify(logSelecionado.dados_novos || {}, null, 2)}
                              </pre>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* DETALHES TÉCNICOS ADICIONAIS */}
                  {Object.keys(logSelecionado.detalhes || {}).length > 0 && (
                     <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Metadados do Evento</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                           {Object.entries(logSelecionado.detalhes).map(([key, val]: [string, any]) => (
                              <div key={key} style={{ fontSize: '0.75rem' }}>
                                 <strong style={{ textTransform: 'capitalize' }}>{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontStyle: 'italic', textAlign: 'center', marginTop: '1rem' }}>
                     Relatório gerado automaticamente pela Central de Governança e Auditoria — Leve ERP
                  </div>
               </div>
               
               <div className="card-footer" style={{ borderTop: '1px solid var(--gray-100)', padding: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => window.print()}><Download size={14} /> Imprimir Relatório</button>
                  <button className="btn btn-primary" onClick={() => setLogSelecionado(null)}>Entendido</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
