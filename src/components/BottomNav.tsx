'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  DollarSign, 
  Target, 
  Building2, 
  Menu 
} from 'lucide-react';

interface BottomNavProps {
  onMoreClick: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/faturamento', icon: DollarSign, label: 'Faturamento' },
    { href: '/admin/faturamento/metas', icon: Target, label: 'Metas' },
    { href: '/operacoes', icon: Building2, label: 'Operações' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button className="bottom-nav-item" onClick={onMoreClick}>
        <Menu size={20} />
        <span>Mais</span>
      </button>
    </nav>
  );
}
