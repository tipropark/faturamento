'use client';

import React from 'react';
import { 
  AlertTriangle, ChevronLeft, Boxes, 
  CheckCircle2, Info, Clock, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function PatrimonioAlertas() {
  const { data: alertas, mutate } = useSWR('/api/patrimonio/alertas', fetcher);

  const resolverAlerta = async (id: string) => {
    try {
      const res = await fetch('/api/patrimonio/alertas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Resolvido' })
      });
      if (res.ok) mutate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/admin/patrimonio" className="btn btn-secondary py-2" style={{ padding: '0.5rem' }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title text-warning">Alertas e Pendências</h1>
            <p className="page-subtitle">Ações urgentes e monitoramento de ativos</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl">
        {alertas && alertas.length > 0 ? (
          <div className="flex flex-col gap-4">
            {alertas.map((a: any) => (
              <div key={a.id} className="card alert-card-full flex flex-between items-center">
                <div className="flex items-start gap-4">
                  <div className={`alert-icon-box ${a.tipo_alerta?.toLowerCase().includes('manutenção') ? 'bg-orange' : 'bg-red'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted">{a.tipo_alerta}</span>
                      <span className="dot"></span>
                      <span className="text-xs text-muted">Vencimento: {new Date(a.data_alerta).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{a.descricao}</h3>
                    <div className="flex items-center gap-3">
                      <div className="asset-tag-inline">
                        <Boxes size={14} />
                        {a.patrimonio?.codigo_patrimonio}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{a.patrimonio?.nome}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs text-muted">{a.patrimonio?.operacao?.nome_operacao || 'Sede'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/patrimonio/${a.patrimonio_id}`} className="btn btn-secondary btn-sm">
                    Ver Ativo
                  </Link>
                  <button onClick={() => resolverAlerta(a.id)} className="btn btn-success btn-sm">
                    <CheckCircle2 size={14} />
                    Resolver
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <section className="card p-20 text-center">
            <CheckCircle2 size={64} className="text-success mb-4" style={{ margin: '0 auto', opacity: 0.2 }} />
            <h2 className="text-xl font-bold text-gray-800">Sem alertas pendentes</h2>
            <p className="text-muted">Todos os ativos estão operando dentro da normalidade.</p>
            <Link href="/admin/patrimonio" className="btn btn-primary mt-6 inline-flex">Voltar ao Painel</Link>
          </section>
        )}
      </div>

      <style jsx>{`
        .alert-card-full {
          padding: 1.5rem;
          border-left: 6px solid var(--warning);
          transition: transform 0.2s;
        }
        .alert-card-full:hover { transform: translateX(8px); }
        .alert-icon-box {
          padding: 1rem;
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .bg-orange { background: #f59e0b; }
        .bg-red { background: #ef4444; }
        .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gray-300); }
        .asset-tag-inline {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 10px;
          background: var(--brand-primary-light);
          color: var(--brand-primary);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .btn-success { background: #10b981; color: white; border: none; }
        .btn-success:hover { background: #059669; }
      `}</style>
    </div>
  );
}
