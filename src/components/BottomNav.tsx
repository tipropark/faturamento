'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  DollarSign, 
  AlertTriangle,
  MoreHorizontal,
  Cpu
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

  return (
    <nav className="bottom-nav-v2">
      <div className="bottom-pill">
        <Link href="/dashboard" className={`bottom-nav-item-v2 ${isActive('/dashboard') ? 'active' : ''}`}>
          <Home size={18} />
          <span>Início</span>
        </Link>
        
        <Link href="/admin/faturamento" className={`bottom-nav-item-v2 ${isActive('/admin/faturamento') ? 'active' : ''}`}>
          <DollarSign size={18} />
          <span>Faturam.</span>
        </Link>

        <Link href="/admin/tecnologia-ia" className={`bottom-nav-item-v2 ${isActive('/admin/tecnologia-ia') ? 'active' : ''}`}>
          <Cpu size={18} />
          <span>Tec. IA</span>
        </Link>

        <Link href="/sinistros" className={`bottom-nav-item-v2 ${isActive('/sinistros') ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          <span>Alertas</span>
        </Link>

        <button onClick={onMoreClick} className="bottom-nav-item-v2">
          <MoreHorizontal size={20} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
