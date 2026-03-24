'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Tags, 
  Layers, 
  Settings2, 
  Flag, 
  Clock, 
  Edit3, 
  Users,
  LayoutGrid
} from 'lucide-react';

const configCards = [
  { 
    title: 'Departamentos', 
    description: 'Gerenciar setores que recebem solicitações (TI, RH, etc.)', 
    icon: Building2, 
    href: '/central-solicitacoes/configuracoes/departamentos',
    color: '#3B82F6'
  },
  { 
    title: 'Categorias e Subcategorias', 
    description: 'Tipos de chamados e agrupamentos por setor', 
    icon: Tags, 
    href: '/central-solicitacoes/configuracoes/categorias',
    color: '#EC4899'
  },
  { 
    title: 'Status', 
    description: 'Personalizar ciclos de vida das solicitações', 
    icon: Layers, 
    href: '/central-solicitacoes/configuracoes/status',
    color: '#8B5CF6'
  },
  { 
    title: 'Prioridades', 
    description: 'Níveis de urgência e impacto', 
    icon: Flag, 
    href: '/central-solicitacoes/configuracoes/prioridades',
    color: '#F59E0B'
  },
  { 
    title: 'Regras de SLA', 
    description: 'Definir prazos de atendimento e conclusão', 
    icon: Clock, 
    href: '/central-solicitacoes/configuracoes/sla',
    color: '#10B981'
  },
  { 
    title: 'Campos Dinâmicos', 
    description: 'Configurar campos específicos por tipo de chamado', 
    icon: Edit3, 
    href: '/central-solicitacoes/configuracoes/campos',
    color: '#0EA5E9'
  },
  { 
    title: 'Equipes Responsáveis', 
    description: 'Vincular usuários e gestores aos departamentos', 
    icon: Users, 
    href: '/central-solicitacoes/configuracoes/equipes',
    color: '#6366F1'
  },
];

export default function CentralConfiguracoesPage() {
  return (
    <div className="configs-content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Configurações da Central</h1>
          <p className="page-subtitle">Personalize o funcionamento do módulo de solicitações</p>
        </div>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {configCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.href} 
              href={card.href}
              style={{ textDecoration: 'none' }}
            >
              <div 
                className="card" 
                style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: '1.25rem',
                  padding: '1.5rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = card.color;
                  e.currentTarget.style.boxShadow = `0 12px 24px -8px ${card.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    background: `${card.color}15`, 
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '4px', color: 'var(--gray-900)' }}>{card.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 500, lineHeight: '1.4' }}>{card.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
