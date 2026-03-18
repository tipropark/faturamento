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
  const pathname = usePathname();

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
    <div className={`app-layout ${isMenuOpen ? 'menu-open' : ''}`}>
      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar com classe condicional para mobile */}
      <div className={`sidebar-container ${isMenuOpen ? 'open' : ''}`}>
        <Sidebar user={user} onClose={() => setIsMenuOpen(false)} />
      </div>

      <div className="main-content">
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
