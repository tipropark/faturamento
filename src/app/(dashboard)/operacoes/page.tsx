'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Search, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { TIPO_OPERACAO_LABELS, TipoOperacao, BANDEIRA_OPTIONS } from '@/types';

export default function OperacoesPage() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ busca: '', bandeira: '', status: 'ativa' });

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/operacoes');
    const data = await res.json();
    setOperacoes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = operacoes.filter(o => {
    const busca = filtros.busca.toLowerCase();
    if (busca && !o.nome_operacao.toLowerCase().includes(busca) && !o.codigo_operacao.toLowerCase().includes(busca) && !o.cidade.toLowerCase().includes(busca)) return false;
    if (filtros.status && o.status !== filtros.status) return false;
    if (filtros.bandeira && o.bandeira !== filtros.bandeira) return false;
    return true;
  });

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Operações</h1>
          <p className="page-subtitle">Gestão de unidades e pontos operacionais ativos no sistema</p>
        </div>
        <button className="btn btn-secondary" onClick={carregar}>
          <RefreshCw size={18} className={loading ? 'rotate-animation' : ''} />
          Sincronizar
        </button>
      </header>

      <section className="filters-card">
        <div className="filters-grid">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              className="form-control search-input"
              placeholder="Buscar por nome, código ou cidade..." 
              value={filtros.busca} 
              onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} 
            />
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Status</label>
             <select className="form-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
               <option value="">Todos</option>
               <option value="ativa">Ativas</option>
               <option value="inativa">Inativas</option>
             </select>
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Bandeira</label>
             <select className="form-control" value={filtros.bandeira} onChange={e => setFiltros(p => ({ ...p, bandeira: e.target.value }))}>
               <option value="">Todas as Bandeiras</option>
               {BANDEIRA_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>

          <div className="flex gap-2">
             {filtros.busca || filtros.bandeira || filtros.status !== 'ativa' ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({ busca: '', bandeira: '', status: 'ativa' })}>
                  Limpar
                </button>
             ) : null}
          </div>
        </div>
      </section>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Operação</th>
              <th>Código</th>
              <th>Tipo / Bandeira</th>
              <th>Cidade/UF</th>
              <th style={{ textAlign: 'center' }}>Vagas</th>
              <th style={{ textAlign: 'center' }}>CFTV</th>
              <th>Responsável</th>
              <th style={{ textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '6rem' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                  <p className="text-muted font-medium">Carregando operações...</p>
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '6rem' }}>
                  <Building2 size={48} className="text-muted mb-4 mx-auto display-block" style={{ opacity: 0.2 }} />
                  <h3 className="text-lg font-bold text-gray-900">Nenhuma operação encontrada</h3>
                  <p className="text-muted">Tente ajustar seus termos de busca ou filtros.</p>
                </td>
              </tr>
            ) : filtradas.map(o => (
              <tr key={o.id}>
                <td>
                  <div className="cell-main">{o.nome_operacao}</div>
                  <div className="cell-sub">{o.cidade} - {o.uf}</div>
                </td>
                <td className="cell-code">{o.codigo_operacao}</td>
                <td>
                  <div className="cell-main">{TIPO_OPERACAO_LABELS[o.tipo_operacao as TipoOperacao]}</div>
                  <div className="cell-sub">{o.bandeira}</div>
                </td>
                <td><span className="text-sm font-medium">{o.cidade}/{o.uf}</span></td>
                <td style={{ textAlign: 'center' }} className="font-bold text-gray-900">{o.quantidade_vagas}</td>
                <td style={{ textAlign: 'center' }}>
                  {o.possui_cftv ? (
                    <div className="flex items-center justify-center text-success" title="Possui CFTV Ativo">
                       <Wifi size={18} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-muted" style={{ opacity: 0.3 }} title="Sem CFTV">
                       <WifiOff size={18} />
                    </div>
                  )}
                </td>
                <td>
                   <div className="cell-main">{o.supervisor?.nome || '-'}</div>
                   <div className="cell-sub">Supervisor Coresponsável</div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {o.status === 'ativa'
                    ? <span className="badge badge-success">Ativa</span>
                    : <span className="badge badge-gray">Inativa</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
