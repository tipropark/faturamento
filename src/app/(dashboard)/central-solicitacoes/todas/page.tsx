'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus,
  Download,
  Calendar,
  Building2,
  Tag,
  Clock,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function TodasSolicitacoesPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">Todas as Solicitações</h1>
          <p className="page-subtitle">Relação completa de chamados e históricos corporativos</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Download size={18} /> Exportar
          </button>
          <Link href="/central-solicitacoes/nova" className="btn btn-primary">
            <Plus size={18} /> Nova Solicitação
          </Link>
        </div>
      </header>

      {/* Área de Filtros Standard */}
      <section className="filters-card">
        <div className="filters-grid">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="form-control search-input" 
              placeholder="Protocolo, assunto ou solicitante..." 
            />
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label">Status</label>
            <select className="form-control">
              <option value="">Todos os Status</option>
              <option value="novo">Novo</option>
              <option value="atendimento">Em Atendimento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Departamento</label>
            <select className="form-control">
              <option value="">Todos os Departamentos</option>
              <option value="ti">T.I.</option>
              <option value="rh">R.H.</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </div>

          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className={`btn ${filterOpen ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={18} /> Filtros
          </button>
        </div>

        {filterOpen && (
          <div className="grid grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-100">
            <div className="form-group">
              <label className="form-label">Prioridade</label>
              <select className="form-control">
                <option value="">Todas</option>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="normal">Normal</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Período</label>
              <input type="date" className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Unidade</label>
              <select className="form-control">
                <option value="">Todas as Unidades</option>
              </select>
            </div>
            <div className="form-group flex items-end">
              <button className="btn btn-primary w-full">Aplicar</button>
            </div>
          </div>
        )}
      </section>

      {/* Tabela de Solicitações Standard */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Assunto</th>
                <th>Depto / Orgem</th>
                <th>Solicitante</th>
                <th>Status / SLA</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i}>
                  <td>
                    <div className="cell-code">SOL-2024-{1000 + i}</div>
                    <div className="cell-sub">12/10/24 • 14:35</div>
                  </td>
                  <td>
                    <div className="cell-main" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Solicitação de novo computador para colaborador adm
                    </div>
                    <div className="cell-sub flex items-center gap-1">
                      <Building2 size={12} /> Curitiba Store 02
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-gray-700">T.I.</div>
                    <div className="cell-sub flex items-center gap-1">
                      <Tag size={12} /> Hardware
                    </div>
                  </td>
                  <td>
                    <div className="cell-main">Ricardo Santos</div>
                    <div className="cell-sub">Supervisor</div>
                  </td>
                  <td>
                    <div className="mb-2">
                       <span className="badge badge-status-atendimento"><span className="badge-dot" />Atendimento</span>
                    </div>
                    <div className="flex items-center gap-2 text-success font-bold text-xs">
                      <Clock size={12} /> 14h 25m restantes
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex justify-end gap-2">
                      <Link href={`/central-solicitacoes/${i}`} className="btn btn-secondary btn-sm">
                        Ver Canal
                      </Link>
                      <button className="btn btn-secondary btn-icon btn-sm">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação Standard (New CSS classes) */}
        <div className="pagination-container">
          <span className="pagination-info">Mostrando 8 de 45 solicitações</span>
          <div className="pagination-actions">
            <button className="pagination-btn" disabled>Anterior</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}
