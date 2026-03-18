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
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Operações</h1>
          <p className="page-subtitle" style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Gestão de unidades e pontos operacionais</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={carregar} style={{ borderRadius: '8px' }}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Atualizar
        </button>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: '16px' }}>
        <div className="filters-bar" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
          <div className="filter-search" style={{ maxWidth: '400px' }}>
            <Search size={15} className="filter-search-icon" />
            <input 
              placeholder="Buscar por nome, código ou cidade..." 
              value={filtros.busca} 
              onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} 
              style={{ borderRadius: '8px' }}
            />
          </div>
          <select className="filter-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))} style={{ borderRadius: '8px', minWidth: '150px' }}>
            <option value="">Status: Todos</option>
            <option value="ativa">Ativas</option>
            <option value="inativa">Inativas</option>
          </select>
          <select className="filter-control" value={filtros.bandeira} onChange={e => setFiltros(p => ({ ...p, bandeira: e.target.value }))} style={{ borderRadius: '8px', minWidth: '180px' }}>
            <option value="">Bandeira: Todas</option>
            {BANDEIRA_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="table-container" style={{ padding: '0 1rem 1rem' }}>
          <table className="table">
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ borderRadius: '8px 0 0 8px' }}>Operação</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Bandeira</th>
                <th>Cidade/UF</th>
                <th>Vagas</th>
                <th>CFTV</th>
                <th>Supervisor</th>
                <th style={{ borderRadius: '0 8px 8px 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loading-spinner dark" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '4rem' }}>
                    <Building2 size={40} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--gray-200)' }} />
                    <div style={{ color: 'var(--gray-400)', fontWeight: 500 }}>Nenhuma operação encontrada</div>
                  </td>
                </tr>
              ) : filtradas.map(o => (
                <tr key={o.id}>
                  <td><div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{o.nome_operacao}</div></td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>{o.codigo_operacao}</span></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{TIPO_OPERACAO_LABELS[o.tipo_operacao as TipoOperacao]}</td>
                  <td><span className="badge" style={{ backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', padding: '0.3rem 0.6rem' }}>{o.bandeira}</span></td>
                  <td style={{ color: 'var(--gray-600)', fontSize: '0.8125rem' }}>{o.cidade}/{o.uf}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--gray-900)' }}>{o.quantidade_vagas}</td>
                  <td style={{ textAlign: 'center' }}>
                    {o.possui_cftv ? <Wifi size={15} color="var(--success)" /> : <WifiOff size={15} color="var(--gray-300)" />}
                  </td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{o.supervisor?.nome || '-'}</td>
                  <td>
                    {o.status === 'ativa'
                      ? <span className="badge badge-success" style={{ padding: '0.35rem 0.8rem', borderRadius: '6px' }}>Ativa</span>
                      : <span className="badge badge-gray" style={{ padding: '0.35rem 0.8rem', borderRadius: '6px' }}>Inativa</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
