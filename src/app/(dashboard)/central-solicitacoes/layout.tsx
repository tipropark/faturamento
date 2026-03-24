'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  List, 
  User, 
  Users, 
  BarChart3, 
  Settings,
  PlusCircle
} from 'lucide-react';

const menuItems = [
  { href: '/central-solicitacoes', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/central-solicitacoes/todas', label: 'Todas as Solicitações', icon: List },
  { href: '/central-solicitacoes/minhas', label: 'Minhas Solicitações', icon: User },
  { href: '/central-solicitacoes/filas', label: 'Minhas Filas', icon: Users },
  { href: '/central-solicitacoes/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/central-solicitacoes/configuracoes', label: 'Configurações', icon: Settings },
];

export default function CentralSolicitacoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <nav className="sub-nav">
        <div className="sub-nav-links">
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/central-solicitacoes' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sub-nav-link ${active ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/central-solicitacoes/nova"
          className="btn btn-primary"
        >
          <PlusCircle size={18} />
          Nova Solicitação
        </Link>
      </nav>

      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
