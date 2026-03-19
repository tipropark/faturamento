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
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>PR</th>
            <th style={{ width: '150px' }}>Status</th>
            <th style={{ width: '130px' }}>SLA / Prazo</th>
            <th>Cliente</th>
            <th>Veículo</th>
            <th>Operação</th>
            {showAnalista && <th>Responsável</th>}
            <th style={{ textAlign: 'right', width: '150px' }}>Datas</th>
            <th style={{ textAlign: 'right', width: '80px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(s => (
            <tr key={s.id} onClick={() => router.push(`/sinistros/${s.id}`)} className="cursor-pointer">
              <td className="cell-code">{s.pr}</td>
              <td><span className={getStatusClass(s.status)}>{STATUS_SINISTRO_LABELS[s.status as StatusSinistro]}</span></td>
              <td>
                <div className="flex flex-col gap-1">
                  {(() => {
                    const sla = getStatusSla(s.data_limite_sla);
                    const slaLabels: any = {
                      vencido: { l: 'Vencido', b: 'badge-danger' },
                      vencendo_hoje: { l: 'Vence Hoje', b: 'badge-warning' },
                      proximo_vencimento: { l: 'Próximo', b: 'badge-info' },
                      no_prazo: { l: 'No Prazo', b: 'badge-success' }
                    };
                    return (
                      <span className={`badge ${slaLabels[sla].b}`}>
                        {slaLabels[sla].l}
                      </span>
                    );
                  })()}
                  {s.fora_do_prazo_abertura && (
                    <span className="badge badge-danger">Atrado 48h</span>
                  )}
                </div>
              </td>
              <td>
                <div className="cell-main">{s.cliente_nome}</div>
                <div className="cell-sub">{s.cliente_cpf}</div>
              </td>
              <td>
                <div className="cell-main">{s.veiculo_placa}</div>
                <div className="cell-sub">{s.veiculo_marca} {s.veiculo_modelo}</div>
              </td>
              <td>
                <div className="cell-main">{(s.operacao as any)?.nome_operacao || '-'}</div>
                <div className="cell-sub">{(s.operacao as any)?.cidade}/{(s.operacao as any)?.uf}</div>
              </td>
              {showAnalista && (
                <td>
                  {s.analista?.nome ? (
                    <div className="cell-main">{s.analista.nome}</div>
                  ) : (
                    <span className="text-muted text-xs italic">Sem analista</span>
                  )}
                  <div className="cell-sub">Sup: {(s.supervisor as any)?.nome || '-'}</div>
                </td>
              )}
              <td style={{ textAlign: 'right' }}>
                <div className="cell-main" style={{ fontSize: '0.8rem' }}>{formatarData(s.criado_em)}</div>
                <div className="text-danger font-bold" style={{ fontSize: '0.65rem' }}>Limite: {formatarData(s.data_limite_sla)}</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                 <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); router.push(`/sinistros/${s.id}`); }}>
                   <Eye size={14} /> Detalhes
                 </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Sinistros</h1>
          <p className="page-subtitle">Acompanhamento e gestão de ocorrências operacionais ({sinistros.length})</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => router.push('/sinistros/relatorios')}>
            <BarChart size={18} /> Relatórios
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/sinistros/novo')}>
            <Plus size={18} /> Abrir Sinistro
          </button>
        </div>
      </header>

      {/* Área de Filtros Premium */}
      <section className="filters-card">
        <div className="filters-grid">
          <div className="search-wrapper">
             <Search size={16} className="search-icon" />
             <input 
               className="form-control search-input"
               placeholder="Buscar por PR..." 
               value={filtros.pr} 
               onChange={e => setFiltros(p => ({ ...p, pr: e.target.value }))} 
             />
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Status</label>
             <select className="form-control" value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
               <option value="">Todos os Status</option>
               {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_SINISTRO_LABELS[s]}</option>)}
             </select>
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Operação</label>
             <select className="form-control" value={filtros.operacao_id} onChange={e => setFiltros(p => ({ ...p, operacao_id: e.target.value }))}>
               <option value="">Todas as Operações</option>
               {operacoes.map(o => <option key={o.id} value={o.id}>{o.nome_operacao}</option>)}
             </select>
          </div>

          <div className="form-group mb-0">
             <label className="form-label">Período de Abertura</label>
             <div className="flex gap-2">
               <input type="date" className="form-control" value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
               <input type="date" className="form-control" value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
             </div>
          </div>

          <div className="flex gap-2">
             {(filtros.pr || filtros.status || filtros.operacao_id || filtros.data_inicio) && (
               <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({ pr: '', status: '', operacao_id: '', data_inicio: '', data_fim: '' })}>
                 Limpar
               </button>
             )}
             <button className="btn btn-secondary btn-sm" onClick={carregar}>
                <RefreshCw size={14} className={loading ? 'rotate-animation' : ''} />
             </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div style={{ padding: '8rem 0', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }} />
          <p className="text-muted font-medium">Sincronizando base de sinistros...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* Banner de Alerta Crítico */}
          {sinistrosSemAnalista.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="alert-banner">
                <div className="alert-banner-title">
                  <AlertTriangle size={20} />
                  <span>Existem {sinistrosSemAnalista.length} sinistros sem analista responsável que precisam de atenção.</span>
                </div>
                <button className="btn btn-danger btn-sm" style={{ background: 'var(--danger-dark)' }} onClick={() => setFiltros(p => ({ ...p, status: 'aberto' }))}>
                  Priorizar agora
                </button>
              </div>
              <TabelaSinistros lista={sinistrosSemAnalista} />
            </div>
          )}

          {/* Sinistros em Andamento */}
          <section>
            <div className="flex flex-between mb-4">
               <h2 className="text-lg font-bold">Sinistros em Andamento</h2>
               <span className="badge badge-primary">{sinistrosEmAndamento.length} ativo(s)</span>
            </div>
            {sinistrosEmAndamento.length === 0 && !sinistrosSemAnalista.length ? (
              <div className="card text-center py-10">
                <p className="text-muted">Nenhum sinistro em andamento no momento.</p>
              </div>
            ) : (
              <TabelaSinistros lista={sinistrosEmAndamento} />
            )}
          </section>

          {/* Histórico */}
          {sinistrosEncerrados.length > 0 && (
            <section style={{ opacity: 0.8 }}>
              <div className="flex flex-between mb-4">
                 <h2 className="text-lg font-bold text-muted">Histórico de Encerrados</h2>
                 <span className="badge badge-gray">{sinistrosEncerrados.length} registros</span>
              </div>
              <TabelaSinistros lista={sinistrosEncerrados} />
            </section>
          )}

          {sinistros.length === 0 && (
            <div className="card text-center py-20">
              <Search size={48} className="text-muted mb-4 mx-auto display-block" style={{ opacity: 0.2 }} />
              <h3 className="text-lg font-bold text-gray-900">Nenhum registro encontrado</h3>
              <p className="text-muted">Tente ajustar os filtros para encontrar o que procura.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
