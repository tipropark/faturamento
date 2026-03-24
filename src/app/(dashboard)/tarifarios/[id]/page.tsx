'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  User, Building2, Calendar, FileText, 
  MessageSquare, History, Paperclip, ExternalLink,
  ShieldCheck, Wrench, Save, RefreshCw
} from 'lucide-react';
import { 
  SolicitacaoTarifario, StatusSolicitacaoTarifario, Perfil,
  STATUS_TARIFARIO_LABELS, TIPO_SOLICITACAO_TARIFARIO_LABELS 
} from '@/types';
import { formatarData } from '@/lib/utils';

export default function DetalheTarifarioPage() {
  const router = useRouter();
  const { id } = useParams();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoTarifario | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [parecer, setParecer] = useState('');
  const [obsTecnica, setObsTecnica] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [anexos, setAnexos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [resSol, resAnexos, resHist, resUser] = await Promise.all([
        fetch(`/api/tarifarios/${id}`),
        fetch(`/api/tarifarios/${id}/anexos`),
        fetch(`/api/tarifarios/${id}/historico`),
        fetch('/api/auth/session').then(r => r.json())
      ]);
      
      if (resSol.ok) setSolicitacao(await resSol.json());
      if (resAnexos.ok) setAnexos(await resAnexos.json());
      if (resHist.ok) setHistorico(await resHist.json());
      
      if (resUser?.user) {
        setUserId(resUser.user.id);
        setPerfil(resUser.user.perfil);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAction = async (action: string, data?: any) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tarifarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (res.ok) {
        await carregar();
        setParecer('');
        setObsTecnica('');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao processar ação');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="page-loading"><div className="loading-spinner dark" /><span>Carregando detalhes...</span></div>
    </div>
  );

  if (!solicitacao) return <div>Solicitação não encontrada.</div>;

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <button className="btn btn-ghost btn-xs" onClick={() => router.push('/tarifarios')} style={{ marginBottom: '1rem', gap: '4px' }}>
            <ArrowLeft size={14} /> VOLTAR PARA LISTAGEM
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 900 }}>Solicitação {solicitacao.id.substring(0, 8).toUpperCase()}</h1>
            <span className={`badge badge-status-${solicitacao.status}`} style={{ 
              fontSize: '0.75rem', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {STATUS_TARIFARIO_LABELS[solicitacao.status]}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Informações Principais */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Informações Gerais</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <Building2 size={20} style={{ color: 'var(--brand-primary)', marginTop: '2px' }} />
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Operação</label>
                    <div style={{ fontWeight: 600 }}>{solicitacao.operacao?.nome_operacao}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{solicitacao.operacao?.cidade}/{solicitacao.operacao?.uf}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <User size={20} style={{ color: 'var(--brand-primary)', marginTop: '2px' }} />
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Solicitante</label>
                    <div style={{ fontWeight: 600 }}>{solicitacao.solicitante?.nome}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <Calendar size={20} style={{ color: 'var(--brand-primary)', marginTop: '2px' }} />
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Data de Aplicação Desejada</label>
                    <div style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{formatarData(solicitacao.data_desejada)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <FileText size={20} style={{ color: 'var(--brand-primary)', marginTop: '2px' }} />
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>Tipo da Solicitação</label>
                    <div style={{ fontWeight: 600 }}>{TIPO_SOLICITACAO_TARIFARIO_LABELS[solicitacao.tipo]}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1.25rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                  Descrição da Solicitação
                </label>
                <div style={{ lineHeight: 1.6, color: 'var(--gray-800)', whiteSpace: 'pre-wrap' }}>
                  {solicitacao.descricao}
                </div>
              </div>
            </div>
          </div>

          {/* Anexos */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Anexos e Documentos</div>
            </div>
            <div className="card-body">
              {anexos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  Nenhum anexo encontrado.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {anexos.map(anexo => (
                    <a 
                      key={anexo.id} 
                      href={anexo.url} 
                      target="_blank" 
                      className="card" 
                      style={{ 
                        padding: '0.75rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        textDecoration: 'none', 
                        transition: 'all 0.15s ease',
                        border: '1px solid var(--gray-100)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-100)'}
                    >
                      <Paperclip size={18} style={{ color: 'var(--brand-primary)' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {anexo.nome_arquivo}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{formatarData(anexo.criado_em)}</div>
                      </div>
                      <ExternalLink size={14} style={{ color: 'var(--gray-300)' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção de Aprovação (Diretoria) */}
          {['administrador', 'diretoria'].includes(perfil || '') && solicitacao.status === 'pendente' && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--warning)' }} />
                  <div className="card-title">Aprovação da Diretoria</div>
                </div>
              </div>
              <div className="card-body">
                <textarea 
                  className="form-control" 
                  placeholder="Inserir parecer da aprovação/reprovação..." 
                  value={parecer}
                  onChange={e => setParecer(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleAction('approve', { parecer })}
                    disabled={submitting}
                    style={{ flex: 1, height: '44px', gap: '8px' }}
                  >
                    <CheckCircle2 size={18} /> APROVAR SOLICITAÇÃO
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleAction('reject', { parecer })}
                    disabled={submitting}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', height: '44px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  >
                    <XCircle size={18} /> REPROVAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exibição do Parecer (se aprovado/reprovado) */}
          {(solicitacao.data_parecer) && (
            <div className="card" style={{ borderLeft: `4px solid ${solicitacao.status === 'reprovado' ? 'var(--danger)' : 'var(--success)'}` }}>
              <div className="card-header">
                <div className="card-title">Parecer da Diretoria</div>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: '1rem', fontStyle: solicitacao.parecer_diretoria ? 'normal' : 'italic', color: solicitacao.parecer_diretoria ? 'var(--gray-800)' : 'var(--gray-400)' }}>
                  {solicitacao.parecer_diretoria || "Nenhuma observação informada."}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', display: 'flex', gap: '1rem' }}>
                  <span><User size={14} style={{ verticalAlign: 'text-bottom' }} /> {solicitacao.diretoria?.nome}</span>
                  <span><Calendar size={14} style={{ verticalAlign: 'text-bottom' }} /> {formatarData(solicitacao.data_parecer)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Execução (TI) */}
          {['administrador', 'ti'].includes(perfil || '') && ['aprovado', 'em_execucao'].includes(solicitacao.status) && (
            <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={20} style={{ color: 'var(--info)' }} />
                  <div className="card-title">Execução pelo TI</div>
                </div>
              </div>
              <div className="card-body">
                {solicitacao.status === 'aprovado' ? (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', gap: '8px' }}
                    onClick={() => handleAction('start_execution')}
                    disabled={submitting}
                  >
                    <RefreshCw size={18} className={submitting ? 'rotate-animation' : ''} /> MARCAR EM EXECUÇÃO
                  </button>
                ) : (
                  <>
                    <textarea 
                      className="form-control" 
                      placeholder="Observações técnicas da execução..." 
                      value={obsTecnica}
                      onChange={e => setObsTecnica(e.target.value)}
                      style={{ marginBottom: '1rem' }}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', background: 'var(--success-dark)', border: 'none', gap: '8px' }}
                      onClick={() => handleAction('complete', { obs_tecnica: obsTecnica })}
                      disabled={submitting}
                    >
                      <CheckCircle2 size={18} /> CONCLUIR IMPLEMENTAÇÃO
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Exibição da Execução */}
          {solicitacao.data_inicio_execucao && (
            <div className="card" style={{ borderLeft: '4px solid var(--gray-300)' }}>
              <div className="card-header">
                <div className="card-title">Detalhes da Execução (TI)</div>
              </div>
              <div className="card-body">
                {solicitacao.obs_tecnica && (
                  <div style={{ marginBottom: '1rem', color: 'var(--gray-800)' }}>{solicitacao.obs_tecnica}</div>
                )}
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>Técnico: {solicitacao.tecnico_ti?.nome}</div>
                  <div>Início: {formatarData(solicitacao.data_inicio_execucao)}</div>
                  {solicitacao.data_conclusao && <div>Conclusão: {formatarData(solicitacao.data_conclusao)}</div>}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Local - Histórico */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div className="card" style={{ padding: '0' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--gray-100)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={16} style={{ color: 'var(--gray-400)' }} />
                <div className="card-title" style={{ fontSize: '0.875rem' }}>Histórico</div>
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto', padding: '1rem' }}>
              <div className="timeline" style={{ position: 'relative' }}>
                {historico.map((h, i) => (
                  <div key={h.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                    {i !== historico.length - 1 && (
                      <div style={{ position: 'absolute', left: '4px', top: '18px', bottom: '-15px', width: '2px', backgroundColor: 'var(--gray-100)' }} />
                    )}
                    <div style={{ position: 'absolute', left: '0', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--gray-300)', border: '2px solid white', boxShadow: '0 0 0 2px var(--gray-100)' }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase' }}>{h.acao}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', margin: '0.25rem 0' }}>{h.descricao}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                      {h.usuario?.nome} em {new Date(h.criado_em).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
