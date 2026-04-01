'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  AlertTriangle, Settings, LogOut, ChevronRight,
  UserCog, ClipboardList, Briefcase, History as LucideHistory,
  DollarSign, X, ChevronLeft, Menu, Cpu
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
  isCollapsed: boolean;
  onToggle: () => void;
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
      { href: '/admin/auditoria', icon: ShieldCheck, label: 'Auditoria', perfis: ['administrador', 'auditoria', 'diretoria'] as Perfil[] },
      { href: '/admin/tecnologia-ia', icon: Cpu, label: 'Tecnologia / IA', perfis: ['administrador', 'auditoria', 'diretoria', 'ti'] as Perfil[] },
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
    section: 'Atendimento',
    items: [
      { href: '/central-solicitacoes', icon: ClipboardList, label: 'Central de Solicitações', perfis: ['administrador', 'ti', 'diretoria', 'gerente_operacoes', 'supervisor', 'analista_sinistro', 'financeiro', 'rh', 'dp', 'auditoria', 'administrativo'] as Perfil[] },
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
      { href: '/admin/auditoria', icon: LucideHistory, label: 'Auditoria', perfis: ['administrador','ti'] as Perfil[] },
    ]
  },
];

function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function Sidebar({ user, onClose, isCollapsed, onToggle }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  
  // A visualização final (se o menu está "graficamente" aberto)
  // Combina o estado de pin (isCollapsed) com a interação temporária (isHovered)
  const isExpanded = !isCollapsed || isHovered;

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
    <aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar-logo">
        {/* Caso colapsado (e não hover), mostramos apenas o ícone Hamburger para limpar o visual */}
        {!isExpanded ? (
          <button 
            onClick={onToggle}
            className="btn-ghost"
            style={{ 
              color: 'rgba(255,255,255,0.4)', 
              padding: '0', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '44px',
              height: '44px'
            }}
            title="Expandir Menu"
          >
            <Menu size={24} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                background: 'var(--brand-primary)', 
                padding: '6px', 
                borderRadius: '8px',
                minWidth: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round"/>
                  <path d="M50 5L90 75L10 75L50 5Z" fill="#FFFFFF" fillOpacity="0.3"/>
                </svg>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>LEVE ERP</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Botão de Fechar Mobile (Apenas Mobile) */}
              {onClose && (
                <button 
                  className="btn-ghost mobile-only"
                  onClick={onClose}
                  style={{ color: 'rgba(255,255,255,0.4)', width: '32px', height: '32px', border: 'none' }}
                >
                  <X size={18} />
                </button>
              )}

              {/* Botão para RETRAIR (Pin/Unpin manual - escondido se for hover temporário) */}
              {!isHovered && (
                <button 
                  onClick={onToggle}
                  className="btn-ghost desktop-only"
                  style={{ 
                    color: 'rgba(255,255,255,0.3)', 
                    padding: '4px', 
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                  }}
                  title="Recolher Menu"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto' }}>
        {navItems.map((section) => {
          const visibleItems = section.items.filter(item => canSee(item.perfis));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.section} style={{ marginBottom: isExpanded ? '2rem' : '1rem' }}>
              {isExpanded && (
                <div style={{ padding: '0 1.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'opacity 0.2s' }}>
                  {section.section}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${active ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                    onClick={onClose}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <div style={{ 
                      minWidth: isExpanded ? '20px' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} />
                    </div>
                    {isExpanded && <span style={{ marginLeft: '0.75rem', animation: 'fadeIn 0.2s ease-out' }}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isExpanded ? 'flex-start' : 'center',
          gap: isExpanded ? '1rem' : '0', 
          background: 'rgba(255,255,255,0.02)', 
          padding: isExpanded ? '0.875rem' : '0.5rem', 
          borderRadius: '14px', 
          border: '1px solid rgba(255,255,255,0.05)' 
        }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', background: 'var(--brand-primary)', 
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            {getInitials(user.nome)}
          </div>
          {isExpanded && (
            <div style={{ flex: 1, minWidth: 0, animation: 'fadeIn 0.2s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nome}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{PERFIL_LABELS[user.perfil]}</div>
              </div>
              <button
                className="btn-ghost"
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ padding: '0.5rem', borderRadius: '10px', color: 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer' }}
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
