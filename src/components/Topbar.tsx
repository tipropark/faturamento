'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Bell, Menu, X } from 'lucide-react';
import { Perfil, PERFIL_LABELS } from '@/types';

interface TopbarProps {
  user: { nome: string; perfil: Perfil };
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const ROUTE_LABELS: Record<string, { title: string; breadcrumb: string }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: 'Início' },
  '/sinistros': { title: 'Sinistros', breadcrumb: 'Módulos / Sinistros' },
  '/sinistros/novo': { title: 'Novo Sinistro', breadcrumb: 'Sinistros / Novo' },
  '/operacoes': { title: 'Operações', breadcrumb: 'Operações' },
  '/admin/usuarios': { title: 'Usuários', breadcrumb: 'Administração / Usuários' },
  '/admin/supervisores': { title: 'Supervisores', breadcrumb: 'Administração / Supervisores' },
  '/admin/gerentes': { title: 'Gerentes de Operações', breadcrumb: 'Administração / Gerentes' },
  '/admin/operacoes': { title: 'Gerenciar Operações', breadcrumb: 'Administração / Operações' },
};

export default function Topbar({ user, onMenuToggle, isMenuOpen }: TopbarProps) {
  const pathname = usePathname();

  const routeInfo = Object.entries(ROUTE_LABELS).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  );

  const info = routeInfo?.[1] || { title: 'ERP Leve', breadcrumb: '' };

  return (
    <header className="topbar">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button 
            className="btn-secondary mobile-menu-btn mobile-only" 
            onClick={onMenuToggle}
            aria-label="Abrir menu"
            style={{ height: '44px', width: '44px', padding: 0, borderRadius: '12px', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <div className="flex flex-col">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.02em', fontFamily: 'Outfit', lineHeight: 1.1 }}>
            {info.title}
          </h2>
          {info.breadcrumb && (
            <span className="text-muted text-xs font-bold uppercase tracking-wider mt-1">
              {info.breadcrumb}
            </span>
          )}
        </div>
      </div>

      <div className="topbar-right flex items-center gap-3">
        <button className="btn-ghost" style={{ padding: '0.625rem', borderRadius: '12px', color: 'var(--gray-400)' }}>
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
