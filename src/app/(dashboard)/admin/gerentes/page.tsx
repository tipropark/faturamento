'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, RefreshCw, Search, Users, Building2 } from 'lucide-react';

export default function GerentesPage() {
  const [gerentes, setGerentes] = useState<any[]>([]);
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [gerenteSelecionado, setGerenteSelecionado] = useState<any>(null);
  const [showDetalhe, setShowDetalhe] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [gRes, sRes, oRes] = await Promise.all([
      fetch('/api/usuarios?perfil=gerente_operacoes').then(r => r.json()),
      fetch('/api/usuarios?perfil=supervisor').then(r => r.json()),
      fetch('/api/operacoes').then(r => r.json()),
    ]);

    const gers = Array.isArray(gRes) ? gRes : [];
    const sups = Array.isArray(sRes) ? sRes : [];
    const ops = Array.isArray(oRes) ? oRes : [];

    const gerentesComStats = gers.map((g: any) => {
      const meusSups = sups.filter((s: any) => s.gerente_operacoes_id === g.id);
      const minhasOps = ops.filter((o: any) => o.gerente_operacoes_id === g.id);
      return { ...g, supervisores_count: meusSups.length, operacoes_count: minhasOps.length };
    });

    setGerentes(gerentesComStats);
    setSupervisores(sups);
    setOperacoes(ops);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = gerentes.filter(g =>
    !busca || g.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const supsDoGerente = gerenteSelecionado
    ? supervisores.filter((s: any) => s.gerente_operacoes_id === gerenteSelecionado.id)
    : [];

  const opsDoGerente = gerenteSelecionado
    ? operacoes.filter((o: any) => o.gerente_operacoes_id === gerenteSelecionado.id)
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerentes de Operações</h1>
          <p className="page-subtitle">{filtrados.length} gerente(s) em atividade</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm btn-icon" onClick={carregar} title="Atualizar">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="filter-search" style={{ flex: 1 }}>
            <Search size={14} />
            <input 
              className="form-control"
              placeholder="Buscar gerente por nome ou email..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Gerente</th>
                <th>Supervisores</th>
                <th>Total de Operações</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-empty"><div className="page-loading"><div className="loading-spinner dark" /><span>Carregando...</span></div></td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty">
                  <Briefcase size={40} style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--gray-300)' }} />
                  Nenhum gerente encontrado
                </div></td></tr>
              ) : filtrados.map(g => (
                <tr key={g.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{g.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{g.email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={14} color="var(--gray-400)" />
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{g.supervisores_count}</span>
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>supervisor(es)</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={14} color="var(--gray-400)" />
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>{g.operacoes_count}</span>
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>operação(ões)</span>
                    </div>
                  </td>
                  <td>
                    {g.ativo
                      ? <span className="badge badge-green"><span className="badge-dot" />Ativo</span>
                      : <span className="badge badge-red"><span className="badge-dot" />Inativo</span>
                    }
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-xs" onClick={() => { setGerenteSelecionado(g); setShowDetalhe(true); }}>
                      Ver estrutura
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetalhe && gerenteSelecionado && (
        <div className="modal-overlay" onClick={() => setShowDetalhe(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Estrutura — {gerenteSelecionado.nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {supsDoGerente.length} supervisor(es) · {opsDoGerente.length} operação(ões)
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetalhe(false)}><span>✕</span></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-700)' }}>
                  <Users size={15} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Supervisores
                </div>
                {supsDoGerente.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>Nenhum supervisor vinculado</p>
                ) : supsDoGerente.map((s: any) => (
                  <div key={s.id} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.875rem' }}>{s.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{s.email}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-700)' }}>
                  <Building2 size={15} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Operações
                </div>
                {opsDoGerente.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>Nenhuma operação</p>
                ) : opsDoGerente.map((o: any) => (
                  <div key={o.id} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.875rem' }}>{o.nome_operacao}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{o.cidade}/{o.uf} · {o.bandeira}</div>
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
