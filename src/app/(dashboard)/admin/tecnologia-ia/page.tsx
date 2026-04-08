'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, RefreshCcw, ShoppingCart, BookOpen, Terminal, Globe,
  ChevronRight, Activity, ParkingCircle
} from 'lucide-react';

const modules = [
  {
    id: 'cotas-api-ia',
    href: '/admin/tecnologia-ia/cotas-ia',
    icon: <Zap size={24} />,
    label: 'Cotas de API de IA',
    description: 'Monitoramento de consumo e custos dos modelos generativos.',
    badge: 'Financeiro',
    badgeColor: '#6366F1',
    accent: '#6366F1',
    bg: '#EEF2FF',
    features: ['Tokens', 'Budget', 'Rate Limit'],
  },
  {
    id: 'sincronizacao-faturamento',
    href: '/admin/tecnologia-ia/sincronizacoes',
    icon: <RefreshCcw size={24} />,
    label: 'Sincronização de Dados',
    description: 'Status e integridade das rotinas de faturamento externo.',
    badge: 'Operacional',
    badgeColor: '#10B981',
    accent: '#10B981',
    bg: '#ECFDF5',
    features: ['Status', 'Logs', 'Auto-Sync'],
  },
  {
    id: 'gerador-sc',
    href: '/admin/tecnologia-ia/gerador-sc',
    icon: <ShoppingCart size={24} />,
    label: 'Gerador de SC',
    description: 'Automação de solicitações de compra via suprimentos.',
    badge: 'Admin',
    badgeColor: '#F59E0B',
    accent: '#F59E0B',
    bg: '#FFFBEB',
    features: ['Aprovação', 'Histórico', 'PDF'],
  },
  {
    id: 'documentacao-sistema',
    href: '/admin/tecnologia-ia/documentacao',
    icon: <BookOpen size={24} />,
    label: 'Documentação ERP',
    description: 'Manuais técnicos e guias de usuário atualizados.',
    badge: 'Wiki',
    badgeColor: '#1E293B',
    accent: '#1E293B',
    bg: '#F1F5F9',
    features: ['Diagramas', 'Guides', 'v4.2'],
  },
  {
    id: 'prompts',
    href: '/admin/tecnologia-ia/prompts',
    icon: <Terminal size={24} />,
    label: 'Biblioteca de Prompts',
    description: 'Gestão de prompts focados em engenharia de dados.',
    badge: 'IA Experts',
    badgeColor: '#8B5CF6',
    accent: '#8B5CF6',
    bg: '#F5F3FF',
    features: ['Templates', 'Versioning', 'Lab'],
  },
  {
    id: 'links-internet',
    href: '/admin/tecnologia-ia/links',
    icon: <Globe size={24} />,
    label: 'Links de Internet',
    description: 'Status de conectividade em tempo real por unidade.',
    badge: 'Infra',
    badgeColor: '#EF4444',
    accent: '#EF4444',
    bg: '#FEF2F2',
    features: ['Uptime', 'Latência', 'Redes'],
  },
  {
    id: 'logs-control-xrm',
    href: '/admin/tecnologia-ia/logs-xrm',
    icon: <Activity size={24} />,
    label: 'Logs Control-XRM',
    description: 'Monitoramento técnico da integração de faturamento externo.',
    badge: 'Logística',
    badgeColor: '#0ea5e9',
    accent: '#0ea5e9',
    bg: '#f0f9ff',
    features: ['Real-time', 'Erros', 'Payloads'],
  },
  {
    id: 'logs-cloudpark',
    href: '/admin/tecnologia-ia/logs-cloudpark',
    icon: <ParkingCircle size={24} />,
    label: 'Logs CloudPark',
    description: 'Monitoramento da integração push de movimentos de estacionamento.',
    badge: 'Integração',
    badgeColor: '#8b5cf6',
    accent: '#8b5cf6',
    bg: '#f5f3ff',
    features: ['Push API', 'Erros', 'Payloads'],
  },
];

export default function TecnologiaIAHubPage() {
  const router = useRouter();

  return (
    <div style={{ width: '100%' }}>
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Tecnologia & IA</h1>
          <p className="page-subtitle">Central de Gestão Técnica e Inteligência Artificial</p>
        </div>
      </header>

      <div className="modules-grid-layout">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => router.push(mod.href)}
            className="tech-module-card"
          >
            <div className="card-top">
              <div className="icon-box" style={{ background: mod.bg, color: mod.accent }}>
                {mod.icon}
              </div>
              <div className="card-badge" style={{ background: `${mod.badgeColor}10`, color: mod.badgeColor, border: `1px solid ${mod.badgeColor}20` }}>
                {mod.badge}
              </div>
            </div>

            <h2 className="card-label">
              {mod.label}
            </h2>
            <p className="card-description">
              {mod.description}
            </p>

            <div className="card-features">
              {mod.features.map(f => (
                <span key={f} className="feature-pill">
                  {f}
                </span>
              ))}
            </div>

            <div className="card-footer" style={{ color: mod.accent }}>
              Abrir Módulo
              <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .modules-grid-layout {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          width: 100%;
          align-items: stretch;
          margin-top: 1rem;
        }

        .tech-module-card {
          all: unset;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          padding: 1.15rem;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          height: auto;
        }

        .tech-module-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--brand-primary-light);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .icon-box {
          padding: 0.5rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-badge {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          letter-spacing: 0.4px;
        }

        .card-label {
          font-size: 1rem;
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 0.4rem;
          letter-spacing: -0.2px;
        }

        .card-description {
          font-size: 0.75rem;
          color: var(--gray-500);
          line-height: 1.4;
          margin-bottom: 1rem;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-bottom: 1rem;
        }

        .feature-pill {
          font-size: 0.6rem;
          fontWeight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: var(--gray-50);
          color: var(--gray-500);
          border: 1px solid var(--gray-100);
        }

        .card-footer {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-weight: 800;
          font-size: 0.7rem;
          margin-top: auto;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* App-First Responsive logic */
        @media (max-width: 1200px) {
          .modules-grid-layout {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .modules-grid-layout {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .modules-grid-layout {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .tech-module-card {
            padding: 1.5rem;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }

          .icon-box {
             padding: 0.75rem;
             border-radius: 12px;
          }
          
          .card-label { font-size: 1.15rem; }
          .card-description { font-size: 0.85rem; -webkit-line-clamp: unset; }
          .feature-pill { font-size: 0.7rem; padding: 4px 10px; border-radius: 8px; }
          .card-footer { font-size: 0.8rem; padding-top: 0.75rem; border-top: 1px solid var(--gray-50); }
        }
      `}</style>
    </div>
  );
}
