'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  MapPin, 
  User, 
  Search, 
  Calendar, 
  FileText, 
  ChevronLeft,
  Filter,
  ArrowRight
} from 'lucide-react';
import { formatarData } from '@/lib/utils';

export default function SinistrosRelatoriosPage() {
  const router = useRouter();
  const [filtros, setFiltros] = useState({
    data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    data_fim: new Date().toISOString().split('T')[0],
    operacao_id: '',
    supervisor_id: '',
    uf: '',
    status: ''
  });

  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [supervisores, setSupervisores] = useState<any[]>([]);
  const [dados, setDados] = useState<any>({
    total: 0,
    porOperacao: [],
    porSupervisor: [],
    porEstado: []
  });
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams(filtros);
    const res = await fetch(`/api/sinistros/relatorios?${params.toString()}`);
    const data = await res.json();
    setDados(data);
    setCarregando(false);
  }, [filtros]);

  const carregarFiltros = async () => {
    const [resOp, resSup] = await Promise.all([
      fetch('/api/operacoes'),
      fetch('/api/usuarios?perfil=supervisor')
    ]);
    setOperacoes(await resOp.json());
    setSupervisores(await resSup.json());
  };

  useEffect(() => {
    carregarFiltros();
    carregarDados();
  }, [carregarDados]);

  return (
    <div className="page-body">
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: '0.5rem', paddingLeft: 0 }}>
            <ChevronLeft size={16} /> Voltar
          </button>
          <h1 className="page-title">Relatórios de Sinistros</h1>
          <p className="page-subtitle">Indicadores consolidados e análise de ocorrências</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label"><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Período Início</label>
              <input type="date" className="form-control" value={filtros.data_inicio} onChange={e => setFiltros({...filtros, data_inicio: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label"><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Período Fim</label>
              <input type="date" className="form-control" value={filtros.data_fim} onChange={e => setFiltros({...filtros, data_fim: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Operação</label>
              <select className="form-control" value={filtros.operacao_id} onChange={e => setFiltros({...filtros, operacao_id: e.target.value})}>
                <option value="">Todas</option>
                {operacoes.map(o => <option key={o.id} value={o.id}>{o.nome_operacao}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supervisor</label>
              <select className="form-control" value={filtros.supervisor_id} onChange={e => setFiltros({...filtros, supervisor_id: e.target.value})}>
                <option value="">Todos</option>
                {supervisores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
             <button className="btn btn-primary" onClick={carregarDados}>
               <Filter size={16} /> Aplicar Filtros
             </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon purple"><FileText size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total de Sinistros</div>
            <div className="stat-value">{dados.total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><MapPin size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Estados Atendidos</div>
            <div className="stat-value">{dados.porEstado?.length || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><BarChart size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Média por Operação</div>
            <div className="stat-value">{(dados.total / (dados.porOperacao?.length || 1)).toFixed(1)}</div>
          </div>
        </div>
      </div>

      <div className="form-grid form-grid-2">
        {/* Relatório por Operação */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sinistros por Operação</div>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Operação</th>
                    <th style={{ textAlign: 'right' }}>Qtd. Sinistros</th>
                    <th style={{ width: '40%' }}>Barra</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.porOperacao.map((item: any) => (
                    <tr key={item.nome}>
                      <td>{item.nome}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.qtd}</td>
                      <td>
                        <div style={{ width: '100%', height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                           <div style={{ width: `${(item.qtd / dados.total) * 100}%`, height: '100%', background: 'var(--brand-primary)' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dados.porOperacao.length === 0 && <tr><td colSpan={3} className="table-empty">Sem dados no período.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Relatório por Supervisor */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sinistros por Supervisor</div>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Supervisor</th>
                    <th style={{ textAlign: 'right' }}>Qtd. Sinistros</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.porSupervisor.map((item: any) => (
                    <tr key={item.nome}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} color="var(--gray-400)" /> {item.nome}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.qtd}</td>
                    </tr>
                  ))}
                  {dados.porSupervisor.length === 0 && <tr><td colSpan={2} className="table-empty">Sem dados no período.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Relatório por Estado */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sinistros por Estado (UF)</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
              {dados.porEstado.map((item: any) => (
                <div key={item.nome} style={{ 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)', 
                  background: 'var(--gray-50)', 
                  textAlign: 'center',
                  border: '1px solid var(--gray-100)'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{item.nome}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>{item.qtd} sinistros</div>
                </div>
              ))}
              {dados.porEstado.length === 0 && <div className="table-empty" style={{ gridColumn: '1 / -1' }}>Sem dados.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
