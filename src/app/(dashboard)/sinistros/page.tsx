'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Plus, Search, Filter,
  RefreshCw, Eye, ChevronRight, BarChart, CheckCircle
} from 'lucide-react';
import {
  StatusSinistro, PrioridadeSinistro,
  STATUS_SINISTRO_LABELS, PRIORIDADE_LABELS
} from '@/types';
import { formatarData } from '@/lib/utils';
import { getStatusSla } from '@/lib/date-utils';

const STATUS_LIST: StatusSinistro[] = [
  'aberto','em_analise','aguardando_documentos','aprovado','reprovado','encerrado'
];

export default function SinistrosPage() {
  const router = useRouter();
  const [sinistros, setSinistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    pr: '', status: '', operacao_id: '',
    data_inicio: '', data_fim: ''
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.status) params.set('status', filtros.status);
    if (filtros.operacao_id) params.set('operacao_id', filtros.operacao_id);
    if (filtros.pr) params.set('pr', filtros.pr);
    if (filtros.data_inicio) params.set('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.set('data_fim', filtros.data_fim);

    const res = await fetch('/api/sinistros?' + params.toString());
    const data = await res.json();
    setSinistros(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filtros]);

  const carregarOps = useCallback(async () => {
    const res = await fetch('/api/operacoes?status=ativa');
    const data = await res.json();
    setOperacoes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { carregarOps(); }, [carregarOps]);

  const getStatusClass = (status: StatusSinistro) => `badge badge-status-${status}`;
  const getPrioridadeClass = (p: PrioridadeSinistro) => `badge badge-prioridade-${p}`;

  const sinistrosSemAnalista = sinistros.filter(s => s.status !== 'encerrado' && !s.analista_id && !s.analista);
  const sinistrosEmAndamento = sinistros.filter(s => s.status !== 'encerrado' && (s.analista_id || s.analista));
  const sinistrosEncerrados = sinistros.filter(s => s.status === 'encerrado');

  const TabelaSinistros = ({ lista, showAnalista = true }: { lista: any[], showAnalista?: boolean }) => (
// ... (TabelaSinistros code remains the same as before - I will repeat it for the replace tool to work correctly or use multi_replace if better)
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>PR</th>
            <th>Status</th>
            <th>SLA / Prazo</th>
            <th>Cliente</th>
            <th>Veículo</th>
            <th>Operação</th>
            {showAnalista && <th>Analista Responsável</th>}
            <th>Supervisor</th>
            <th style={{ textAlign: 'right' }}>Durações</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(s => (
            <tr
              key={s.id}
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/sinistros/${s.id}`)}
            >
              <td>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                  {s.pr}
                </span>
              </td>
              <td><span className={getStatusClass(s.status)}>{STATUS_SINISTRO_LABELS[s.status as StatusSinistro]}</span></td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(() => {
                    const sla = getStatusSla(s.data_limite_sla);
                    const slaLabels: any = {
                      vencido: { l: 'SLA Vencido', c: 'var(--danger)' },
                      vencendo_hoje: { l: 'Vencendo Hoje', c: '#FF8A48' },
                      proximo_vencimento: { l: 'Próximo do Vencto', c: 'var(--warning)' },
                      no_prazo: { l: 'SLA No Prazo', c: 'var(--success)' }
                    };
                    return (
                      <span className="badge" style={{ backgroundColor: slaLabels[sla].c, color: 'white', fontSize: '0.65rem' }}>
                        {slaLabels[sla].l}
                      </span>
                    );
                  })()}
                  {s.fora_do_prazo_abertura && (
                    <span className="badge" style={{ backgroundColor: 'var(--danger)', color: 'white', fontSize: '0.65rem' }}>
                      Fora do Prazo 48h
                    </span>
                  )}
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.cliente_nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{s.cliente_cpf}</div>
              </td>
              <td style={{ color: 'var(--gray-600)' }}>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.veiculo_placa}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{s.veiculo_marca} {s.veiculo_modelo}</div>
              </td>
              <td style={{ color: 'var(--gray-600)' }}>
                <div style={{ fontWeight: 500 }}>{(s.operacao as any)?.nome_operacao || '-'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {(s.operacao as any)?.cidade}/{(s.operacao as any)?.uf}
                </div>
              </td>
              {showAnalista && (
                <td>
                  {s.analista?.nome ? (
                    <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{s.analista.nome}</span>
                  ) : (
                    <span className="badge badge-gray" style={{ opacity: 0.7 }}>Sem responsável</span>
                  )}
                </td>
              )}
              <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                {(s.supervisor as any)?.nome || '-'}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Aberto: {formatarData(s.criado_em)}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 600 }}>Limite: {formatarData(s.data_limite_sla)}</div>
              </td>
              <td onClick={e => { e.stopPropagation(); router.push(`/sinistros/${s.id}`); }}>
                <button className="btn btn-secondary btn-sm">
                  <Eye size={14} /> Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Sinistros</h1>
          <p className="page-subtitle" style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{sinistros.length} registro(s) encontrado(s)</p>
        </div>
        <div className="page-actions" style={{ gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/sinistros/relatorios')} style={{ borderRadius: '8px' }}>
            <BarChart size={16} /> Relatórios
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/sinistros/novo')} style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(39, 47, 92, 0.2)' }}>
            <Plus size={16} /> Abrir Sinistro
          </button>
        </div>
      </div>

      {/* Filtros em Card Limpo */}
      <div className="card" style={{ marginBottom: '1.5rem', border: 'none', boxShadow: 'var(--shadow-sm)' }}>
        <div className="filters-bar" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="filter-search" style={{ maxWidth: '300px' }}>
            <Search size={15} className="filter-search-icon" />
            <input 
              placeholder="Buscar por PR..." 
              value={filtros.pr} 
              onChange={e => setFiltros(p => ({ ...p, pr: e.target.value }))} 
              style={{ borderRadius: '8px' }}
            />
          </div>
          <select className="filter-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))} style={{ borderRadius: '8px', minWidth: '180px' }}>
            <option value="">Status: Todos</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_SINISTRO_LABELS[s]}</option>)}
          </select>
          <select className="filter-control" value={filtros.operacao_id} onChange={e => setFiltros(p => ({ ...p, operacao_id: e.target.value }))} style={{ borderRadius: '8px', minWidth: '200px' }}>
            <option value="">Operação: Todas</option>
            {operacoes.map(o => <option key={o.id} value={o.id}>{o.nome_operacao}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Início:</span>
            <input type="date" className="filter-control" value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} style={{ borderRadius: '8px', padding: '0.4rem 0.6rem' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Fim:</span>
            <input type="date" className="filter-control" value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} style={{ borderRadius: '8px', padding: '0.4rem 0.6rem' }} />
          </div>
          {(filtros.pr || filtros.status || filtros.operacao_id || filtros.data_inicio) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({ pr: '', status: '', operacao_id: '', data_inicio: '', data_fim: '' })}>
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '5rem 0', textAlign: 'center' }}>
          <div className="loading-spinner dark" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--gray-500)' }}>Carregando dados dos sinistros...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Sessão 1: Sinistros sem analista */}
          {sinistrosSemAnalista.length > 0 && (
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> Sinistros sem analista responsável
                </h2>
                <span className="badge badge-red" style={{ padding: '0.3rem 0.6rem' }}>{sinistrosSemAnalista.length} Pendente(s)</span>
              </div>
              <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: '16px' }}>
                <TabelaSinistros lista={sinistrosSemAnalista} />
              </div>
            </div>
          )}

          {/* Sessão 2: Sinistros em andamento */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-800)' }}>Sinistros em andamento</h2>
            </div>
            <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: '16px' }}>
              {sinistrosEmAndamento.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                  Nenhum sinistro em andamento.
                </div>
              ) : (
                <TabelaSinistros lista={sinistrosEmAndamento} />
              )}
            </div>
          </div>

          {/* Sessão 3: Sinistros encerrados */}
          {sinistrosEncerrados.length > 0 && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-500)' }}>Histórico de encerrados</h2>
              </div>
              <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-sm)', borderRadius: '16px', opacity: 0.85 }}>
                <TabelaSinistros lista={sinistrosEncerrados} />
              </div>
            </div>
          )}

          {sinistros.length === 0 && (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', border: 'none', boxShadow: 'var(--shadow-sm)' }}>
              <Search size={40} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--gray-200)' }} />
              <div style={{ color: 'var(--gray-400)', fontWeight: 500 }}>Nenhum sinistro encontrado para os filtros aplicados.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
