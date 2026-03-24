import React from 'react';
import { List } from 'react-window';

interface Ticket {
  id: string;
  data_entrada?: string;
  data_saida?: string;
  criado_em?: string;
  tipo_movimento?: string;
  forma_pagamento?: string;
  valor: number;
  placa?: string;
}

interface VirtualTicketsTableProps {
  tickets: Ticket[];
  height: number;
  formatarMoeda: (val: number) => string;
}

export const VirtualTicketsTable: React.FC<VirtualTicketsTableProps> = ({ tickets, height, formatarMoeda }) => {
  const Row = ({ index, style, tickets, formatarMoeda }: any) => {
    const t = tickets[index];
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', padding: '0 1rem' }}>
        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <div className="font-bold text-gray-900">{t.placa || 'Sem Placa'}</div>
          <div className="text-xs text-muted">{t.id.substring(0, 8)}</div>
        </div>
        <div style={{ flex: 1.5 }}>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{t.data_entrada ? new Date(t.data_entrada).toLocaleString('pt-BR') : '-'}</div>
          <div className="font-bold text-gray-800" style={{ fontSize: '0.8rem' }}>{t.data_saida ? new Date(t.data_saida).toLocaleString('pt-BR') : '-'}</div>
        </div>
        <div style={{ width: '100px' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{t.tipo_movimento || 'N/A'}</span>
        </div>
        <div style={{ width: '120px' }}>
          <span className="text-xs font-bold text-uppercase">{t.forma_pagamento || 'Crédito/Débito'}</span>
        </div>
        <div style={{ width: '100px', textAlign: 'right', fontWeight: 700, color: 'var(--gray-900)' }}>
          {t.tipo_movimento === 'Despesa' ? '-' : ''}{formatarMoeda(Number(t.valor))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
      <header style={{ display: 'flex', background: 'var(--gray-50)', padding: '0.75rem 1rem', borderBottom: '2px solid var(--gray-100)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>
        <div style={{ flex: 1 }}>Código / Placa</div>
        <div style={{ flex: 1.5 }}>Entrada / Saída</div>
        <div style={{ width: '100px' }}>Tipo</div>
        <div style={{ width: '120px' }}>Pagamento</div>
        <div style={{ width: '100px', textAlign: 'right' }}>Valor</div>
      </header>
      <List
        style={{ height, width: '100%' }}
        rowCount={tickets.length}
        rowHeight={50}
        rowComponent={Row}
        rowProps={{ tickets, formatarMoeda }}
      />
      {tickets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>
          Sem movimentações carregadas.
        </div>
      )}
    </div>
  );
};
