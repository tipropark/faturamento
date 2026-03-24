import React from 'react';
import { List } from 'react-window';
import { ArrowRight, Trash2 } from 'lucide-react';

interface Meta {
  id: string;
  operacao?: {
    nome_operacao: string;
    bandeira?: string;
  };
  valor_meta: number;
  apuracao?: any;
  diarias?: any[];
}

interface VirtualMetasTableProps {
  metas: Meta[];
  height: number;
  loading: boolean;
  formatMoeda: (val: number) => string;
  handleDetalharMeta: (id: string) => void;
  handleDeleteMeta: (id: string) => void;
  STATUS_APURACAO_LABELS: Record<string, string>;
}

export const VirtualMetasTable: React.FC<VirtualMetasTableProps> = ({ 
  metas, height, loading, formatMoeda, handleDetalharMeta, handleDeleteMeta, STATUS_APURACAO_LABELS 
}) => {
  const Row = ({ index, style, metas, formatMoeda, handleDetalharMeta, handleDeleteMeta, STATUS_APURACAO_LABELS }: any) => {
    const meta = metas[index];
    const apuBase = (Array.isArray(meta.apuracao) ? meta.apuracao[0] : meta.apuracao) || {};
    const hasDiarias = Array.isArray(meta.diarias) && meta.diarias.length > 0;
    const realizado = Number(apuBase.valor_realizado) || (hasDiarias ? meta.diarias!.reduce((sum: number, d: any) => sum + Number(d.valor_realizado_dia || 0), 0) : 0);
    const esperado = Number(apuBase.valor_meta_parcial_esperada) || (hasDiarias ? meta.diarias![meta.diarias!.length - 1].valor_meta_parcial_esperada : 0);
    const desvio = realizado - esperado;
    const ating = Number(meta.valor_meta) > 0 ? (realizado / meta.valor_meta) * 100 : 0;

    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0 2rem' }}>
        <div style={{ flex: 1.5 }}>
          <div className="font-bold text-gray-900">{meta.operacao?.nome_operacao || 'ESTRATEGICO GLOBAL'}</div>
          <div className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>{meta.operacao?.bandeira || 'CONSOLIDADO'}</div>
        </div>
        <div style={{ width: '120px', fontWeight: 600 }}>{formatMoeda(meta.valor_meta)}</div>
        <div style={{ width: '120px', fontWeight: 600, color: 'var(--brand-primary)' }}>{formatMoeda(realizado)}</div>
        <div style={{ width: '120px', color: 'var(--gray-500)', fontSize: '0.85rem' }}>{formatMoeda(esperado)}</div>
        <div style={{ width: '120px', fontWeight: 700, color: desvio >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {(desvio >= 0 ? '+' : '') + formatMoeda(desvio)}
        </div>
        <div style={{ width: '140px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="progress-bar-bg" style={{ width: '60px', height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(ating, 100)}%`, background: ating >= 100 ? 'var(--success)' : ating >= 85 ? 'var(--warning)' : 'var(--danger)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{ating.toFixed(1)}%</span>
          </div>
        </div>
        <div style={{ width: '150px' }}>
          <span className={`badge ${apuBase.status_apuracao === 'no_ritmo' ? 'badge-success' : apuBase.status_apuracao === 'critica' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
            {STATUS_APURACAO_LABELS[apuBase.status_apuracao] || (realizado > 0 ? 'EM ANDAMENTO' : 'PENDENTE')}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-detail-table" onClick={() => handleDetalharMeta(meta.id)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
            <ArrowRight size={14} /> Detalhar
          </button>
          <button className="btn-delete-table" onClick={() => handleDeleteMeta(meta.id)} style={{ padding: '0.4rem' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
      <header style={{ display: 'flex', background: 'var(--gray-50)', padding: '0.75rem 2rem', borderBottom: '2px solid var(--border-color)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>
        <div style={{ flex: 1.5 }}>Operação</div>
        <div style={{ width: '120px' }}>Meta</div>
        <div style={{ width: '120px' }}>Realizado</div>
        <div style={{ width: '120px' }}>Esperado</div>
        <div style={{ width: '120px' }}>Desvio</div>
        <div style={{ width: '140px' }}>Atingimento</div>
        <div style={{ width: '150px' }}>Ritmo</div>
        <div style={{ flex: 1, textAlign: 'right' }}>Ações</div>
      </header>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)' }}>Processando indicadores...</div>
      ) : metas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)' }}>Nenhuma meta encontrada.</div>
      ) : (
        <List
          style={{ height, width: '100%' }}
          rowCount={metas.length}
          rowHeight={70}
          rowComponent={Row}
          rowProps={{ metas, formatMoeda, handleDetalharMeta, handleDeleteMeta, STATUS_APURACAO_LABELS }}
        />
      )}
    </div>
  );
};
