'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCog, RefreshCw, Edit2, Building2, Search } from 'lucide-react';

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [gerentes, setGerentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [supervisorSelecionado, setSupervisorSelecionado] = useState<any>(null);
  const [showOps, setShowOps] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    const [supRes, gerentesRes, opsRes] = await Promise.all([
      fetch('/api/usuarios?perfil=supervisor').then(r => r.json()),
      fetch('/api/usuarios?perfil=gerente_operacoes').then(r => r.json()),
      fetch('/api/operacoes').then(r => r.json()),
    ]);

    const sups = Array.isArray(supRes) ? supRes : [];
    const gers = Array.isArray(gerentesRes) ? gerentesRes : [];
    const ops = Array.isArray(opsRes) ? opsRes : [];

    // Enricher supervisores com contagem de operações
    const supsComOps = sups.map((s: any) => ({
      ...s,
      operacoes_count: ops.filter((o: any) => o.supervisor_id === s.id).length,
    }));

    setSupervisores(supsComOps);
    setGerentes(gers);
    setOperacoes(ops);
    setLoading(false);
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const alterarGerente = async (supervisorId: string, gerenteId: string) => {
    await fetch(`/api/usuarios/${supervisorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gerente_operacoes_id: gerenteId || null }),
    });
    carregarDados();
  };

  const supervisoresFiltrados = supervisores.filter(s =>
    !busca || s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const opsDoSupervisor = supervisorSelecionado
    ? operacoes.filter((o: any) => o.supervisor_id === supervisorSelecionado.id)
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Supervisores</h1>
          <p className="page-subtitle">{supervisoresFiltrados.length} supervisores em campo</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm btn-icon" onClick={carregarDados} title="Atualizar">
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
              placeholder="Buscar supervisor por nome ou email..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Supervisor</th>
                <th>Gerente de Operações</th>
                <th>Operações</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-empty"><div className="page-loading"><div className="loading-spinner dark" /><span>Carregando...</span></div></td></tr>
              ) : supervisoresFiltrados.length === 0 ? (
                <tr><td colSpan={5}><div className="table-empty">
                  <UserCog size={40} style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--gray-300)' }} />
                  Nenhum supervisor encontrado
                </div></td></tr>
              ) : supervisoresFiltrados.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{s.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{s.email}</div>
                  </td>
                  <td>
                    <select
                      className="form-control form-control-sm"
                      style={{ minWidth: '180px' }}
                      value={s.gerente_operacoes_id || ''}
                      onChange={e => alterarGerente(s.id, e.target.value)}
                    >
                      <option value="">— Sem gerente —</option>
                      {gerentes.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.nome}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: '1rem',
                      color: s.operacoes_count > 0 ? 'var(--brand-primary)' : 'var(--gray-300)'
                    }}>
                      {s.operacoes_count}
                    </span>
                    <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                      operação(ões)
                    </span>
                  </td>
                  <td>
                    {s.ativo ? (
                      <span className="badge badge-green"><span className="badge-dot" />Ativo</span>
                    ) : (
                      <span className="badge badge-red"><span className="badge-dot" />Inativo</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-xs btn-icon"
                      title="Ver operações"
                      onClick={() => { setSupervisorSelecionado(s); setShowOps(true); }}
                    >
                      <Building2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal operações do supervisor */}
      {showOps && supervisorSelecionado && (
        <div className="modal-overlay" onClick={() => setShowOps(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Operações — {supervisorSelecionado.nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{opsDoSupervisor.length} operação(ões)</div>
              </div>
              <button className="modal-close" onClick={() => setShowOps(false)}><span>✕</span></button>
            </div>
            <div className="modal-body">
              {opsDoSupervisor.length === 0 ? (
                <div className="table-empty">Nenhuma operação vinculada a este supervisor</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Operação</th><th>Código</th><th>Bandeira</th><th>Cidade/UF</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {opsDoSupervisor.map((o: any) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 500 }}>{o.nome_operacao}</td>
                        <td style={{ color: 'var(--gray-500)' }}>{o.codigo_operacao}</td>
                        <td><span className="badge badge-blue">{o.bandeira}</span></td>
                        <td style={{ color: 'var(--gray-500)' }}>{o.cidade}/{o.uf}</td>
                        <td>
                          {o.status === 'ativa'
                            ? <span className="badge badge-green"><span className="badge-dot" />Ativa</span>
                            : <span className="badge badge-gray"><span className="badge-dot" />Inativa</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
