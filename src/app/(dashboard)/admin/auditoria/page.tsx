'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, BrainCircuit, ChevronRight, ShieldCheck, Sparkles
} from 'lucide-react';

const modules = [
  {
    id: 'faturamento',
    href: '/admin/auditoria/faturamento',
    icon: <BarChart3 size={32} />,
    label: 'Auditoria de Faturamento',
    description: 'Inteligência operacional em tempo real. Monitore alertas, desvios de meta e acione tratativas para cada unidade.',
    badge: 'Operacional',
    badgeColor: '#000080',
    accent: 'var(--brand-primary)',
    bg: 'var(--brand-primary-light)',
    features: ['KPIs Consolidados', 'Fila de Auditoria', 'Tratativas por Unidade', 'Alertas em Tempo Real'],
  },
  {
    id: 'auditor-senior',
    href: '/admin/auditoria/auditor-senior',
    icon: <BrainCircuit size={32} />,
    label: 'Auditor Sênior IA',
    description: 'Análise profunda assistida por inteligência artificial. Identifique padrões suspeitos, riscos ocultos e gere laudos de auditoria automatizados.',
    badge: 'IA Premium',
    badgeColor: '#6366F1',
    accent: '#6366F1',
    bg: '#EEF2FF',
    features: ['Análise por IA', 'Detecção de Anomalias', 'Laudo Automatizado', 'Score de Risco'],
  },
];

export default function AuditoriaHubPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Central de Governança
            </span>
          </div>
          <h1 className="page-title">Auditoria</h1>
          <p className="page-subtitle">Selecione o módulo de auditoria para acessar.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => router.push(mod.href)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow)',
              padding: '2rem',
              transition: 'var(--transition)',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-lg)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = mod.accent;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
            }}
          >
            {/* Accent stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: mod.accent, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius)',
                background: mod.bg,
                color: mod.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {mod.icon}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px',
                textTransform: 'uppercase', padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: `${mod.badgeColor}15`,
                color: mod.badgeColor,
              }}>
                {mod.id === 'auditor-senior' && <Sparkles size={10} />}
                {mod.badge}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '0.5rem', letterSpacing: '-0.3px' }}>
              {mod.label}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: '1.5rem', fontWeight: 500 }}>
              {mod.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {mod.features.map(f => (
                <span key={f} style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.625rem',
                  borderRadius: 'var(--radius-xs)', background: 'var(--gray-100)',
                  color: 'var(--gray-600)',
                }}>
                  {f}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: mod.accent, fontWeight: 800, fontSize: '0.875rem', marginTop: 'auto' }}>
              Acessar módulo
              <ChevronRight size={18} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
