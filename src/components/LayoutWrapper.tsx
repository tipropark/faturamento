'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Perfil } from '@/types';
import { X, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { navItems } from '@/config/navigation';

interface LayoutWrapperProps {
  children: React.ReactNode;
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
  };
}

import BottomNav from './BottomNav';

export default function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Carregar preferência do menu do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Salvar preferência ao mudar
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Fechar menu ao mudar de rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Impedir scroll quando menu mobile está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  return (
    <div className="app-layout" style={{ position: 'relative', overflow: 'hidden', background: '#F1F4F9' }}>
      {/* Biobs de Cor para o Efeito Gaussian Blur (PC ONLY) */}
      <div className="desktop-only glass-background-layer" style={{ 
        position: 'absolute', top: 0, left: 0, width: '380px', height: '100%', 
        background: 'linear-gradient(180deg, #000030 0%, #000080 100%)', zIndex: -1 
      }} />

      <div className="desktop-only glass-blob blob-1" style={{ 
        position: 'absolute', top: '10%', left: '0', width: '500px', height: '500px', 
        background: 'rgba(0, 0, 128, 0.1)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 
      }} />
      <div className="desktop-only glass-blob blob-2" style={{ 
        position: 'absolute', bottom: '20%', left: '-100px', width: '400px', height: '400px', 
        background: 'rgba(0, 0, 128, 0.08)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 
      }} />

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar com classe condicional para mobile e colapsado */}
      <div className={`sidebar-container ${isMenuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar 
          user={user} 
          onClose={() => setIsMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      <div className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <main className="page-body">
          {children}
        </main>
        
        {/* Mobile Command Center Overlay */}
        {isMenuOpen && (
          <div className="mobile-command-center" onClick={() => setIsMenuOpen(false)}>
            <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Menu Principal</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ background: '#F1F5F9', border: 'none', padding: '0.625rem', borderRadius: '14px', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="command-scroller">
                {navItems.map((section) => {
                  // Filtrar itens por perfil
                  const visibleItems = section.items.filter(item => 
                    !item.perfis || item.perfis.includes(user.perfil)
                  );

                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={section.section} className="command-section">
                      <h3 className="section-title">{section.section}</h3>
                      <div className="command-grid">
                        {visibleItems.map((item) => (
                          <Link 
                            key={item.href} 
                            href={item.href} 
                            className="command-item" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="command-icon-box">
                              <item.icon size={22} />
                            </div>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="command-section logout-section">
                  <button className="command-item" onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                    <div className="command-icon-box" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                      <LogOut size={22} />
                    </div>
                    <span>Sair do Sistema</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegação Inferior Mobile */}
        <BottomNav onMoreClick={() => setIsMenuOpen(!isMenuOpen)} />
      </div>
    </div>
  );
}
