'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  User, 
  Users,
  Building2,
  Tag,
  Flag,
  Calendar,
  MoreVertical,
  History,
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DetalheSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('conversa');
  const [message, setMessage] = useState('');

  // Mock de dados da solicitação
  const solicitacao = {
    id: id,
    protocolo: 'SOL-2024-1025',
    titulo: 'Problema no acesso ao sistema de faturamento',
    descricao: 'Não consigo realizar o login no módulo de faturamento. O sistema exibe uma mensagem de erro genérica dizendo "Acesso Negado", mesmo com as credenciais corretas. Já tentei limpar o cache do navegador.',
    status: { nome: 'Em Atendimento', slug: 'em_atendimento', color: 'var(--brand-accent)' },
    prioridade: { nome: 'Urgente', slug: 'urgente', color: '#ef4444' },
    departamento: 'TI',
    categoria: 'Sistemas',
    subcategoria: 'Controle de Acessos',
    solicitante: { nome: 'Ricardo Santos', email: 'ricardo@levemobilidade.com.br', perfil: 'Supervisor de Unidade' },
    responsavel: { nome: 'Felipe Analista', email: 'felipe@levemobilidade.com.br' },
    operacao: 'Curitiba Store 01',
    criado_em: '12/10/2024 às 14:35',
    data_limite: '14/10/2024 às 14:35',
    sla_situacao: 'dentro_do_prazo'
  };

  const interacoes = [
    { id: 1, usuario: 'Ricardo Santos', tipo: 'mensagem', conteudo: 'Não consigo realizar o login no módulo de faturamento. O sistema exibe uma mensagem de erro genérica dizendo "Acesso Negado", mesmo com as credenciais corretas.', data: '12/10/2024 14:35' },
    { id: 2, usuario: 'Sistema', tipo: 'system_log', conteudo: 'Solicitação criada com sucesso. Protocolo: SOL-2024-1025', data: '12/10/2024 14:35' },
    { id: 3, usuario: 'Tiago Admin', tipo: 'status_change', conteudo: 'Status alterado de "Novo" para "Em Triagem"', data: '12/10/2024 14:45' },
    { id: 4, usuario: 'Felipe Analista', tipo: 'status_change', conteudo: 'Status alterado de "Em Triagem" para "Em Atendimento"', data: '12/10/2024 15:10' },
    { id: 5, usuario: 'Felipe Analista', tipo: 'mensagem', conteudo: 'Olá Ricardo, estamos analisando seu perfil no banco de dados. Você poderia testar novamente o acesso em 5 minutos?', data: '12/10/2024 15:12' },
  ];

  return (
    <div className="detalhe-solicitacao-content" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) 1fr', gap: '2rem' }}>
      {/* Coluna Principal: Título, Header e Conversa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => router.back()} 
            className="btn-ghost" 
            style={{ width: '40px', height: '40px', borderRadius: '12px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="cell-code" style={{ fontSize: '1rem' }}>{solicitacao.protocolo}</span>
              <span className="badge badge-info" style={{ background: solicitacao.status.color + '20', color: solicitacao.status.color, fontWeight: 800 }}>{solicitacao.status.nome}</span>
              <span className="badge badge-danger" style={{ background: solicitacao.prioridade.color + '20', color: solicitacao.prioridade.color }}>{solicitacao.prioridade.nome}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>{solicitacao.titulo}</h1>
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '2rem' }}>
          {[
            { id: 'conversa', label: 'Conversa e Histórico', icon: MessageSquare },
            { id: 'detalhes', label: 'Dados da Solicitação', icon: FileText },
            { id: 'anexos', label: 'Anexos (2)', icon: Paperclip },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '1rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--gray-500)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da Aba Conversa */}
        {activeTab === 'conversa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', minHeight: '500px' }}>
            {/* Timeline */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {interacoes.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem' }}>
                  {item.tipo === 'mensagem' ? (
                    <>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'var(--brand-primary-light)', 
                        color: 'var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {item.usuario[0]}
                      </div>
                      <div style={{ 
                        flex: 1, 
                        background: 'var(--gray-50)', 
                        padding: '1rem', 
                        borderRadius: '0 12px 12px 12px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--gray-900)' }}>{item.usuario}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{item.data}</span>
                        </div>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--gray-700)', lineHeight: '1.5' }}>{item.conteudo}</p>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', width: '100%' }}>
                      <div style={{ flex: 1, height: '1px', background: 'var(--gray-100)' }}></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.tipo === 'status_change' ? <Clock size={14} /> : <History size={14} />}
                        {item.conteudo} — {item.data}
                      </div>
                      <div style={{ flex: 1, height: '1px', background: 'var(--gray-100)' }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input de Mensagem */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Escreva sua resposta..." 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '16px', 
                    paddingBottom: '3.5rem',
                    boxShadow: 'none',
                    border: '1px solid var(--border-color)'
                  }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary btn-sm" style={{ borderRadius: '10px', padding: '0.5rem 1rem' }}>
                    <Paperclip size={16} />
                    Anexar
                  </button>
                  <button className="btn-secondary btn-sm" style={{ borderRadius: '10px' }}>
                    Interno
                  </button>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ 
                    position: 'absolute', 
                    bottom: '12px', 
                    right: '12px', 
                    borderRadius: '10px', 
                    padding: '0.5rem 1.5rem' 
                  }}
                  disabled={!message}
                >
                  <Send size={18} />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'detalhes' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Descrição Original</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--gray-700)', marginBottom: '2rem' }}>{solicitacao.descricao}</p>
            
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>Campos Personalizados</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div className="cell-sub">SISTEMA AFETADO</div>
                <div style={{ fontWeight: 600 }}>ERP Administrativo</div>
              </div>
              <div>
                <div className="cell-sub">TIPO DE DISPOSITIVO</div>
                <div style={{ fontWeight: 600 }}>Computador (Desktop)</div>
              </div>
              <div>
                <div className="cell-sub">UNIDADE/LOCAL</div>
                <div style={{ fontWeight: 600 }}>Matriz - Curitiba</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coluna Lateral: Metadados e Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Bloco de Ações do Gestor */}
        <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--brand-primary-light)', background: 'var(--brand-primary-light)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Gestão da Solicitação</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <CheckCircle2 size={18} />
              Concluir Solicitação
            </button>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select className="form-control" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                <option value="">Alterar Status...</option>
                <option value="em_triagem">Em Triagem</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select className="form-control" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                <option value="">Trocar Responsável...</option>
                <option value="felipe">Felipe Analista</option>
                <option value="tiago">Tiago Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informações de SLA */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Indicadores de SLA</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>Primeira Resposta</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>OK</span>
              </div>
              <div style={{ height: '4px', background: 'var(--success)', borderRadius: '2px' }}></div>
              <div className="cell-sub" style={{ fontSize: '0.6875rem' }}>Respondido em 10min</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>Prazo de Conclusão</span>
                <span style={{ color: 'var(--gray-900)', fontWeight: 700 }}>Em 1d 15h</span>
              </div>
              <div style={{ height: '4px', background: 'var(--gray-100)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: 'var(--brand-accent)' }}></div>
              </div>
              <div className="cell-sub" style={{ fontSize: '0.6875rem' }}>Limite: 14/10 às 14:35</div>
            </div>
          </div>
        </div>

        {/* Detalhes do Contexto */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>Informações Base</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Building2 size={18} color="var(--gray-400)" />
              <div>
                <div className="cell-sub">DEPARTAMENTO</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{solicitacao.departamento}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Tag size={18} color="var(--gray-400)" />
              <div>
                <div className="cell-sub">CATEGORIA</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{solicitacao.categoria}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={18} color="var(--gray-400)" />
              <div>
                <div className="cell-sub">SOLICITANTE</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{solicitacao.solicitante.nome}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={18} color="var(--gray-400)" />
              <div>
                <div className="cell-sub">RESPONSÁVEL</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{solicitacao.responsavel.nome}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Building2 size={18} color="var(--gray-400)" />
              <div>
                <div className="cell-sub">OPERAÇÃO</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{solicitacao.operacao}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
