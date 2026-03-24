'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Plus, Search, Filter,
  RefreshCw, Eye, ChevronRight, BarChart, CheckCircle,
  Clock, FileText
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
                 <button className="btn btn-primary btn-xs" onClick={e => { e.stopPropagation(); router.push(`/sinistros/${s.id}`); }} style={{ gap: '4px', borderRadius: '12px' }}>
                   <Eye size={14} /> DETALHES
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
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Módulo de Sinistros</h1>
          <p className="page-subtitle">Acompanhamento e gestão de ocorrências operacionais em tempo real ({sinistros.length})</p>
        </div>
        <div className="page-actions" style={{ gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => router.push('/sinistros/relatorios')} style={{ gap: '8px' }}>
            <BarChart size={18} /> RELATÓRIOS ESTÁTICOS
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/sinistros/novo')} style={{ borderRadius: '16px', gap: '8px' }}>
            <Plus size={18} /> ABRIR SINISTRO
          </button>
        </div>
      </header>

      {/* Strategic Summary (Benchmark: Metas) */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Registrado', value: sinistros.length, icon: AlertTriangle, color: 'var(--brand-accent)', footer: 'Base Histórica' },
          { label: 'Sem Analista', value: sinistrosSemAnalista.length, icon: Clock, color: 'var(--danger)', footer: 'Urgente' },
          { label: 'Em Andamento', value: sinistrosEmAndamento.length, icon: FileText, color: 'var(--info)', footer: 'Análise Ativa' },
          { label: 'Encerrados', value: sinistrosEncerrados.length, icon: CheckCircle, color: 'var(--success)', footer: 'Ciclo Completo' },
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}`, background: 'var(--bg-card)', borderRadius: '24px' }}>
            <div className="stat-icon-wrapper" style={{ color: stat.color, background: `${stat.color}15` }}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{stat.value}</div>
            </div>
            <div className="stat-footer" style={{ marginTop: 'auto', fontSize: '0.65rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>
               {stat.footer}
            </div>
          </div>
        ))}
      </div>

      {/* Área de Filtros Premium */}
      <section className="card shadow-sm" style={{ 
        padding: '1.5rem', 
        marginBottom: '2.5rem', 
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
      }}>
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
               <button className="btn btn-ghost btn-xs" onClick={() => setFiltros({ pr: '', status: '', operacao_id: '', data_inicio: '', data_fim: '' })}>
                 LIMPAR
               </button>
             )}
             <button className="btn btn-primary btn-xs" onClick={carregar} style={{ gap: '4px', borderRadius: '12px' }}>
                <RefreshCw size={14} className={loading ? 'rotate-animation' : ''} /> ATUALIZAR
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
                <button className="btn btn-danger btn-sm" onClick={() => setFiltros(p => ({ ...p, status: 'aberto' }))} style={{ gap: '8px' }}>
                  PRIORIZAR AGORA
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
