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
    <header className="topbar" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="topbar-left">
        {onMenuToggle && (
          <button 
            className="mobile-menu-btn" 
            onClick={onMenuToggle}
            aria-label="Abrir menu"
            style={{ background: 'white', border: '1px solid var(--gray-200)', marginRight: '1rem' }}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      <div className="topbar-right">
        {/* O perfil já está sendo exibido dentro das páginas em alguns casos, mas mantemos aqui para navegabilidade mobile/global se necessário, por ora deixamos vazio para o Dashboard brilhar */}
      </div>
    </header>
  );
}
