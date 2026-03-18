'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Save, RefreshCw, AlertCircle, 
  CheckCircle2, ShieldAlert, Database, Cloud,
  Eye, EyeOff, History, User, Sun, Moon, 
  Monitor, Palette, ChevronRight
} from 'lucide-react';
import { formatarDataHora } from '@/lib/utils';
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('geral');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuracoes');
      const data = await res.json();
      setConfigs(Array.isArray(data) ? data : []);
      
      const resAud = await fetch('/api/auditoria?modulo=configuracoes');
      if (resAud.ok) setAuditoria(await resAud.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleTestConnection = async (categoria: string) => {
    setTesting(categoria);
    setTestResult(null);
    try {
      const configToTest = configs.filter(c => c.categoria === categoria);
      const res = await fetch('/api/configuracoes/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: categoria, config: configToTest }),
      });
      const data = await res.json();
      setTestResult({ categoria, ...data });
    } catch (err: any) {
      setTestResult({ categoria, success: false, message: 'Erro ao tentar testar conexão.' });
    } finally {
      setTesting(null);
    }
  };

  const handleUpdate = async (config: any) => {
    setSavingId(config.id);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: config.id, 
          valor: config.valor,
          chave: config.chave,
          categoria: config.categoria
        }),
      });
      if (res.ok) {
        await carregar();
      } else {
        alert('Erro ao salvar configuração');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const toggleShow = (id: string) => {
    setShowValues(p => ({ ...p, [id]: !p[id] }));
  };

  const renderConfigField = (config: any) => {
    const isVisible = showValues[config.id] || !config.sensivel;
    const isEnv = config.info === 'Carregado de ENV';

    return (
      <div key={config.id} className="form-group" style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem', 
        border: '1px solid var(--gray-100)', 
        borderRadius: 'var(--radius-md)',
        backgroundColor: isEnv ? 'rgba(var(--info-rgb), 0.02)' : 'transparent'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '0' }}>{config.chave}</label>
              {isEnv && (
                <span style={{ 
                  fontSize: '0.625rem', 
                  backgroundColor: 'var(--brand-primary-light)', 
                  color: 'var(--brand-primary)', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Ambiente (ENV)</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{config.descricao}</p>
          </div>
          {config.sensivel && (
            <button className="btn btn-ghost btn-xs" onClick={() => toggleShow(config.id)}>
              {showValues[config.id] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            className="form-control" 
            type={isVisible ? 'text' : 'password'} 
            value={config.valor} 
            onChange={e => {
              const newVal = e.target.value;
              setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, valor: newVal, info: undefined } : c));
            }}
            placeholder={config.sensivel ? '••••••••••••••••' : ''}
            style={{ 
              borderColor: isEnv ? 'var(--brand-primary-light)' : 'var(--gray-200)',
              backgroundColor: isEnv ? 'white' : 'white'
            }}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => handleUpdate(config)}
            disabled={savingId === config.id}
            title="Salvar no Banco de Dados"
          >
            {savingId === config.id ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
           {config.atualizado_em ? (
             <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
               Última alteração: {formatarDataHora(config.atualizado_em)}
             </div>
           ) : <div />}
           {isEnv && <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 500 }}>Sincronizado via ENV</div>}
        </div>
      </div>
    );
  };


  if (loading) return (
    <div className="page-loading"><div className="loading-spinner dark" /><span>Carregando configurações...</span></div>
  );

  const googleConfigs = configs.filter(c => c.categoria === 'google_drive');
  const supabaseConfigs = configs.filter(c => c.categoria === 'supabase');

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações Gerais do Sistema</h1>
          <p className="page-subtitle">Gerencie credenciais de integração e parâmetros técnicos de forma segura.</p>
        </div>
        <button className="btn btn-secondary" onClick={carregar}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}>
          <Settings size={18} /> Geral e Integrações
        </button>
        <button className={`tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`} onClick={() => setActiveTab('auditoria')}>
          <History size={18} /> Auditoria de Alterações
        </button>
        <button className={`tab-btn ${activeTab === 'aparencia' ? 'active' : ''}`} onClick={() => setActiveTab('aparencia')}>
          <Palette size={18} /> Aparência
        </button>
      </div>

      {activeTab === 'geral' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={20} style={{ color: 'var(--info)' }} />
                <div className="card-title">Integração Google Drive</div>
              </div>
            </div>
            <div className="card-body">
              {googleConfigs.length === 0 ? (
                <div className="alert alert-info">Nenhuma configuração encontrada para Google Drive nesta base.</div>
              ) : googleConfigs.map(renderConfigField)}
              
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dica Tecnológica</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', lineHeight: '1.5' }}>
                  Estas credenciais são utilizadas para o upload de arquivos. Caso altere o <strong>CLIENT_ID</strong> ou <strong>SECRET</strong>, lembre-se de re-autorizar o <strong>REFRESH_TOKEN</strong> se necessário.
                </p>
                <button 
                  className={`btn ${testing === 'google_drive' ? 'btn-ghost' : 'btn-outline'} btn-sm`} 
                  style={{ marginTop: '0.75rem', width: '100%', gap: '0.5rem' }}
                  onClick={() => handleTestConnection('google_drive')}
                  disabled={testing !== null}
                >
                  {testing === 'google_drive' ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Testar Conexão com Drive
                </button>

                {testResult?.categoria === 'google_drive' && (
                  <div className={`alert alert-${testResult.success ? 'success' : 'error'}`} style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <div style={{ flex: 1 }}>
                      <strong>{testResult.success ? 'Conexão válida' : 'Falha na conexão'}</strong>
                      <p style={{ marginTop: '0.25rem' }}>{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} style={{ color: 'var(--brand-primary)' }} />
                <div className="card-title">Conexão Supabase</div>
              </div>
            </div>
            <div className="card-body">
              {supabaseConfigs.length === 0 ? (
                <div className="alert alert-info">Nenhuma configuração encontrada para Supabase nesta base.</div>
              ) : supabaseConfigs.map(renderConfigField)}

              <div className="alert alert-warning" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <ShieldAlert size={16} />
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong>Atenção:</strong> Alterar as chaves do Supabase incorretamente pode causar a queda imediata do sistema e falhas na autenticação.
                </div>
              </div>

              <button 
                  className={`btn ${testing === 'supabase' ? 'btn-ghost' : 'btn-outline'} btn-sm`} 
                  style={{ width: '100%', gap: '0.5rem' }}
                  onClick={() => handleTestConnection('supabase')}
                  disabled={testing !== null}
                >
                  {testing === 'supabase' ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Testar Conexão Supabase
                </button>

                {testResult?.categoria === 'supabase' && (
                  <div className={`alert alert-${testResult.success ? 'success' : 'error'}`} style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <div style={{ flex: 1 }}>
                      <strong>{testResult.success ? 'Conexão válida' : 'Falha na conexão'}</strong>
                      <p style={{ marginTop: '0.25rem' }}>{testResult.message}</p>
                    </div>
                  </div>
                )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'auditoria' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Logs de Alterações Administrativas</div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Resumo da Alteração</th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {auditoria.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">Nenhum log registrado ainda.</td></tr>
                ) : auditoria.map(log => (
                  <React.Fragment key={log.id}>
                    <tr>
                      <td style={{ fontSize: '0.8125rem' }}>{formatarDataHora(log.criado_em)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={14} style={{ color: 'var(--brand-primary)' }} />
                          <span style={{ fontWeight: 600 }}>{log.usuario?.nome}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{log.acao}</span></td>
                      <td style={{ maxWidth: '300px', fontSize: '0.8125rem' }}>{log.descricao}</td>
                      <td>
                        <button 
                          className="btn btn-ghost btn-xs" 
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          <ChevronRight 
                            size={16} 
                            style={{ 
                              transition: 'transform 0.2s', 
                              transform: expandedLog === log.id ? 'rotate(90deg)' : 'none' 
                            }} 
                          />
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                        <td colSpan={5} style={{ padding: '1rem 3rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Valor Anterior</div>
                              <div style={{ 
                                padding: '0.75rem', 
                                backgroundColor: 'white', 
                                border: '1px solid var(--gray-200)', 
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8125rem',
                                fontFamily: 'monospace',
                                color: 'var(--danger)',
                                wordBreak: 'break-all'
                              }}>
                                {log.dados_anteriores?.valor || '(Vazio)'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Novo Valor</div>
                              <div style={{ 
                                padding: '0.75rem', 
                                backgroundColor: 'white', 
                                border: '1px solid var(--gray-200)', 
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8125rem',
                                fontFamily: 'monospace',
                                color: 'var(--success)',
                                wordBreak: 'break-all'
                              }}>
                                {log.dados_novos?.valor || '(Vazio)'}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            IP Origem: {log.ip_address}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'aparencia' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Personalização de Aparência</h3>
            <p className="card-subtitle">Escolha o tema que melhor se adapta ao seu ambiente de trabalho.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {/* Modo Claro */}
            <div 
              onClick={() => setTheme('light')}
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-xl)',
                border: theme === 'light' ? '2px solid var(--brand-primary)' : '2px solid var(--gray-100)',
                padding: '1.5rem',
                backgroundColor: theme === 'light' ? 'var(--brand-primary-light)' : 'var(--bg-app)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{
                height: '140px',
                backgroundColor: '#F6F8FB',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                padding: '0.75rem',
                gap: '0.5rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ width: '100%', height: '15px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid #E2E8F0' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: '40px', height: '100px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid #E2E8F0' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ width: '100%', height: '30px', backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} />
                    <div style={{ width: '80%', height: '40px', backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    backgroundColor: 'white', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', color: '#7638FF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <Sun size={18} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-title)' }}>Modo Claro</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interface leve e limpa</span>
                  </div>
                </div>
                {theme === 'light' && <CheckCircle2 size={20} style={{ color: 'var(--brand-primary)' }} />}
              </div>
            </div>

            {/* Modo Escuro */}
            <div 
              onClick={() => setTheme('dark')}
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-xl)',
                border: theme === 'dark' ? '2px solid var(--brand-primary)' : '2px solid var(--gray-100)',
                padding: '1.5rem',
                backgroundColor: theme === 'dark' ? 'var(--brand-primary-light)' : 'var(--bg-app)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{
                height: '140px',
                backgroundColor: '#0B0E14',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                padding: '0.75rem',
                gap: '0.5rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ width: '100%', height: '15px', backgroundColor: '#161B22', borderRadius: '4px', border: '1px solid #30363D' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: '40px', height: '100px', backgroundColor: '#161B22', borderRadius: '4px', border: '1px solid #30363D' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ width: '100%', height: '30px', backgroundColor: '#161B22', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    <div style={{ width: '80%', height: '40px', backgroundColor: '#161B22', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    backgroundColor: '#161B22', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', color: '#7638FF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <Moon size={18} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-title)' }}>Modo Escuro</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conforto visual premium</span>
                  </div>
                </div>
                {theme === 'dark' && <CheckCircle2 size={20} style={{ color: 'var(--brand-primary)' }} />}
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: '3rem', maxWidth: '600px' }}>
            <Monitor size={18} />
            <p style={{ fontSize: '0.8125rem' }}>
              <strong>Dica:</strong> O sistema memoriza sua escolha. Na próxima vez que você entrar, o tema selecionado será aplicado automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
