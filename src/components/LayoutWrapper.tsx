'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Perfil } from '@/types';
import { Menu, X } from 'lucide-react';

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
    <div className="app-layout">
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
        <Topbar 
          user={user} 
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} 
          isMenuOpen={isMenuOpen}
        />
        <main className="page-body">
          {children}
        </main>
        
        {/* Navegação Inferior Mobile */}
        <BottomNav onMoreClick={() => setIsMenuOpen(!isMenuOpen)} />
      </div>
    </div>
  );
}
