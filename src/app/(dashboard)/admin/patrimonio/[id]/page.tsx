'use client';

import React, { useState, use } from 'react';
import { 
  Boxes, ChevronLeft, Calendar, Tag, 
  MapPin, User, FileText, Wrench, 
  History, Image as ImageIcon, Shield,
  PlusCircle, AlertTriangle, CheckCircle2,
  Download, ExternalLink, Save, ArrowRight,
  AlertCircle, ShieldCheck, Building2, Pencil,
  Maximize2, ArrowUpRight, Share2, MoreVertical,
  Info, ChevronRight, Briefcase, Truck, HardHat,
  Monitor, Layout, Layers, Package, Trash2, 
  Settings, UserCheck, HelpCircle, FileCheck, X
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { canTransferPatrimonio, canManagePatrimonio, canManagePatrimonioMaintenance } from '@/lib/permissions';

// Style Configs
const STATUS_STYLES: Record<string, { color: string, bg: string, icon: any, aura?: string }> = {
  'Ativo': { color: '#059669', bg: '#ecfdf5', icon: <CheckCircle2 size={12} /> },
  'Em Uso': { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle2 size={12} /> },
  'Estoque': { color: '#2563eb', bg: '#eff6ff', icon: <Boxes size={12} /> },
  'Manutenção': { color: '#d97706', bg: '#fffbeb', icon: <Wrench size={12} />, aura: 'aura-warning' },
  'Extraviado': { color: '#dc2626', bg: '#fef2f2', icon: <AlertCircle size={12} />, aura: 'aura-danger' },
  'Baixado': { color: '#444', bg: '#f1f5f9', icon: <FileCheck size={12} /> },
};

const CONDICAO_STYLES: Record<string, { color: string, bg: string }> = {
  'Excelente': { color: '#059669', bg: '#D1FAE5' },
  'Bom': { color: '#10b981', bg: '#D1FAE5' },
  'Regular': { color: '#f59e0b', bg: '#FEF3C7' },
  'Ruim': { color: '#ef4444', bg: '#FEE2E2' },
  'Inoperante': { color: '#7f1d1d', bg: '#FEE2E2' },
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function PatrimonioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [activeTab, setActiveTab] = useState('geral');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Consolidated API Fetching
  const { data, error, isLoading, mutate } = useSWR(`/api/patrimonio/${unwrappedParams.id}`, fetcher);
  
  // Auxiliary Data for Forms
  const { data: operacoes } = useSWR('/api/operacoes', fetcher);
  const { data: colaboradores } = useSWR('/api/colaboradores', fetcher);

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    operacao_destino_id: '',
    novo_responsavel_usuario_id: '',
    motivo: ''
  });

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">Consultando ficha mestre...</div>;
  if (error || !data) return <div className="p-10 text-center text-danger">Ocorreu um erro ao carregar o patrimônio. Tente novamente.</div>;

  const { item: p, movimentacoes, manutencoes, vistorias, anexos, perfilUsuario } = data;
  const perfil = perfilUsuario || 'vazio';

  // Computed Permissions
  const canTransfer = canTransferPatrimonio(perfil);
  const canManage = canManagePatrimonio(perfil);
  const canEdit = canManage;
  const canMaintenance = canManagePatrimonioMaintenance(perfil);

  const isCritical = ['Manutenção', 'Extraviado', 'Ruim', 'Inoperante'].includes(p.status) || ['Ruim', 'Inoperante'].includes(p.condicao_geral);

  // Transfer Action
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.operacao_destino_id) return alert('Selecione a unidade de destino');
    
    setIsSubmittingTransfer(true);
    try {
      const res = await fetch(`/api/patrimonio/${p.id}/transferir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      
      const result = await res.json();
      if (res.ok) {
        setShowTransferModal(false);
        setTransferData({ operacao_destino_id: '', novo_responsavel_usuario_id: '', motivo: '' });
        alert('Transferência realizada com sucesso!');
        mutate(); // Refresh the detail data
      } else {
        alert('Erro na transferência: ' + (result.error || 'Indisponível'));
      }
    } catch (err) {
      alert('Falha crítica na comunicação com o servidor.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Edit Action
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/patrimonio/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      const result = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        alert('Patrimônio atualizado com sucesso!');
        mutate();
      } else {
        alert('Erro na atualização: ' + (result.error || 'Indisponível'));
      }
    } catch (err) {
      alert('Falha crítica na comunicação com o servidor.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };
  
  const openEditModal = () => {
    setEditData({
      nome: p.nome || '',
      categoria: p.categoria || '',
      tipo: p.tipo || '',
      marca: p.marca || '',
      modelo: p.modelo || '',
      numero_serie: p.numero_serie || '',
      condicao_geral: p.condicao_geral || '',
      status: p.status || '',
      descricao: p.descricao || '',
      valor_compra: p.valor_compra || 0
    });
    setShowEditModal(true);
  };

  return (
    <div className="patrimonio-detail-master" style={{ paddingBottom: '80px' }}>
      
      {/* 1. TOP BAR / ACTION HEADER */}
      <header className="page-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '2rem' }}>
        <div className="page-header-flex">
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/admin/patrimonio" className="btn btn-ghost" style={{ padding: '0.65rem', borderRadius: '12px' }}>
                <ChevronLeft size={20} />
              </Link>
              <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gray-300)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ficha Patrimonial</span>
                   <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gray-200)' }}></div>
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-50)' }}>Atu. {new Date(p.atualizado_em).toLocaleDateString()}</span>
                 </div>
                 <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#1a1e45' }}>{p.nome}</h2>
              </div>
           </div>

           <div style={{ display: 'flex', gap: '0.5rem' }}>
              {canEdit && <button className="btn btn-secondary" onClick={openEditModal} style={{ borderRadius: '14px', height: '44px' }}><Pencil size={16} /> Editar</button>}
              <button className="btn btn-ghost" style={{ borderRadius: '14px', border: '1px solid var(--gray-100)' }}><Share2 size={16} /></button>
           </div>
        </div>
      </header>

      <div className="patrimonio-layout">
        
        {/* LADO ESQUERDO: INFOS & TABS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
           
           <div className="card" style={{ padding: '2.5rem', border: isCritical ? '2px solid rgba(239, 68, 68, 0.1)' : '1px solid var(--gray-100)', position: 'relative', overflow: 'hidden' }}>
              <div className="stats-grid" style={{ position: 'relative', zIndex: 1 }}>
                 <Stat label="Código" value={p.codigo_patrimonio} icon={<Tag size={12} />} />
                 <Stat label="Status" value={
                    <span className={`badge badge-${STATUS_STYLES[p.status]?.aura ? 'warning' : 'info'}`} style={{ color: STATUS_STYLES[p.status]?.color, background: STATUS_STYLES[p.status]?.bg, border: 'none', gap: '4px' }}>
                       {STATUS_STYLES[p.status]?.icon} {p.status}
                    </span>
                 } />
                 <Stat label="Unidade Atual" value={p.operacao?.nome_operacao || 'Sede Central'} icon={<MapPin size={12} />} />
                 <Stat label="Condição" value={
                    <span style={{ color: CONDICAO_STYLES[p.condicao_geral]?.color, fontWeight: 900 }}>{p.condicao_geral || 'Bom'}</span>
                 } />
              </div>

              <div className="stats-grid" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--gray-50)', paddingTop: '2rem' }}>
                 <Stat label="Categoria" value={p.categoria} />
                 <Stat label="Tipo" value={p.tipo || 'Equipamento'} />
                 <Stat label="Responsável" value={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900 }}>
                          {p.responsavel ? p.responsavel.nome.substring(0,2).toUpperCase() : '??'}
                       </div>
                       <span style={{ fontWeight: 800 }}>{p.responsavel?.nome || 'Pendente'}</span>
                    </div>
                 } />
                 <Stat label="Valor Estimado" value={formatCurrency(p.valor_compra || 0)} />
              </div>
           </div>

           <div className="card" style={{ padding: 0, minHeight: '500px' }}>
              <nav className="tabs-nav">
                 {[
                   { id: 'geral', label: 'Geral', icon: <Info size={16} /> },
                   { id: 'mov', label: 'Movimentações', icon: <Truck size={16} /> },
                   { id: 'manut', label: 'Manutenções', icon: <Wrench size={16} /> },
                   { id: 'vist', label: 'Vistorias', icon: <Shield size={16} /> },
                   { id: 'anex', label: 'Anexos', icon: <ImageIcon size={16} /> },
                   { id: 'hist', label: 'Histórico', icon: <History size={16} /> }
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     style={{ 
                       padding: '1.5rem 1.25rem', background: 'none', border: 'none',
                       borderBottom: activeTab === tab.id ? '3px solid #0C0C24' : '3px solid transparent',
                       color: activeTab === tab.id ? '#0C0C24' : 'var(--gray-400)',
                       fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', gap: '0.65rem', transition: 'all 0.2s'
                     }}
                   >
                     {tab.icon} {tab.label}
                   </button>
                 ))}
              </nav>

              <div style={{ padding: '2.5rem' }}>
                 {activeTab === 'geral' && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                      <section>
                         <SectionTitle title="Informações de Identidade" />
                         <div className="info-grid">
                            <Field label="Nome Completo" value={p.nome} />
                            <Field label="Código do Patrimônio" value={p.codigo_patrimonio} />
                            <Field label="TAG / Identificador" value={p.tag || p.codigo_patrimonio} />
                            <Field label="Marca" value={p.marca || 'Não informado'} />
                            <Field label="Modelo" value={p.modelo || 'Não informado'} />
                            <Field label="Número de Série" value={p.numero_serie || 'Sem número de série'} />
                         </div>
                         <div style={{ marginTop: '2rem' }}>
                            <Field label="Descrição Detalhada" value={p.descricao || 'Nenhuma descrição técnica ou funcional foi incluída para este bem.'} />
                         </div>
                      </section>
                      <section>
                         <SectionTitle title="Localização & Responsabilidade" />
                         <div className="info-grid">
                            <Field label="Unidade / Operação" value={p.operacao?.nome_operacao || 'Sede'} />
                            <Field label="Responsável Atual" value={p.responsavel?.nome || 'Pendente'} />
                            <Field label="Setor Designado" value={p.setor || 'Operacional'} />
                         </div>
                         <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#F1F4F9', borderRadius: '16px' }}>
                             <Field label="Localização Detalhada (Endereço/Setor/Sala)" value={p.localizacao_detalhada || 'Referência de Almoxarifado Central - Galpão 1'} />
                         </div>
                      </section>
                   </div>
                 )}

                 {activeTab === 'mov' && (
                    <div className="timeline-container">
                       {movimentacoes.length === 0 ? <EmptyState icon={<Truck size={32} />} text="Sem histórico de transferências" /> : (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {movimentacoes.map((m: any, i: number) => (
                               <div key={i} className="timeline-item-flex">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                     <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0C0C24', marginTop: '6px' }}></div>
                                     {i < movimentacoes.length - 1 && <div style={{ width: '2px', flex: 1, background: '#eee', margin: '4px 0' }}></div>}
                                  </div>
                                  <div style={{ paddingBottom: '2.5rem', flex: 1 }}>
                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                                          {new Date(m.data_movimentacao).toLocaleDateString()}
                                        </div>
                                        <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>Transferência</span>
                                     </div>
                                     <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1e45' }}>
                                        {m.origem?.nome_operacao || 'Origem Interna'} <ArrowRight size={14} style={{ margin: '0 8px' }} /> {m.destino?.nome_operacao || 'Entrada'}
                                     </div>
                                     <p style={{ margin: '6px 0', fontSize: '0.8rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>"{m.motivo || 'Movimentação operacional.'}"</p>
                                     <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                        <UserCheck size={12} /> Executado por: {m.usuario?.nome || 'Sistema'}
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                       )}
                    </div>
                 )}

                 {activeTab === 'manut' && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {manutencoes.length === 0 ? <EmptyState icon={<Wrench size={32} />} text="Sem registro de manutenções" /> : (
                         manutencoes.map((m: any, i: number) => (
                           <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                 <div style={{ fontWeight: 800 }}>{m.tipo} - {m.prestador_servico}</div>
                                 <p style={{ margin: '4px 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>{m.descricao}</p>
                              </div>
                              <span className="badge" style={{ height: 'fit-content' }}>{m.status}</span>
                           </div>
                         ))
                      )}
                   </div>
                 )}

                 {activeTab === 'vist' && (
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {vistorias.length === 0 ? <div style={{ gridColumn: 'span 12' }}><EmptyState icon={<Shield size={32} />} text="Nenhuma vistoria registrada" /></div> : (
                        vistorias.map((v: any, i: number) => (
                          <div key={i} style={{ padding: '1.5rem', background: '#F8F9FA', borderRadius: '24px', border: '1px solid var(--gray-100)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ fontWeight: 900 }}>{new Date(v.data_vistoria).toLocaleDateString()}</div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: v.resultado === 'Aprovado' ? 'var(--success)' : 'var(--danger)' }}>{v.resultado}</span>
                             </div>
                             <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: 0 }}>{v.observacoes}</p>
                          </div>
                        ))
                      )}
                   </div>
                 )}

                 {activeTab === 'anex' && (
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
                      {anexos.map((a: any, i: number) => (
                        <div key={i} className="card" style={{ padding: '0.75rem' }}>
                           <div style={{ width: '100%', aspectRatio: '1/1', background: '#F1F4F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)' }}>
                              <ImageIcon size={32} />
                           </div>
                           <div style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '8px' }}>{a.nome_arquivo}</div>
                        </div>
                      ))}
                      {canManage && (
                        <button style={{ aspectRatio: '1/1', border: '2px dashed var(--gray-200)', borderRadius: '16px', background: 'none', cursor: 'pointer' }}>
                           <PlusCircle size={28} style={{ color: 'var(--gray-300)' }} />
                        </button>
                      )}
                   </div>
                 )}

                 {activeTab === 'hist' && <EmptyState icon={<History size={32} />} text="Histórico técnico em consolidação." />}
              </div>
           </div>
        </div>

        {/* LADO DIREITO: DASHBOARD OPERACIONAL & ATALHOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
           <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>Fluxo Operacional</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 {canTransfer && (
                   <button className="primary-action-card" onClick={() => setShowTransferModal(true)}>
                      <div className="action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><ArrowRight size={18} /></div>
                      <div className="action-info">
                         <span className="action-label">Transferir</span>
                         <span className="action-desc">Mudar unidade/responsável</span>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
                   </button>
                 )}
                 {canMaintenance && (
                   <button className="primary-action-card">
                      <div className="action-icon" style={{ background: '#fffbeb', color: '#d97706' }}><Wrench size={18} /></div>
                      <div className="action-info">
                         <span className="action-label">Manutenção</span>
                         <span className="action-desc">Abrir ordem técnica</span>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
                   </button>
                 )}
                 <button className="primary-action-card">
                    <div className="action-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><Shield size={18} /></div>
                    <div className="action-info">
                       <span className="action-label">Vistoria</span>
                       <span className="action-desc">Checklist de integridade</span>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
                 </button>
              </div>
           </div>


        </div>
      </div>

      {/* 2. TRANSFER MODAL (HIGH FIDELITY) */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
           <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '2rem', background: '#F8F9FA' }}>
                 <div>
                    <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 900 }}>Transferir Patrimônio</h3>
                    <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 700, margin: '4px 0 0', textTransform: 'uppercase' }}>{p.codigo_patrimonio} • {p.nome}</p>
                 </div>
                 <button className="btn btn-ghost btn-sm" onClick={() => setShowTransferModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleTransferSubmit}>
                <div className="modal-body" style={{ padding: '2.5rem' }}>
                   <div className="form-group">
                      <label className="form-label required">Unidade / Operação de Destino</label>
                      <select 
                        className="form-control" 
                        required 
                        value={transferData.operacao_destino_id}
                        onChange={e => setTransferData(p => ({ ...p, operacao_destino_id: e.target.value }))}
                      >
                         <option value="">Selecione a unidade...</option>
                         {operacoes?.map((op: any) => (
                           <option key={op.id} value={op.id}>{op.nome_operacao}</option>
                         ))}
                      </select>
                   </div>

                   <div className="form-group">
                      <label className="form-label">Novo Responsável (Opcional)</label>
                      <select 
                        className="form-control"
                        value={transferData.novo_responsavel_usuario_id}
                        onChange={e => setTransferData(p => ({ ...p, novo_responsavel_usuario_id: e.target.value }))}
                      >
                         <option value="">Manter atual / Não alterar</option>
                         {colaboradores?.map((c: any) => (
                           <option key={c.id} value={c.id}>{c.nome} ({c.cargo || c.tipo_vinculo})</option>
                         ))}
                      </select>
                   </div>

                   <div className="form-group">
                      <label className="form-label required">Motivo da Transferência</label>
                      <textarea 
                        className="form-control" 
                        placeholder="Descreva o motivo desta movimentação (ex: Substituição de laptop, nova contratação na unidade...)" 
                        style={{ minHeight: '100px', resize: 'none' }}
                        required
                        value={transferData.motivo}
                        onChange={e => setTransferData(p => ({ ...p, motivo: e.target.value }))}
                      ></textarea>
                   </div>

                   <div style={{ background: '#FEE2E2', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <AlertTriangle size={18} className="text-danger" />
                      <p style={{ fontSize: '0.7rem', color: '#7f1d1d', margin: 0, fontWeight: 700 }}>Esta ação é irreversível e será registrada no histórico de auditoria do bem.</p>
                   </div>
                </div>
                <div className="modal-footer" style={{ padding: '2rem', borderTop: '1px solid var(--gray-50)' }}>
                   <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Cancelar</button>
                   <button type="submit" className="btn btn-primary" disabled={isSubmittingTransfer} style={{ padding: '0 2rem' }}>
                      {isSubmittingTransfer ? 'Auditando...' : 'Confirmar Transferência'}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* 3. EDIT MODAL (HIGH FIDELITY) */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
           <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '2rem', background: '#F8F9FA' }}>
                 <div>
                    <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 900 }}>Editar Patrimônio</h3>
                    <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 700, margin: '4px 0 0', textTransform: 'uppercase' }}>{p.codigo_patrimonio}</p>
                 </div>
                 <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body" style={{ padding: '2.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                   
                   <div className="form-group">
                      <label className="form-label required">Nome Completo do Item</label>
                      <input 
                        className="form-control" 
                        required 
                        value={editData.nome}
                        onChange={e => setEditData({ ...editData, nome: e.target.value })}
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                     <div className="form-group">
                        <label className="form-label required">Categoria</label>
                        <select className="form-control" required value={editData.categoria} onChange={e => setEditData({ ...editData, categoria: e.target.value })}>
                           <option value="">Selecione...</option>
                           <option value="TI">TI / Tecnologia</option>
                           <option value="Mobiliário">Mobiliário</option>
                           <option value="Veículo">Veículo</option>
                           <option value="Eletrônico">Eletrônico</option>
                           <option value="Ferramenta">Ferramenta</option>
                        </select>
                     </div>
                     <div className="form-group">
                        <label className="form-label">Tipo Específico</label>
                        <input className="form-control" value={editData.tipo} onChange={e => setEditData({ ...editData, tipo: e.target.value })} placeholder="ex: Notebook, Mesa..." />
                     </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                     <div className="form-group">
                        <label className="form-label">Marca</label>
                        <input className="form-control" value={editData.marca} onChange={e => setEditData({ ...editData, marca: e.target.value })} />
                     </div>
                     <div className="form-group">
                        <label className="form-label">Modelo</label>
                        <input className="form-control" value={editData.modelo} onChange={e => setEditData({ ...editData, modelo: e.target.value })} />
                     </div>
                     <div className="form-group">
                        <label className="form-label">Nº de Série</label>
                        <input className="form-control" value={editData.numero_serie} onChange={e => setEditData({ ...editData, numero_serie: e.target.value })} />
                     </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                     <div className="form-group">
                        <label className="form-label required">Status Operacional</label>
                        <select className="form-control" required value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                           <option value="Ativo">Ativo</option>
                           <option value="Em Uso">Em Uso</option>
                           <option value="Estoque">Estoque</option>
                           <option value="Manutenção">Manutenção</option>
                           <option value="Extraviado">Extraviado</option>
                           <option value="Baixado">Baixado</option>
                        </select>
                     </div>
                     <div className="form-group">
                        <label className="form-label required">Condição Geral</label>
                        <select className="form-control" required value={editData.condicao_geral} onChange={e => setEditData({ ...editData, condicao_geral: e.target.value })}>
                           <option value="Excelente">Excelente</option>
                           <option value="Bom">Bom</option>
                           <option value="Regular">Regular</option>
                           <option value="Ruim">Ruim</option>
                           <option value="Inoperante">Inoperante</option>
                        </select>
                     </div>
                   </div>

                   <div className="form-group">
                      <label className="form-label">Descrição Técnica / Observações</label>
                      <textarea 
                        className="form-control" 
                        rows={3} 
                        style={{ resize: 'none' }}
                        value={editData.descricao}
                        onChange={e => setEditData({ ...editData, descricao: e.target.value })}
                      ></textarea>
                   </div>
                </div>
                <div className="modal-footer" style={{ padding: '2rem', borderTop: '1px solid var(--gray-50)' }}>
                   <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                   <button type="submit" className="btn btn-primary" disabled={isSubmittingEdit} style={{ padding: '0 2rem' }}>
                      {isSubmittingEdit ? 'Salvando...' : 'Salvar Alterações'}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}

      <style jsx global>{`
        /* Responsive Layout Structures */
        .page-header-flex { display: flex; width: 100%; justify-content: space-between; align-items: center; gap: 2rem; }
        .patrimonio-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2.5rem; align-items: start; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .tabs-nav { display: flex; background: #F8F9FA; border-bottom: 1px solid var(--gray-100); padding: 0 2rem; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .tabs-nav::-webkit-scrollbar { display: none; }
        .tabs-nav button { white-space: nowrap; flex-shrink: 0; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; }
        .timeline-item-flex { display: flex; gap: 1.5rem; }

        @media (max-width: 1024px) {
          .patrimonio-layout { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .info-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .page-header-flex { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .info-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .tabs-nav { padding: 0 1rem; }
          
          /* Ajustes de Timeline e Modais Mobile */
          .timeline-item-flex { flex-direction: row; }
          .modal-header, .modal-body, .modal-footer { padding: 1.25rem !important; }
        }

        .patrimonio-detail-master { animation: slideUp 0.4s ease-out; }
        .primary-action-card { width: 100%; background: #F8F9FA; border: 1px solid transparent; padding: 12px; border-radius: 18px; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s; }
        .primary-action-card:hover { background: white; border-color: var(--gray-100); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .action-icon { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .action-info { flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .action-label { font-size: 0.8rem; font-weight: 800; color: #1a1e45; }
        .action-desc { font-size: 0.65rem; font-weight: 600; color: var(--gray-400); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(12, 12, 36, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
        .modal { background: white; border-radius: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .modal-md { width: 550px; maxWidth: 95vw; }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0.9; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

// Internal Micro-Components
const Stat = ({ label, value, icon }: { label: string, value: React.ReactNode, icon?: any }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gray-300)', textTransform: 'uppercase' }}>{label}</span>
    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1a1e45', display: 'flex', alignItems: 'center', gap: '6px' }}>
       {icon && <span style={{ color: 'var(--gray-300)' }}>{icon}</span>}
       {value}
    </div>
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1a1e45', textTransform: 'uppercase', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    {title}
    <div style={{ flex: 1, height: '1px', background: 'var(--gray-50)' }}></div>
  </h4>
);

const Field = ({ label, value }: { label: string, value: string }) => (
  <div>
    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{label}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1e45', lineHeight: '1.4' }}>{value || 'Não informado'}</span>
  </div>
);

const EmptyState = ({ icon, text }: { icon: any, text: string }) => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#F8F9FA', borderRadius: '32px', color: 'var(--gray-300)' }}>
    <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}>{icon}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{text}</div>
  </div>
);
