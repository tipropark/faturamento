'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, Plus, ChevronDown, List, LayoutGrid, 
  ShoppingBag, TrendingUp, Settings, Zap, 
  CheckCircle2, Clipboard, Wrench, History, Layers,
  ChevronRight, ArrowUpRight, Filter, ExternalLink
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Link from 'next/link';

/**
 * PATRIMÔNIO MODULE - HIGH FIDELITY RECONSTRUCTION
 * This page uses the local Design System (globals.css) instead of Tailwind,
 * ensuring 100% visual consistency with the rest of the LEVE ERP.
 */

// --- Helpers ---
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

// Helper to remove accents for robust filtering
function normalizeText(str: string) {
  return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function PatrimonioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Fetching real data from API
  const { data: patrimonios, isValidating, mutate } = useSWR('/api/patrimonio', fetcher);

  // Stats Logic
  const stats = useMemo(() => {
    if (!patrimonios || !Array.isArray(patrimonios)) return { total: 0, ativos: 0, manutencao: 0, valorTotal: 'R$ 0,00' };
    
    let ativos = 0; let manutencao = 0; let valorTotal = 0;
    patrimonios.forEach((p: any) => {
      const s = normalizeText(p.status);
      if (s === 'em uso' || s === 'ativo') ativos++;
      if (s.includes('manutencao')) manutencao++;
      valorTotal += Number(p.valor_compra || 0);
    });
    
    return {
      total: patrimonios.length,
      ativos,
      manutencao,
      valorTotal: formatCurrency(valorTotal)
    };
  }, [patrimonios]);

  // Table Data Logic (Improved Filtering)
  const displayItems = useMemo(() => {
    if (!patrimonios || !Array.isArray(patrimonios)) return [];
    
    return patrimonios.filter((p: any) => {
      // 1. Search Filter (Multi-field)
      const search = normalizeText(searchTerm);
      const matchesSearch = !search || 
        normalizeText(p.nome).includes(search) || 
        normalizeText(p.codigo_patrimonio).includes(search) ||
        normalizeText(p.unidade || p.operacao?.nome_operacao).includes(search) ||
        normalizeText(p.marca).includes(search) ||
        normalizeText(p.numero_serie).includes(search);

      // 2. Status Filter
      const status = normalizeText(p.status);
      let matchesStatus = statusFilter === 'all';
      if (!matchesStatus) {
        if (statusFilter === 'Ativo') matchesStatus = (status === 'ativo' || status === 'em uso');
        else if (statusFilter === 'Inativo') matchesStatus = (status === 'baixado' || status === 'extraviado');
        else matchesStatus = status.includes(normalizeText(statusFilter));
      }

      // 3. Category Filter
      const category = normalizeText(p.categoria);
      const matchesCategory = categoryFilter === 'all' || category.includes(normalizeText(categoryFilter));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [patrimonios, searchTerm, statusFilter, categoryFilter]);

  return (
    <div className="patrimonio-page-container" style={{ paddingBottom: '120px' }}>
      
      {/* 1. HEADER SECTION */}
      <header className="page-header page-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            width: '56px', height: '56px', background: '#0C0C24', 
            borderRadius: '16px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' 
          }}>
            <Package size={28} />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Gestão de Patrimônio</h1>
            <p className="page-subtitle" style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Visão Consolidada de Ativos
            </p>
          </div>
        </div>
        <div className="page-actions">
           <Link href="/admin/patrimonio/novo" className="btn btn-primary" style={{ height: '52px', borderRadius: '14px', padding: '0 1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.5rem' }}>
                <Plus size={14} strokeWidth={4} />
              </div>
              Novo Ativo
           </Link>
        </div>
      </header>

      {/* 2. STATS GRID */}
      <div className="stats-grid" style={{ marginBottom: '3rem' }}>
        
        <div className="stat-card">
          <div className="flex flex-between" style={{ width: '100%' }}>
            <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div>
            <span className="stat-label">Total Ativos</span>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex flex-between" style={{ width: '100%' }}>
            <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <span className="stat-label">Em Uso</span>
            <div className="stat-value">{stats.ativos}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex flex-between" style={{ width: '100%' }}>
            <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#f97316' }}>
              <Settings size={20} />
            </div>
          </div>
          <div>
            <span className="stat-label">Manutenção</span>
            <div className="stat-value">{stats.manutencao}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex flex-between" style={{ width: '100%' }}>
            <div className="stat-icon-wrapper" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
              <Zap size={20} />
            </div>
          </div>
          <div>
            <span className="stat-label">Valor Total</span>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.valorTotal}</div>
          </div>
        </div>

      </div>

      {/* 3. MAIN DASHBOARD AREA */}
      <div className="dashboard-grid">
        
        <div className="card main-table-card">
          
          {/* FILTERS AREA */}
          <div className="filters-container">
            <div className="search-input-wrapper">
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por ID, Nome, Marca, Série ou Unidade..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 14px 14px 48px', background: '#F8F9FA', 
                  border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 
                }}
              />
            </div>
            <div className="selects-wrapper">
               <div style={{ position: 'relative' }}>
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   style={{ 
                     appearance: 'none', background: 'white', border: '1px solid var(--gray-200)', 
                     borderRadius: '12px', padding: '10px 32px 10px 16px', fontSize: '0.75rem', 
                     fontWeight: 700, color: 'var(--gray-500)', cursor: 'pointer' 
                   }}
                 >
                   <option value="all">Status: Todos</option>
                   <option value="Ativo">Ativos (Geral)</option>
                   <option value="Em Uso">Em Uso</option>
                   <option value="Manutenção">Manutenção</option>
                   <option value="Estoque">Em Estoque</option>
                   <option value="Inativo">Inativos / Baixados</option>
                 </select>
                 <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-300)' }} />
               </div>

               <div style={{ position: 'relative' }}>
                 <select 
                   value={categoryFilter}
                   onChange={(e) => setCategoryFilter(e.target.value)}
                   style={{ 
                     appearance: 'none', background: 'white', border: '1px solid var(--gray-200)', 
                     borderRadius: '12px', padding: '10px 32px 10px 16px', fontSize: '0.75rem', 
                     fontWeight: 700, color: 'var(--gray-500)', cursor: 'pointer' 
                   }}
                 >
                   <option value="all">Categoria: Todas</option>
                   <option value="TI">Tecnologia / TI</option>
                   <option value="Mobiliário">Mobiliário</option>
                   <option value="Veículo">Veículos</option>
                   <option value="Ferramenta">Ferramentas</option>
                   <option value="Eletrônico">Eletrônicos</option>
                 </select>
                 <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-300)' }} />
               </div>
            </div>
            <div style={{ display: 'flex', background: '#F8F9FA', padding: '4px', borderRadius: '10px' }}>
               <button style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--gray-300)', cursor: 'pointer' }}><List size={18} /></button>
               <button style={{ background: 'white', border: 'none', padding: '8px', color: '#0C0C24', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}><LayoutGrid size={18} /></button>
            </div>
          </div>

          <div className="table-responsive" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ background: 'none', borderBottom: '1px solid #F1F4F9' }}>TAG ID</th>
                  <th style={{ background: 'none', borderBottom: '1px solid #F1F4F9' }}>Nome Ativo</th>
                  <th style={{ background: 'none', borderBottom: '1px solid #F1F4F9' }}>Unidade / Operação</th>
                  <th style={{ background: 'none', borderBottom: '1px solid #F1F4F9', textAlign: 'center' }}>Status</th>
                  <th style={{ background: 'none', borderBottom: '1px solid #F1F4F9', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isValidating && displayItems.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)', fontWeight: 700 }}>Atualizando registros...</td></tr>
                ) : displayItems.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)', fontWeight: 700 }}>Nenhum patrimônio encontrado com estes filtros.</td></tr>
                ) : (
                  displayItems.map((item) => (
                    <tr key={item.id} style={{ cursor: 'default' }} className="table-row-hover">
                      <td style={{ fontWeight: 800, color: '#1a1e45' }}>{item.codigo_patrimonio || 'N/A'}</td>
                      <td>
                         <div style={{ fontWeight: 800, color: '#1a1e45', fontSize: '0.9rem' }}>{item.nome}</div>
                         <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>{item.categoria} • {item.marca || 'Sem Marca'}</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                         {item.operacao?.nome_operacao || item.unidade || 'Sede'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          <span className={`badge badge-${
                            normalizeText(item.status).includes('uso') || normalizeText(item.status).includes('ativo') ? 'success' : 
                            normalizeText(item.status).includes('manut') ? 'warning' : 'info'
                          }`} style={{ fontSize: '0.65rem', minWidth: '90px' }}>
                            {item.status}
                          </span>
                          
                          {/* Modern Arrow Icon pointing to Detail - requested color #0C0C24 */}
                          <Link href={`/admin/patrimonio/${item.id}`} style={{ 
                            color: '#0C0C24', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                          }} className="modern-arrow-link" title="Ver Detalhes">
                            <ArrowUpRight size={18} strokeWidth={2.5} />
                          </Link>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <Link href={`/admin/patrimonio/${item.id}`} style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px', borderRadius: '10px',
                          background: 'rgba(12, 12, 36, 0.05)', color: '#0C0C24',
                          transition: 'all 0.2s', textDecoration: 'none'
                        }} className="action-btn-hover">
                          <ChevronRight size={18} strokeWidth={3} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-sm btn-ghost" style={{ fontWeight: 800, color: 'var(--gray-300)' }}>Anterior</button>
            <button className="btn btn-primary btn-sm" style={{ minWidth: '36px', padding: 0, borderRadius: '10px' }}>1</button>
            <button className="btn btn-sm btn-ghost" style={{ fontWeight: 800, color: 'var(--gray-500)' }}>Próxima</button>
          </div>
        </div>

        {/* SIDE WIDGETS SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Alertas do Sistema</h3>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', 
              borderRadius: '20px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' 
            }}>
              <div style={{ width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <CheckCircle2 size={20} strokeWidth={3} />
              </div>
              <div>
                 <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#065f46' }}>Integridade OK</div>
                 <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', opacity: 0.8 }}>Nenhum desvio crítico hoje</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '2rem' }}>Ações Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: <Layers size={18} />, label: 'Categorias & Sub', href: '/admin/patrimonio/categorias' },
                { icon: <Clipboard size={18} />, label: 'Vistorias Recentes', href: '#' },
                { icon: <Wrench size={18} />, label: 'Fila de Reparos', href: '#' },
                { icon: <History size={18} />, label: 'Log de Movimentação', href: '#' },
              ].map((item, idx) => (
                <Link href={item.href} key={idx} style={{ 
                  width: '100%', background: '#F8F9FA', border: '1px solid transparent', padding: '14px 18px', 
                  borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none'
                }} className="quick-access-btn">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: 'var(--gray-300)' }}>{item.icon}</div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>{item.label}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. PREMIUM FOOTER */}
      <footer style={{ 
        position: 'fixed', bottom: 0, left: 'var(--sidebar-collapsed-width)', right: 0, 
        height: '100px', background: '#0C0C24', color: 'white', padding: '0 3.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 100,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
      }} className="mobile-hidden">
        <div style={{ display: 'flex', gap: '4rem' }}>
           <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.2rem', display: 'block', marginBottom: '4px' }}>Faturamento Imobilizado</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{stats.valorTotal}</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 8px', borderRadius: '8px', color: '#4ade80', fontSize: '0.75rem', fontWeight: 900 }}>
                <ArrowUpRight size={14} /> +2.4%
              </div>
            </div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '40px', alignSelf: 'center' }}></div>
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.2rem', display: 'block', marginBottom: '4px' }}>Volume de Ativos</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900 }}>{stats.total}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
           <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--gray-500)', letterSpacing: '0.05rem' }}>LEVE MOBILIDADE ERP</div>
           <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase' }}>Sistema Interno Corporativo</div>
        </div>
      </footer>

      {/* Global CSS Overrides */}
      <style jsx global>{`
        /* Page Layout & Mobile Design */
        .page-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5rem; align-items: start; }
        .main-table-card { grid-column: span 3; padding: 2.5rem; }
        .filters-container { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 2.5rem; align-items: center; }
        .search-input-wrapper { position: relative; flex: 1; min-width: 300px; }
        .selects-wrapper { display: flex; gap: 0.5rem; }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        
        @media (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .main-table-card { grid-column: span 1; }
        }

        @media (max-width: 768px) {
          .page-header-flex { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .search-input-wrapper { min-width: 100%; }
          .selects-wrapper { flex-direction: column; width: 100%; }
          .selects-wrapper > div { width: 100%; }
          .selects-wrapper select { width: 100%; }
          .main-table-card, .card { padding: 1.5rem !important; }
          footer.mobile-hidden { display: none !important; }
          .patrimonio-page-container { padding-bottom: 20px !important; }
        }

        .patrimonio-page-container { font-family: 'Outfit', sans-serif !important; animation: fadeIn 0.4s ease-out; }
        .quick-access-btn:hover { background: white !important; border-color: var(--gray-100) !important; transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .quick-access-btn:hover span { color: #0C0C24 !important; }
        .quick-access-btn:hover svg { color: #0C0C24 !important; }
        .action-btn-hover:hover { background: #0C0C24 !important; color: white !important; transform: scale(1.1); }
        .table-row-hover:hover { background: rgba(248, 249, 250, 0.8) !important; }
        .modern-arrow-link:hover { transform: translate(2px, -2px); opacity: 0.7; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) { footer.mobile-hidden { display: none !important; } }
      `}</style>
    </div>
  );
}
