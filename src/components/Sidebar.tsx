'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  AlertTriangle, Settings, LogOut, ChevronRight,
  UserCog, ClipboardList, Briefcase, History as LucideHistory,
  DollarSign, X
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Perfil, PERFIL_LABELS } from '@/types';
import { canAccessAdmin } from '@/lib/permissions';

interface SidebarProps {
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
  };
  onClose?: () => void;
}

const navItems = [
  {
    section: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    section: 'Módulos Operacionais',
    items: [
      { href: '/admin/faturamento', icon: DollarSign, label: 'Faturamento', perfis: ['administrador', 'diretoria', 'financeiro', 'gerente_operacoes'] as Perfil[] },
      { href: '/admin/faturamento/metas', icon: LayoutDashboard, label: 'Metas e Alertas', perfis: ['administrador', 'diretoria', 'financeiro', 'auditoria'] as Perfil[] },
      { href: '/sinistros', icon: AlertTriangle, label: 'Sinistros' },
      { href: '/tarifarios', icon: ClipboardList, label: 'Tarifários e Convênios', perfis: ['administrador', 'diretoria', 'supervisor', 'ti'] as Perfil[] },
    ]
  },
  {
    section: 'Operações',
    items: [
      { href: '/operacoes', icon: Building2, label: 'Operações', perfis: ['administrador','diretoria','gerente_operacoes','administrativo'] as Perfil[] },
    ]
  },
  {
    section: 'Administração',
    items: [
      { href: '/admin/usuarios', icon: Users, label: 'Usuários', perfis: ['administrador','administrativo','diretoria'] as Perfil[] },
      { href: '/admin/supervisores', icon: UserCog, label: 'Supervisores', perfis: ['administrador','administrativo','diretoria','gerente_operacoes'] as Perfil[] },
      { href: '/admin/gerentes', icon: Briefcase, label: 'Gerentes', perfis: ['administrador','administrativo','diretoria'] as Perfil[] },
      { href: '/admin/operacoes', icon: ClipboardList, label: 'Gerenciar Operações', perfis: ['administrador','administrativo','diretoria'] as Perfil[] },
      { href: '/admin/permissoes', icon: ShieldCheck, label: 'Perfis e Permissões', perfis: ['administrador','ti'] as Perfil[] },
      { href: '/admin/configuracoes', icon: Settings, label: 'Configurações do Sistema', perfis: ['administrador','ti'] as Perfil[] },
      { href: '/admin/auditoria', icon: LucideHistory, label: 'Log de Auditoria', perfis: ['administrador','ti'] as Perfil[] },
      { href: '/admin/auditoria/metas', icon: ShieldCheck, label: 'Auditoria de Metas', perfis: ['administrador','auditoria','diretoria'] as Perfil[] },
    ]
  },
];

function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (pathname === href) return true;
    
    // Se a rota for o início exato do pathname atual
    if (pathname.startsWith(href)) {
      // Verifica se existe algum outro item no menu com uma rota mais específica
      // que também coincida com o pathname atual.
      const hasSpecificMatch = navItems.some(section => 
        section.items.some(item => 
          item.href !== href && 
          item.href.startsWith(href) && 
          pathname.startsWith(item.href)
        )
      );
      
      // Se não houver nada mais específico, este é o item ativo
      return !hasSpecificMatch;
    }
    
    return false;
  };

  const canSee = (perfis?: Perfil[]) => {
    if (!perfis) return true;
    return perfis.includes(user.perfil);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" stroke="white" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M50 5L90 75L10 75L50 5Z" fill="white" fillOpacity="0.2"/>
            <path d="M50 95L90 25L10 25L50 95Z" fill="white" fillOpacity="0.1"/>
            <path d="M50 5V95" stroke="white" strokeWidth="2" strokeDasharray="4 4"/>
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>LEVE ERP</span>
        </div>
        {onClose && (
          <button 
            className="sidebar-close-btn"
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--gray-400)' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div style={{ padding: '0 1.5rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        ERP CORPORATIVO
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => {
          const visibleItems = section.items.filter(item => canSee(item.perfis));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.section} style={{ marginBottom: '1rem' }}>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: '0.8125rem' }}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
        <div className="sidebar-user" style={{ gap: '0.75rem' }}>
          <div className="sidebar-avatar" style={{ border: 'none', background: '#1E293B', color: '#94A3B8', width: '32px', height: '32px', fontSize: '0.75rem' }}>
            {getInitials(user.nome)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" style={{ color: 'white', fontSize: '0.8125rem' }}>{user.nome.split(' ')[0]}</div>
            <div className="sidebar-user-role" style={{ color: 'var(--gray-500)', fontSize: '0.65rem' }}>{PERFIL_LABELS[user.perfil]}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sair"
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--gray-400)', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              padding: '0.4rem', borderRadius: '6px',
              transition: 'all 0.15s',
              marginLeft: 'auto'
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
