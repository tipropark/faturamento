'use client';

import React from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Download,
  Filter,
  Users,
  Building2,
  Clock,
  Star,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const dataDeptos = [
  { name: 'TI', value: 45 },
  { name: 'RH', value: 28 },
  { name: 'Financeiro', value: 15 },
  { name: 'Operações', value: 42 },
  { name: 'Auditoria', value: 12 },
];

const dataSLA = [
  { name: 'No Prazo', value: 85, color: 'var(--success)' },
  { name: 'Fora do Prazo', value: 15, color: 'var(--danger)' },
];

const dataVolumeMensal = [
  { mes: 'Out', volume: 120 },
  { mes: 'Nov', volume: 145 },
  { mes: 'Dez', volume: 132 },
  { mes: 'Jan', volume: 168 },
  { mes: 'Fev', volume: 155 },
  { mes: 'Mar', volume: 192 },
];

const COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#6B7280'];

export default function CentralRelatoriosPage() {
  return (
    <div className="relatorios-content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Relatórios da Central</h1>
          <p className="page-subtitle">Análise executiva de produtividade e atendimento</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" style={{ borderRadius: '12px' }}>
            <Download size={18} />
            Baixar PDF
          </button>
          <button className="btn-secondary" style={{ borderRadius: '12px' }}>
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros de Relatório */}
      <div className="filters-card" style={{ padding: '1.25rem' }}>
        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label">Período</label>
            <select className="form-control" style={{ borderRadius: '10px' }}>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="this_month">Este Mês</option>
              <option value="last_month">Mês Passado</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Departamento</label>
            <select className="form-control" style={{ borderRadius: '10px' }}>
              <option value="">Todos</option>
              <option value="ti">TI</option>
              <option value="rh">RH</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Responsável</label>
            <select className="form-control" style={{ borderRadius: '10px' }}>
              <option value="">Todos</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button className="btn-primary" style={{ flex: 1, borderRadius: '10px', height: '44px' }}>
              <Filter size={18} />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2.5rem' 
        }}
      >
        {[
          { label: 'Tempo Médio 1ª Resp.', value: '18m', icon: Clock, color: 'var(--info)' },
          { label: 'Tempo Médio Resolução', value: '1d 4h', icon: TrendingUp, color: 'var(--brand-primary)' },
          { label: 'Avaliação Média', value: '4.8/5', icon: Star, color: 'var(--warning)' },
          { label: 'Taxa de SLA', value: '92%', icon: BarChart3, color: 'var(--success)' },
        ].map((metrica) => (
          <div key={metrica.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-label">{metrica.label}</div>
                <div className="stat-value">{metrica.value}</div>
              </div>
              <div style={{ color: metrica.color, background: 'var(--gray-50)', padding: '12px', borderRadius: '12px' }}>
                <metrica.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Volume Mensal */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Evolução de Volume</h3>
            <LineChartIcon size={20} color="var(--gray-300)" />
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={dataVolumeMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-100)" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--gray-400)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--gray-400)' }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="var(--brand-primary)" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: 'var(--brand-primary)', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Depto */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Solicitações por Setor</h3>
            <BarChart3 size={20} color="var(--gray-300)" />
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={dataDeptos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--gray-100)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--gray-700)' }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} barSize={20}>
                  {dataDeptos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Pie Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>Aderência ao SLA</h3>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ width: '200px', height: '200px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={dataSLA}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataSLA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {dataSLA.map(item => (
                <div key={item.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 700 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: item.color }}></div>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, paddingLeft: '20px' }}>{item.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ranking de Categorias */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Ranking por Categoria</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { cat: 'Acesso a Sistema', count: 42, depto: 'TI' },
              { cat: 'Ajuste Operacional', count: 35, depto: 'Operações' },
              { cat: 'Pedido de Férias', count: 18, depto: 'RH' },
              { cat: 'Suporte Impressora', count: 15, depto: 'TI' },
              { cat: 'Reembolso Viagem', count: 12, depto: 'Financeiro' },
            ].map((item, idx) => (
              <div key={item.cat} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '10px' }}>
                <div style={{ width: '24px', fontWeight: 800, color: 'var(--gray-400)' }}>#{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.cat}</div>
                  <div className="cell-sub">{item.depto}</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
