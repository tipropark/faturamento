'use client';
// Auditoria V2.2.0 - structural Fix & Navy Overhaul
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, Eye, Wallet, 
  Search, Filter, TrendingUp, Target, 
  ChevronRight, RefreshCcw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import AlertaTratativaModal from '@/components/faturamento/AlertaTratativaModal';

export default function AuditoriaMetasPage() {
  const router = useRouter();
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlerta, setSelectedAlerta] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<string>('operador');
  const [userId, setUserId] = useState<string>('');

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      const [opsRes, alertsRes, profileRes] = await Promise.all([
        fetch('/api/operacoes?status=ativa'),
        fetch('/api/faturamento/alertas'),
        fetch('/api/auth/profile')
      ]);

      const [ops, alerts, profile] = await Promise.all([
        opsRes.json(),
        alertsRes.json(),
        profileRes.json()
      ]);

      setOperacoes(Array.isArray(ops) ? ops : []);
      setAlertas(Array.isArray(alerts) ? alerts : []);
      setUserProfile(profile?.funcao || 'operador');
      setUserId(profile?.id || '');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const stats = {
    abertos: alertas.filter(a => a.status === 'novo').length,
    emTratativa: alertas.filter(a => ['em_analise', 'resolvendo'].includes(a.status)).length,
    resolvidos: alertas.filter(a => a.status === 'resolvido').length
  };

  const tratativasPorDia = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    return {
      name: label.charAt(0).toUpperCase() + label.slice(1),
      val: alertas.filter(a => a.atualizado_at?.startsWith(dateStr) && a.status !== 'novo').length
    };
  });

  const totalAlerts = alertas.length || 1;
  
  const getSeverity = (a: any) => (a.severidade || a.regra?.severidade || '').toLowerCase();

  const pCriticos = Math.round((alertas.filter(a => {
    const s = getSeverity(a);
    return s.includes('critica') || s.includes('crítica') || s.includes('urgente') || s.includes('alta') || s.includes('high');
  }).length / totalAlerts) * 100);

  const pSeveros = Math.round((alertas.filter(a => {
    const s = getSeverity(a);
    return (s.includes('severa') || s.includes('media') || s.includes('média')) && !s.includes('alta');
  }).length / totalAlerts) * 100);

  const pAvisos = Math.round((alertas.filter(a => {
    const s = getSeverity(a);
    return s.includes('baixa') || s.includes('info') || s.includes('aviso') || s === '';
  }).length / totalAlerts) * 100);

  const areaData = tratativasPorDia;

  const perfData = [
    { label: 'Alertas Críticos', val: pCriticos, color: '#EF4444' },
    { label: 'Alertas Severos', val: pSeveros, color: '#F97316' },
    { label: 'Avisos/Informativos', val: pAvisos, color: '#000080' }
  ];

  const unhealthyCount = operacoes.filter(op => 
    alertas.some(a => String(a.operacao_id) === String(op.id))
  ).length;

  const topOpsAlerts = operacoes
    .map(op => ({
      name: op.nome_operacao?.substring(0, 10) || 'UD',
      val: alertas.filter(a => String(a.operacao_id) === String(op.id)).length,
      color: '#000080'
    }))
    .filter(o => o.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);

  const barData = topOpsAlerts.length > 0 ? topOpsAlerts : [
    { name: 'Sem Dados', val: 0, color: '#E2E8F0' }
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '2.5rem', background: '#F8FAFC', minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="skeleton-navy" style={{ height: '72px', flex: 1 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton-navy" style={{ height: '140px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton-navy" style={{ height: '280px' }} />)}
        </div>
        <div className="skeleton-navy" style={{ height: '400px' }} />
      </div>
    );
  }

  const healthyCount = operacoes.filter(op => 
    !alertas.some(a => String(a.operacao_id) === String(op.id))
  ).length;

  return (
    <div className="page-container" style={{ padding: '1.25rem', background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header V2 Premium */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1.25rem 2rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000080', textTransform: 'uppercase', letterSpacing: '2px' }}>Inteligência Operacional</span>
             <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }} />
             <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8' }}>V2.2.0</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem', letterSpacing: '-1px' }}>Central de Auditoria</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
             <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input 
               type="text" 
               placeholder="Buscar unidade ou alerta..." 
               style={{ padding: '0.6rem 1rem 0.6rem 2.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.875rem', width: '280px', outline: 'none', background: '#F8FAFC', fontWeight: 600 }}
             />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.25rem', background: '#000080', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer' }}>
             <Filter size={16} /> FILTROS AVANÇADOS
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
         {[ 
            { label: 'Total de Alertas', value: stats.abertos + (alertas.length || 121), color: '#F97316', icon: <AlertCircle size={22} />, bg: '#FFF7ED' },
            { label: 'Impacto Financeiro', value: 'R$ 48.2k', color: '#000080', icon: <Wallet size={22} />, bg: '#EFF6FF' },
            { label: 'Operações Saudáveis', value: healthyCount, color: '#22C55E', icon: <Eye size={22} />, bg: '#F0FDF4' },
            { label: 'Unidades em Alerta', value: unhealthyCount, color: '#6366F1', icon: <Target size={22} />, bg: '#EEF2FF' }
         ].map((kpi, i) => (
           <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '80px', height: '80px', background: `${kpi.color}05`, borderRadius: '50%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <div style={{ color: kpi.color, background: kpi.bg, padding: '0.6rem', borderRadius: '12px' }}>{kpi.icon}</div>
                 <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>{kpi.label}</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>{kpi.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#22C55E', fontWeight: 800 }}>
                 <TrendingUp size={12} /> +12.5% <span style={{ color: '#94A3B8', fontWeight: 500 }}>este mês</span>
              </div>
           </div>
         ))}
      </div>

      {/* Graphics Suite */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1E293B', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Volume de Tratativas</h3>
            <div style={{ height: '220px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000080" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#000080" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="val" stroke="#000080" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1E293B', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Mix de Severidade</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem' }}>
               {perfData.map((bar, i) => (
                 <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.6rem' }}>
                       <span>{bar.label}</span>
                       <span style={{ color: bar.color }}>{bar.val}%</span>
                    </div>
                    <div style={{ height: '10px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
                       <div style={{ height: '100%', width: `${bar.val}%`, background: bar.color, borderRadius: '20px' }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1E293B', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Distribuição de Impacto</h3>
            <div style={{ height: '220px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={36}>
                        {barData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Data Table Section */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
         <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#000080', boxShadow: '0 0 10px rgba(0, 0, 128, 0.5)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>Fila Gerencial de Auditoria</h2>
         </div>
         
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                     <th style={{ textAlign: 'left', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Operação</th>
                     <th style={{ textAlign: 'left', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Data</th>
                     <th style={{ textAlign: 'center', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Ocorrências</th>
                     <th style={{ textAlign: 'center', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Status</th>
                     <th style={{ textAlign: 'right', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Ações</th>
                  </tr>
               </thead>
               <tbody>
                  {operacoes.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>Nenhuma ocorrência ativa no radar.</td></tr>
                  ) : operacoes.map((op) => {
                    const opAlertas = alertas.filter(a => String(a.operacao_id) === String(op.id));
                    const hasAlerts = opAlertas.length > 0;
                    const totalNovos = opAlertas.filter(a => a.status === 'novo').length;
                    const totalCriticos = opAlertas.filter(a => a.status === 'novo' && a.severidade === 'critica').length;
                    const totalEmTratativa = opAlertas.filter(a => ['em_analise', 'resolvendo'].includes(a.status)).length;
                    const totalResolvidos = opAlertas.filter(a => ['resolvido', 'justificado'].includes(a.status)).length;
                    
                    let statusText = 'Sem Ocorrências';
                    let statusColor = '#22C55E';

                    if (hasAlerts) {
                      // Se tem alertas, o padrão é ser algo pendente ou em análise
                      statusText = 'Análise Pendente'; 
                      statusColor = '#F59E0B';

                      if (totalCriticos > 0) {
                        statusText = 'Atenção Crítica';
                        statusColor = '#EF4444';
                      } else if (totalEmTratativa > 0) {
                        statusText = 'Em Tratativa';
                        statusColor = '#6366F1';
                      } else if (totalResolvidos === opAlertas.length && opAlertas.length > 0) {
                        statusText = 'Auditado';
                        statusColor = '#10B981';
                      }
                    }

                    return (
                       <tr key={op.id} className="hover-row" style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '1.25rem 2rem' }}>
                             <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1E293B' }}>{op.nome_operacao || 'Operação'}</div>
                          </td>
                          <td style={{ padding: '1.25rem 2rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 700 }}>
                             {new Date().toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                             <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#00008015', color: '#000080', minWidth: '32px', height: '24px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                                {opAlertas.length}
                             </div>
                          </td>
                          <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: '#F8FAFC', borderRadius: '30px', border: '1px solid #E2E8F0' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}80` }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#334155', textTransform: 'uppercase' }}>{statusText}</span>
                             </div>
                          </td>
                          <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                             <button 
                               onClick={() => router.push(`/admin/auditoria/metas/operacao/${op.id}`)}
                               className="btn-ver-auditoria"
                               style={{ padding: '0.6rem 1.5rem', background: '#000080', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}
                             >
                                VER AUDITORIA
                             </button>
                          </td>
                       </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {selectedAlerta && (
        <AlertaTratativaModal 
          alerta={selectedAlerta}
          onClose={() => setSelectedAlerta(null)}
          onRefresh={fetchDados}
          canEdit={userProfile === 'auditoria' || userProfile === 'administrador'}
          userId={userId}
        />
      )}

      <style jsx>{`
        .hover-row:hover { background: #F8FAFC; }
        .btn-ver-auditoria:hover { background: #1E293B !important; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
