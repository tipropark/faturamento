'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, FileText, User, Car, Paperclip,
  History, Settings, Upload, MessageSquare,
  CheckCircle, XCircle, Clock, X, Download, ShieldAlert, HeartPulse, Building
} from 'lucide-react';
import {
  StatusSinistro, STATUS_SINISTRO_LABELS, PRIORIDADE_LABELS,
  PrioridadeSinistro, CATEGORIA_ANEXO_LABELS, CategoriaAnexo,
  StatusInconsistencia, CategoriaSinistro
} from '@/types';
import { formatarData, formatarDataHora, formatarTamanho } from '@/lib/utils';
import { getStatusSla, calcularTempoSla } from '@/lib/date-utils';
import { Edit2, Save } from 'lucide-react';

const TABS = [
  { id: 'geral', label: 'Geral', icon: FileText },
  { id: 'documentos', label: 'Documentos', icon: Paperclip },
  { id: 'inconsistencias', label: 'Inconsistências', icon: ShieldAlert },
  { id: 'prevencao', label: 'Prevenção', icon: HeartPulse },
  { id: 'reducao', label: 'Redução de Orçamentos', icon: Download },
  { id: 'tratativa', label: 'Tratativa', icon: Settings },
  { id: 'financeiro', label: 'Financeiro', icon: CheckCircle },
  { id: 'historico', label: 'Histórico', icon: History },
];

function getIcon(acao: string) {
  switch (acao) {
    case 'criacao': return '🆕';
    case 'mudanca_status': return '🔄';
    case 'anexo': return '📎';
    case 'comentario': return '💬';
    case 'encerramento': return '✅';
    default: return '📋';
  }
}

function formatarTipo(mime: string) {
  if (!mime) return 'ARQUIVO';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPG';
  if (mime.includes('png')) return 'PNG';
  if (mime.includes('mp4')) return 'MP4';
  if (mime.includes('zip')) return 'ZIP';
  if (mime.includes('word') || mime.includes('document')) return 'DOC';
  if (mime.includes('excel') || mime.includes('sheet')) return 'XLS';
  return mime.split('/')[1]?.toUpperCase() || 'ARQUIVO';
}

export default function SinistroDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState('geral');
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [catUpload, setCatUpload] = useState<CategoriaAnexo>('evidencias_adicionais');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ speed: 0, loaded: 0, total: 0, timeRemaining: 0 });
  const [comentario, setComentario] = useState('');
  const [tratativa, setTratativa] = useState<any>({});
  const [financeiro, setFinanceiro] = useState<any>({});
  const [inconsistencias, setInconsistencias] = useState<any[]>([]);
  const [prevencao, setPrevencao] = useState<any>({});
  const [analistas, setAnalistas] = useState<any[]>([]);
  const [motivoDecisao, setMotivoDecisao] = useState('');
  const [incIdAtiva, setIncIdAtiva] = useState<string | null>(null);
  const [incForm, setIncForm] = useState({ tipo: '', descricao: '' });
  const [perfilUsuario, setPerfilUsuario] = useState<string>('');
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState<any>({});

  const carregar = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const res = await fetch(`/api/sinistros/${id}`);
    if (!res.ok) { router.push('/sinistros'); return; }
    const data = await res.json();
    setDados(data);
    setTratativa({
      analista_id: data.sinistro.analista_id || '',
      data_inicio_analise: data.sinistro.data_inicio_analise?.split('T')[0] || '',
      obs_internas: data.sinistro.obs_internas || '',
      status: data.sinistro.status,
    });
    setFormEdicao({
      categoria_sinistro: data.sinistro.categoria_sinistro || '',
      motivo_especifico: data.sinistro.motivo_especifico || '',
      danos: data.sinistro.danos || '',
      observacoes: data.sinistro.observacoes || '',
      cliente_nome: data.sinistro.cliente_nome || '',
      cliente_cpf: data.sinistro.cliente_cpf || '',
      cliente_telefone: data.sinistro.cliente_telefone || '',
      veiculo_placa: data.sinistro.veiculo_placa || '',
      veiculo_marca: data.sinistro.veiculo_marca || '',
      veiculo_modelo: data.sinistro.veiculo_modelo || '',
      data_ocorrencia: data.sinistro.data_ocorrencia?.split('T')[0] || '',
    });
    setFinanceiro({
      aprovado_pagamento: data.sinistro.aprovado_pagamento,
      data_pagamento: data.sinistro.data_pagamento || '',
      obs_financeiro: data.sinistro.obs_financeiro || '',
      resultado_final: data.sinistro.resultado_final || '',
      data_conclusao: data.sinistro.data_conclusao?.split('T')[0] || '',
      valor_orcado: data.sinistro.valor_orcado || 0,
      valor_pago: data.sinistro.valor_pago || 0,
      reducao_orcamento: data.sinistro.reducao_orcamento || 0,
    });
    setLoading(false);
  }, [id, router]);

  const carregarAnalistas = useCallback(async () => {
    const res = await fetch('/api/usuarios?perfil=analista_sinistro');
    const d = await res.json();
    setAnalistas(Array.isArray(d) ? d : []);
  }, []);

  const carregarSessao = useCallback(async () => {
    const res = await fetch('/api/auth/session');
    const sess = await res.json();
    setPerfilUsuario(sess?.user?.perfil || '');
    setUsuarioId(sess?.user?.id || '');
  }, []);

  useEffect(() => { 
    carregar(true); 
    carregarAnalistas(); 
    carregarSessao(); 
  }, [carregar, carregarAnalistas, carregarSessao]);

  const salvarTratativa = async () => {
    setSalvando(true);
    await fetch(`/api/sinistros/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tratativa),
    });
    setSalvando(false);
    carregar(false);
  };

  const salvarFinanceiro = async () => {
    setSalvando(true);
    await fetch(`/api/sinistros/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(financeiro),
    });
    setSalvando(false);
    carregar(false);
  };

  const salvarEdicao = async () => {
    setSalvando(true);
    await fetch(`/api/sinistros/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formEdicao),
    });
    setSalvando(false);
    setEditando(false);
    carregar(false);
  };

  const uploadAnexos = async () => {
    const maxMB = 500;
    const oversizedFiles = uploadFiles.filter(f => f.size > maxMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Os seguintes arquivos excedem o limite de ${maxMB}MB:\n${oversizedFiles.map(f => f.name).join(', ')}`);
      setUploadFiles(uploadFiles.filter(f => f.size <= maxMB * 1024 * 1024));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const fd = new FormData();
    uploadFiles.forEach(f => fd.append('files', f));
    fd.append('categoria', catUpload);

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = event.loaded / elapsed; // bytes/sec
        const remaining = speed > 0 ? (event.total - event.loaded) / speed : 0;
        
        setUploadProgress(percentComplete);
        setUploadStats({
          speed,
          loaded: event.loaded,
          total: event.total,
          timeRemaining: remaining
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadFiles([]);
        setUploading(false);
        carregar(false);
      } else {
        const response = JSON.parse(xhr.responseText);
        alert(`Erro no upload: ${response.error || 'Erro desconhecido'}`);
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      alert('Erro de conexão no upload.');
      setUploading(false);
    };

    xhr.open('POST', `/api/sinistros/${id}/anexos`);
    xhr.send(fd);
  };

  const addComentario = async () => {
    if (!comentario.trim()) return;
    await fetch(`/api/sinistros/${id}/historico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'comentario', descricao: comentario }),
    });
    setComentario('');
    carregar(false);
  };

  if (loading) return (
    <div className="page-loading">
      <div className="loading-spinner dark" />
      <span>Carregando sinistro...</span>
    </div>
  );

  const { sinistro, anexos, historico, inconsistencias: incs } = dados;

  const slaStatus = getStatusSla(sinistro.data_limite_sla);
  const slaLabels: any = {
    vencido: { label: 'Vencido SLA', color: 'var(--danger)' },
    vencendo_hoje: { label: 'Vencendo Hoje', color: '#FF8A48' },
    proximo_vencimento: { label: 'Próximo do Vencimento', color: 'var(--warning)' },
    no_prazo: { label: 'No Prazo', color: 'var(--success)' }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontFamily: 'monospace', fontSize: '1.25rem' }}>{sinistro.pr}</h1>
            
            {/* Badges de Status e SLA */}
            <span className={`badge badge-status-${sinistro.status}`} style={{ fontSize: '0.75rem' }}>
              {STATUS_SINISTRO_LABELS[sinistro.status as StatusSinistro]}
            </span>
            
            <span className="badge" style={{ backgroundColor: slaLabels[slaStatus].color, color: 'white', fontSize: '0.75rem' }}>
              {slaLabels[slaStatus].label}
            </span>

            {sinistro.fora_do_prazo_abertura && (
              <span className="badge" style={{ backgroundColor: 'var(--danger)', color: 'white', fontSize: '0.75rem' }}>
                Fora do Prazo de Abertura
              </span>
            )}

            {incs.some((i: any) => i.status === 'pendente') && (
              <span className="badge" style={{ backgroundColor: 'var(--warning)', color: 'white', fontSize: '0.75rem' }}>
                Inconsistência Pendente
              </span>
            )}

            <button className="btn btn-ghost btn-xs" onClick={() => router.push('/sinistros/relatorios')} style={{ marginLeft: 'auto', gap: '4px' }}>
              <History size={14} /> Relatórios Estáticos
            </button>
          </div>
          <p className="page-subtitle">
            Aberto em {formatarDataHora(sinistro.criado_em)} · Protocolo: {sinistro.protocolo}
          </p>
        </div>
        <div className="page-actions">
          <select
            className="filter-control"
            value={tratativa.status || sinistro.status}
            onChange={async e => {
              const novoStatus = e.target.value;
              setTratativa((p: any) => ({ ...p, status: novoStatus }));
              await fetch(`/api/sinistros/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus }),
              });
              const sessRes = await fetch('/api/auth/session');
              const sess = await sessRes.json();
              setPerfilUsuario(sess?.user?.perfil || '');
              carregar(false);
            }}
          >
            {Object.entries(STATUS_SINISTRO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {['administrador', 'analista_sinistro'].includes(perfilUsuario) && (
            editando ? (
              <button className="btn btn-primary" onClick={salvarEdicao} disabled={salvando} style={{ gap: '8px' }}>
                <Save size={14} /> SALVAR ALTERAÇÕES
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => setEditando(true)} style={{ gap: '8px' }}>
                <Edit2 size={14} /> EDITAR SINISTRO
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      {/* LiquidGlass Tabs Navigation */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(20px)',
        padding: '0.4rem', 
        borderRadius: '20px', 
        display: 'inline-flex', 
        gap: '0.25rem', 
        marginBottom: '2rem',
        border: '1px solid var(--border-color)',
        boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02)'
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button 
              key={t.id} 
              className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{ 
                borderRadius: '16px', 
                fontSize: '0.75rem', 
                padding: '0.6rem 1.2rem',
                minWidth: '100px',
                gap: '8px',
                border: isActive ? 'none' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none'
              }} 
              onClick={() => setTab(t.id)}
            >
              <Icon size={16} /> {t.label}
              {t.id === 'documentos' && anexos.length > 0 && (
                <span style={{ 
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)', 
                  color: isActive ? 'white' : 'var(--gray-600)',
                  fontSize: '0.6rem', 
                  padding: '1px 6px', 
                  borderRadius: '10px',
                  fontWeight: 800
                }}>
                  {anexos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Geral - Reorganizada por Blocos */}
      {tab === 'geral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 1. Resumo do Caso Operacional */}
          <div className="card" style={{ borderLeft: `4px solid ${slaLabels[slaStatus].color}` }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Resumo do Caso</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge badge-status-${sinistro.status}`} style={{ fontWeight: 600 }}>
                  {STATUS_SINISTRO_LABELS[sinistro.status as StatusSinistro]}
                </span>
                <span className="badge" style={{ backgroundColor: slaLabels[slaStatus].color, color: 'white' }}>
                  {slaLabels[slaStatus].label}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                <div className="detail-item" style={{ gridColumn: 'span 2', background: 'var(--brand-primary-light)', borderColor: 'var(--brand-primary-light)', padding: '0.65rem 1rem' }}>
                  <div className="detail-label" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>Tempo Operacional</div>
                  <div className="detail-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: slaLabels[slaStatus].color }}>
                    {calcularTempoSla(sinistro.data_limite_sla)}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Limite SLA</div>
                  <div className="detail-value" style={{ fontWeight: 700, color: slaStatus === 'vencido' ? 'var(--danger)' : 'inherit' }}>
                    {sinistro.data_limite_sla ? formatarData(sinistro.data_limite_sla) : <span className="not-filled">Não calculado</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Operação</div>
                  <div className="detail-value">{sinistro.operacao?.nome_operacao || <span className="not-filled">Não definida</span>}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Supervisor</div>
                  <div className="detail-value">{sinistro.supervisor?.nome || <span className="not-filled">Pendente</span>}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Analista</div>
                  <div className="detail-value">{sinistro.analista?.nome || <span className="not-filled">Pendente</span>}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Protocolo</div>
                  <div className="detail-value" style={{ fontFamily: 'monospace', color: 'var(--gray-400)', fontSize: '0.75rem' }}>{sinistro.protocolo}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 2. Dados do Sinistro */}
              <div className="card">
                <div className="card-header"><div className="card-title">Dados do Sinistro</div></div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Categoria</div>
                      <div className="detail-value">
                        {editando ? (
                          <select className="form-control" value={formEdicao.categoria_sinistro} onChange={e => setFormEdicao({...formEdicao, categoria_sinistro: e.target.value})}>
                            <option value="">Selecione...</option>
                            <option value="avaria">Avaria</option>
                            <option value="furto">Furto</option>
                            <option value="colisao">Colisão</option>
                            <option value="estrutural">Estrutural</option>
                            <option value="reclamacao_posterior">Reclamação Posterior</option>
                            <option value="outros">Outros</option>
                          </select>
                        ) : (
                          <span style={{ textTransform: 'capitalize' }}>{sinistro.categoria_sinistro || <span className="not-filled">Não definido</span>}</span>
                        )}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Motivo Específico</div>
                      <div className="detail-value">
                        {editando ? (
                          <input className="form-control" value={formEdicao.motivo_especifico} onChange={e => setFormEdicao({...formEdicao, motivo_especifico: e.target.value})} />
                        ) : (
                          sinistro.motivo_especifico || <span className="not-filled">Não definido</span>
                        )}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Data Ocorrência</div>
                      <div className="detail-value">
                        {editando ? (
                          <input className="form-control" type="date" value={formEdicao.data_ocorrencia} onChange={e => setFormEdicao({...formEdicao, data_ocorrencia: e.target.value})} />
                        ) : (
                          formatarData(sinistro.data_ocorrencia)
                        )}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Data Emissão (Fixo)</div>
                      <div className="detail-value" style={{ color: 'var(--gray-500)' }}>{formatarData(sinistro.data_emissao)}</div>
                    </div>
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <div className="detail-label">Danos Causados</div>
                      <div className="detail-value">
                        {editando ? (
                          <textarea className="form-control" rows={3} value={formEdicao.danos} onChange={e => setFormEdicao({...formEdicao, danos: e.target.value})} />
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.8125rem' }}>{sinistro.danos}</div>
                        )}
                      </div>
                    </div>
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <div className="detail-label">Observações</div>
                      <div className="detail-value">
                        {editando ? (
                          <textarea className="form-control" rows={2} value={formEdicao.observacoes} onChange={e => setFormEdicao({...formEdicao, observacoes: e.target.value})} />
                        ) : (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{sinistro.observacoes || <span className="not-filled">Nenhuma observação informada.</span>}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Prevenção (Resumo) */}
              <div className="card">
                <div className="card-header"><div className="card-title">Prevenção / Melhoria</div></div>
                <div className="card-body">
                  <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                    <div className="detail-label">O que poderia ser melhorado?</div>
                    <div className="detail-value">{sinistro.prevencao_melhoria || <span className="not-filled">Não preenchido</span>}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Status da Ação Preventiva</div>
                    <div className="detail-value">
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{sinistro.prevencao_status_acao || 'Pendente'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 4. Cliente */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Cliente</div>
                </div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <div className="detail-label">Nome</div>
                      <div className="detail-value">
                        {editando ? <input className="form-control" value={formEdicao.cliente_nome} onChange={e => setFormEdicao({...formEdicao, cliente_nome: e.target.value})} /> : (sinistro.cliente_nome || <span className="not-filled">Não informado</span>)}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">CPF</div>
                      <div className="detail-value">
                        {editando ? <input className="form-control" value={formEdicao.cliente_cpf} onChange={e => setFormEdicao({...formEdicao, cliente_cpf: e.target.value})} /> : (sinistro.cliente_cpf || <span className="not-filled">Não informado</span>)}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Telefone</div>
                      <div className="detail-value">
                        {editando ? <input className="form-control" value={formEdicao.cliente_telefone} onChange={e => setFormEdicao({...formEdicao, cliente_telefone: e.target.value})} /> : (sinistro.cliente_telefone || <span className="not-filled">Não informado</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Veículo */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Car size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Veículo</div>
                </div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Placa</div>
                      <div className="detail-value" style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {editando ? <input className="form-control" value={formEdicao.veiculo_placa} onChange={e => setFormEdicao({...formEdicao, veiculo_placa: e.target.value})} /> : (sinistro.veiculo_placa || <span className="not-filled">Sem placa</span>)}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Marca</div>
                      <div className="detail-value">
                        {editando ? <input className="form-control" value={formEdicao.veiculo_marca} onChange={e => setFormEdicao({...formEdicao, veiculo_marca: e.target.value})} /> : (sinistro.veiculo_marca || <span className="not-filled">Não informada</span>)}
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Modelo</div>
                      <div className="detail-value">
                        {editando ? <input className="form-control" value={formEdicao.veiculo_modelo} onChange={e => setFormEdicao({...formEdicao, veiculo_modelo: e.target.value})} /> : (sinistro.veiculo_modelo || <span className="not-filled">Não informado</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Analista */}
              <div className="card">
                <div className="card-header"><div className="card-title">Analista Responsável</div></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="detail-item">
                    <div className="detail-value" style={{ fontWeight: 700 }}>{sinistro.analista?.nome || <span className="not-filled">Pendente de Atribuição</span>}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Duração da análise</div>
                    <div className="detail-value" style={{ fontSize: '0.75rem' }}>{sinistro.data_inicio_analise ? 'Iniciada' : 'Aguardando início'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tratativa */}
      {tab === 'tratativa' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tratativa do Sinistro</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={tratativa.status || sinistro.status} onChange={e => setTratativa((p: any) => ({ ...p, status: e.target.value }))}>
                  {Object.entries(STATUS_SINISTRO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Analista Responsável</label>
                <select className="form-control" value={tratativa.analista_id || ''} onChange={e => setTratativa((p: any) => ({ ...p, analista_id: e.target.value }))}>
                  <option value="">Não atribuído</option>
                  {analistas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data Início da Análise</label>
                <input className="form-control" type="date" value={tratativa.data_inicio_analise || ''} onChange={e => setTratativa((p: any) => ({ ...p, data_inicio_analise: e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Observações Internas</label>
                <textarea className="form-control" rows={5} value={tratativa.obs_internas || ''} onChange={e => setTratativa((p: any) => ({ ...p, obs_internas: e.target.value }))} placeholder="Observações para uso interno..." />
              </div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={salvarTratativa} disabled={salvando} style={{ height: '44px', padding: '0 2rem' }}>
                {salvando ? 'SALVANDO...' : 'SALVAR TRATATIVA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Financeiro */}
      {tab === 'financeiro' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Dados Financeiros</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Aprovado para pagamento?</label>
                <select className="form-control" value={financeiro.aprovado_pagamento === null || financeiro.aprovado_pagamento === undefined ? '' : financeiro.aprovado_pagamento ? 'sim' : 'nao'}
                  onChange={e => setFinanceiro((p: any) => ({ ...p, aprovado_pagamento: e.target.value === 'sim' ? true : e.target.value === 'nao' ? false : null }))}>
                  <option value="">Pendente</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data de Pagamento</label>
                <input className="form-control" type="date" value={financeiro.data_pagamento || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, data_pagamento: e.target.value }))} />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Observação Financeira</label>
                <textarea className="form-control" rows={4} value={financeiro.obs_financeiro || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, obs_financeiro: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor Orçado (R$)</label>
                <input className="form-control" type="number" step="0.01" value={financeiro.valor_orcado || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, valor_orcado: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Redução de Orçamento (R$)</label>
                <input className="form-control" type="number" step="0.01" value={financeiro.reducao_orcamento || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, reducao_orcamento: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor Pago (R$)</label>
                <input className="form-control" type="number" step="0.01" value={financeiro.valor_pago || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, valor_pago: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Resultado Final</label>
                <input className="form-control" value={financeiro.resultado_final || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, resultado_final: e.target.value }))} placeholder="Ex: Indenização paga, Encerrado sem pagamento..." />
              </div>
              <div className="form-group">
                <label className="form-label">Data de Conclusão</label>
                <input className="form-control" type="date" value={financeiro.data_conclusao || ''} onChange={e => setFinanceiro((p: any) => ({ ...p, data_conclusao: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={salvarFinanceiro} disabled={salvando} style={{ height: '44px', padding: '0 2rem' }}>
                {salvando ? 'SALVANDO...' : 'SALVAR DADOS FINANCEIROS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Documentos (Reorganizada por Seções) */}
      {tab === 'documentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            {
              titulo: '1. Documentos Obrigatórios da Ocorrência',
              icon: FileText,
              categorias: ['imagens_cftv', 'fotos_avaria', 'imagens_ocorrencia', 'ticket_cupom_fiscal', 'boletim_ocorrencia', 'evidencias_adicionais']
            },
            {
              titulo: '2. Documentos do Cliente e do Veículo',
              icon: User,
              categorias: ['documentos_cliente', 'documento_veiculo', 'cnh_rg_cpf', 'documentos']
            },
            {
              titulo: '3. Orçamentos e Negociação',
              icon: Download,
              categorias: ['orcamento', 'orcamento_sinistrado']
            },
            {
              titulo: '4. Encerramento e Financeiro',
              icon: CheckCircle,
              categorias: ['evidencia_conclusao', 'comprovantes_financeiros']
            }
          ].map((secao) => {
            const totalArquivos = anexos.filter((a: any) => secao.categorias.includes(a.categoria)).length;
            
            return (
              <div key={secao.titulo}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <secao.icon size={18} style={{ color: 'var(--brand-primary)' }} />
                    {secao.titulo}
                  </h3>
                  <span className="badge badge-gray" style={{ fontWeight: 600 }}>{totalArquivos} arquivos</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {secao.categorias.map((catId) => {
                    const catLabel = CATEGORIA_ANEXO_LABELS[catId as CategoriaAnexo];
                    const items = anexos.filter((a: any) => a.categoria === catId);
                    const temArquivos = items.length > 0;
                    
                    return (
                      <div 
                        key={catId} 
                        className="card" 
                        style={{ 
                          border: temArquivos ? '1px solid var(--brand-primary-light)' : '1px dotted var(--gray-300)', 
                          backgroundColor: temArquivos ? 'white' : 'var(--gray-50)', 
                          padding: '1rem',
                          transition: 'all 0.2s ease',
                          opacity: temArquivos ? 1 : 0.8
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: temArquivos ? 'var(--brand-primary)' : 'var(--gray-600)' }}>{catLabel}</span>
                          <span className={`badge ${temArquivos ? 'badge-primary' : 'badge-gray'}`}>
                            {items.length}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: temArquivos ? '1rem' : '0' }}>
                          {items.length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                              Nenhum arquivo enviado
                            </div>
                          ) : items.map((a: any) => (
                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" 
                               style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '0.8rem', 
                                 backgroundColor: 'var(--gray-50)', 
                                 padding: '0.75rem', 
                                 borderRadius: 'var(--radius-md)', 
                                 textDecoration: 'none', 
                                 border: '1px solid var(--gray-200)',
                                 transition: 'background 0.2s',
                                 width: '100%'
                               }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: 'var(--brand-primary-light)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-primary)', flexShrink: 0 }}>
                                 <FileText size={16} />
                              </div>
                              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                  {a.nome_arquivo}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                   <span style={{ fontWeight: 600, color: 'var(--gray-700)'}}>{formatarTipo(a.tipo_mime)}</span> • 
                                   <span>{formatarTamanho(a.tamanho)}</span> • 
                                   <span>enviado em {formatarData(a.criado_em)}</span>
                                </span>
                              </div>
                              <Download size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                            </a>
                          ))}
                        </div>
                        
                        <button 
                          className={`btn ${temArquivos ? 'btn-ghost' : 'btn-secondary'} btn-xs`} 
                          style={{ width: '100%', gap: '0.4rem' }} 
                          onClick={() => { setCatUpload(catId as CategoriaAnexo); document.getElementById('anexo-input')?.click(); }}
                        >
                          <Upload size={12} /> {temArquivos ? 'Adicionar mais' : 'Fazer Upload'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <input id="anexo-input" type="file" multiple hidden onChange={e => {
            if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            // Reset input value to allow selecting the same file again if aborted
            e.target.value = '';
          }} />

          {uploadFiles.length > 0 && (
            <div className="card sticky-bottom" style={{ 
              padding: '1.25rem', 
              backgroundColor: 'white', 
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
              borderTop: '3px solid var(--brand-primary)',
              position: 'sticky',
              bottom: '0',
              zIndex: 10
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <div style={{ fontWeight: 700 }}>
                   Arquivos para <span style={{ color: 'var(--brand-primary)' }}>"{CATEGORIA_ANEXO_LABELS[catUpload]}"</span>
                 </div>
                 <button className="btn btn-ghost btn-xs" onClick={() => setUploadFiles([])}><X size={14} /> Cancelar</button>
               </div>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                 {uploadFiles.map((f, i) => (
                   <span key={i} className="badge badge-blue" style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     {f.name} 
                     <X size={12} onClick={() => setUploadFiles(p => p.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer' }} />
                   </span>
                 ))}
               </div>
                {uploading && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{uploadProgress}% concluído</span>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>
                          {formatarTamanho(uploadStats.loaded)} de {formatarTamanho(uploadStats.total)}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{formatarTamanho(uploadStats.speed)}/s</span>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>
                          ~{Math.ceil(uploadStats.timeRemaining)}s restantes
                        </span>
                      </div>
                    </div>
                    <div style={{ height: '10px', backgroundColor: 'var(--gray-100)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${uploadProgress}%`, 
                        background: 'linear-gradient(90deg, var(--brand-primary), #6366f1)',
                        transition: 'width 0.2s ease-out'
                      }} />
                    </div>
                  </div>
                )}
                <button className="btn btn-primary w-full" onClick={uploadAnexos} disabled={uploading}>
                 {uploading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                      <span className="loading-spinner" style={{ borderTopColor: 'rgba(255,255,255,0.3)' }} /> 
                      Processando...
                    </div>
                  ) : `Confirmar Upload de ${uploadFiles.length} arquivo(s)`}

               </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Inconsistências */}
      {tab === 'inconsistencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Inconsistências Identificadas</div>
              {['administrador', 'analista_sinistro'].includes(perfilUsuario) && (
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  setIncIdAtiva('nova');
                  setIncForm({ tipo: '', descricao: '' });
                }}>+ Abrir Inconsistência</button>
              )}
            </div>
            <div className="card-body">
              {incs.length === 0 ? (
                <div className="table-empty">Nenhuma inconsistência registrada para este sinistro.</div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tipo / Descrição</th>
                        <th>Status</th>
                        <th>Abertura</th>
                        <th>Responsável / Data Decisão</th>
                        <th>Motivo da Decisão</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incs.map((i: any) => (
                        <tr key={i.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{i.tipo}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{i.descricao}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>Criado por: {i.criado_por?.nome || 'Sistema'}</div>
                          </td>
                          <td>
                            <span className={`badge badge-status-${i.status}`} style={{ textTransform: 'capitalize' }}>
                              {i.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>{formatarData(i.data_abertura)}</td>
                          <td>
                            {i.analisado_por ? (
                              <>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{i.analisado_por.nome}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{formatarDataHora(i.data_decisao)}</div>
                              </>
                            ) : '-'}
                          </td>
                          <td style={{ maxWidth: '200px', fontSize: '0.8125rem' }}>{i.motivo_decisao || '-'}</td>
                          <td>
                            {i.status === 'pendente' && (['administrador', 'gerente_operacoes'].includes(perfilUsuario)) && (
                              <button className="btn btn-ghost btn-sm" onClick={() => {
                                setIncIdAtiva(i.id);
                                setMotivoDecisao('');
                              }}>Analisar</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal / Bloco de Criação ou Análise */}
          {incIdAtiva === 'nova' && (
            <div className="card border-primary" style={{ padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Nova Inconsistência</h3>
                <button onClick={() => setIncIdAtiva(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              <div className="form-grid form-grid-2" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label required">Tipo da Inconsistência</label>
                  <input className="form-control" value={incForm.tipo} onChange={e => setIncForm({ ...incForm, tipo: e.target.value })} placeholder="Ex: Valor incorreto, Doc faltante..." />
                </div>
                <div className="form-group span-2">
                  <label className="form-label required">Descrição Detalhada</label>
                  <textarea className="form-control" rows={3} value={incForm.descricao} onChange={e => setIncForm({ ...incForm, descricao: e.target.value })} placeholder="Descreva o que foi identificado como inconsistente..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={async () => {
                   if (!incForm.tipo || !incForm.descricao) return alert('Preencha todos os campos');
                   await fetch(`/api/sinistros/${id}/inconsistencias`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ ...incForm, criado_por_id: usuarioId })
                   });
                   setIncIdAtiva(null); carregar();
                }}>Criar Inconsistência</button>
                <button className="btn btn-ghost" onClick={() => setIncIdAtiva(null)}>Cancelar</button>
              </div>
            </div>
          )}

          {incIdAtiva && incIdAtiva !== 'nova' && (
            <div className="card border-primary" style={{ padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Análise de Inconsistência</h3>
                <button onClick={() => setIncIdAtiva(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              <p style={{ marginBottom: '1rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                Apenas a Gerência de Sinistro pode aprovar ou reprovar inconsistências.
              </p>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label required">Motivo da Decisão (Obrigatório)</label>
                <textarea className="form-control" rows={3} value={motivoDecisao} onChange={e => setMotivoDecisao(e.target.value)} placeholder="Explique o porquê da aprovação ou reprovação..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-success" onClick={async () => {
                   if (!motivoDecisao) return alert('Motivo é obrigatório');
                   await fetch(`/api/sinistros/${id}/inconsistencias/${incIdAtiva}`, {
                     method: 'PATCH',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ status: 'aprovada', motivo_decisao: motivoDecisao, analisado_por_id: usuarioId })
                   });
                   setIncIdAtiva(null); carregar();
                }}>Aprovar</button>
                <button className="btn btn-danger" onClick={async () => {
                   if (!motivoDecisao) return alert('Motivo é obrigatório');
                   await fetch(`/api/sinistros/${id}/inconsistencias/${incIdAtiva}`, {
                     method: 'PATCH',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ status: 'reprovada', motivo_decisao: motivoDecisao, analisado_por_id: usuarioId })
                   });
                   setIncIdAtiva(null); carregar();
                }}>Reprovar</button>
                <button className="btn btn-ghost" onClick={() => setIncIdAtiva(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Prevenção */}
      {tab === 'prevencao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Prevenção e Aprendizado</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Local da Ocorrência (Setor / Vaga / Piso)</label>
                  <input 
                    className="form-control" 
                    value={sinistro.local_detalhado || ''} 
                    onChange={e => setDados({ ...dados, sinistro: { ...sinistro, local_detalhado: e.target.value } })}
                    disabled={!['administrador', 'supervisor'].includes(perfilUsuario)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status da Ação</label>
                  <select 
                    className="form-control" 
                    value={sinistro.prevencao_status_acao || 'pendente'}
                    onChange={e => setDados({ ...dados, sinistro: { ...sinistro, prevencao_status_acao: e.target.value } })}
                    disabled={!['administrador', 'supervisor'].includes(perfilUsuario)}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_execucao">Em Execução</option>
                    <option value="concluido">Concluído</option>
                    <option value="nao_aplicavel">Não Aplicável</option>
                  </select>
                </div>
                <div className="form-group span-2">
                  <label className="form-label">O que poderia ser melhorado?</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={sinistro.prevencao_melhoria || ''} 
                    onChange={e => setDados({ ...dados, sinistro: { ...sinistro, prevencao_melhoria: e.target.value } })}
                    disabled={!['administrador', 'supervisor'].includes(perfilUsuario)}
                  />
                </div>
                <div className="form-group span-2">
                  <label className="form-label">Como esse sinistro poderia ter sido evitado?</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={sinistro.prevencao_como_evitar || ''}
                    onChange={e => setDados({ ...dados, sinistro: { ...sinistro, prevencao_como_evitar: e.target.value } })}
                    disabled={!['administrador', 'supervisor'].includes(perfilUsuario)}
                  />
                </div>
                <div className="form-group span-2">
                  <label className="form-label">Observações de Aprendizado</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={sinistro.prevencao_observacoes_aprendizado || ''}
                    onChange={e => setDados({ ...dados, sinistro: { ...sinistro, prevencao_observacoes_aprendizado: e.target.value } })}
                    disabled={!['administrador', 'supervisor'].includes(perfilUsuario)}
                  />
                </div>
              </div>
              {['administrador', 'supervisor'].includes(perfilUsuario) && (
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={async () => {
                    setSalvando(true);
                    await fetch(`/api/sinistros/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        local_detalhado: sinistro.local_detalhado,
                        prevencao_melhoria: sinistro.prevencao_melhoria,
                        prevencao_como_evitar: sinistro.prevencao_como_evitar,
                        prevencao_observacoes_aprendizado: sinistro.prevencao_observacoes_aprendizado,
                        prevencao_status_acao: sinistro.prevencao_status_acao
                      })
                    });
                    setSalvando(false);
                    carregar();
                  }}>Salvar Prevenção</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Redução de Orçamentos */}
      {tab === 'reducao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Cards Estratégicos */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple"><Download size={24} /></div>
              <div className="stat-info">
                <div className="stat-label">Valor Original</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>R$ {(sinistro.reducao_valor_original || 0).toLocaleString('pt-BR')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><CheckCircle size={24} /></div>
              <div className="stat-info">
                <div className="stat-label">Valor Negociado</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>R$ {(sinistro.reducao_valor_negociado || 0).toLocaleString('pt-BR')}</div>
              </div>
            </div>
            <div className="stat-card" style={{ border: '1px solid var(--success-border)', background: 'var(--success-bg)' }}>
              <div className="stat-icon green"><ArrowLeft size={24} /></div>
              <div className="stat-info">
                <div className="stat-label" style={{ color: 'var(--success)' }}>Economia Gerada</div>
                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                  R$ {((sinistro.reducao_valor_original || 0) - (sinistro.reducao_valor_negociado || 0)).toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  ({sinistro.reducao_valor_original > 0 ? (((sinistro.reducao_valor_original - sinistro.reducao_valor_negociado) / sinistro.reducao_valor_original) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Dados da Negociação</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Valor Original (R$)</label>
                  <input type="number" step="0.01" className="form-control" value={sinistro.reducao_valor_original || ''} 
                         onChange={e => setDados({ ...dados, sinistro: { ...sinistro, reducao_valor_original: parseFloat(e.target.value) } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Negociado (R$)</label>
                  <input type="number" step="0.01" className="form-control" value={sinistro.reducao_valor_negociado || ''}
                         onChange={e => setDados({ ...dados, sinistro: { ...sinistro, reducao_valor_negociado: parseFloat(e.target.value) } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data da Negociação</label>
                  <input type="date" className="form-control" value={sinistro.reducao_data || ''}
                         onChange={e => setDados({ ...dados, sinistro: { ...sinistro, reducao_data: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Responsável pela Negociação</label>
                  <select className="form-control" value={sinistro.reducao_responsavel_id || ''}
                          onChange={e => setDados({ ...dados, sinistro: { ...sinistro, reducao_responsavel_id: e.target.value } })}>
                    <option value="">Selecione...</option>
                    {analistas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <div className="form-group span-2">
                  <label className="form-label">Observações da Negociação</label>
                  <textarea className="form-control" rows={3} value={sinistro.reducao_observacao || ''}
                            onChange={e => setDados({ ...dados, sinistro: { ...sinistro, reducao_observacao: e.target.value } })} />
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={async () => {
                  setSalvando(true);
                  await fetch(`/api/sinistros/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      reducao_valor_original: sinistro.reducao_valor_original,
                      reducao_valor_negociado: sinistro.reducao_valor_negociado,
                      reducao_observacao: sinistro.reducao_observacao,
                      reducao_responsavel_id: sinistro.reducao_responsavel_id,
                      reducao_data: sinistro.reducao_data
                    })
                  });
                  setSalvando(false);
                  carregar();
                }}>Salvar Dados</button>
              </div>
            </div>
          </div>

          {/* Anexos de Redução */}
          <div className="card">
            <div className="card-header"><div className="card-title">Anexos de Redução</div></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {anexos.filter((a: any) => a.categoria === 'reducao_orcamentos').map((a: any) => (
                  <div key={a.id} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Paperclip size={14} />
                    <span style={{ fontSize: '0.8rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome_arquivo}</span>
                    <a href={a.url} target="_blank" rel="noreferrer"><Download size={14} /></a>
                  </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={() => { setCatUpload('reducao_orcamentos'); document.getElementById('anexo-input')?.click(); }}>
                  <Upload size={14} /> Anexar Proposta/Doc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Histórico */}
      {tab === 'historico' && (
        <div>
          {/* Adicionar comentário */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><div className="card-title">Adicionar Comentário</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <textarea
                  className="form-control"
                  rows={3}
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  placeholder="Adicione uma observação ao histórico..."
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={addComentario} disabled={!comentario.trim()} style={{ alignSelf: 'flex-end' }}>
                  <MessageSquare size={15} />Comentar
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-body">
              <div className="timeline">
                {historico.length === 0 ? (
                  <div className="table-empty">Nenhum registro no histórico</div>
                ) : historico.map((h: any) => (
                  <div key={h.id} className="timeline-item">
                    <div className={`timeline-dot ${h.acao}`} style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                      <span style={{ fontSize: '1rem' }}>{getIcon(h.acao)}</span>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div className="timeline-acao">{h.descricao}</div>
                        <div className="timeline-time">{formatarDataHora(h.criado_em)}</div>
                      </div>
                      <div className="timeline-user">👤 {h.usuario?.nome || 'Sistema'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
