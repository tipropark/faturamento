import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  AlertTriangle, Settings, ChevronRight,
  UserCog, ClipboardList, Briefcase, History as LucideHistory,
  DollarSign, Cpu, Boxes, Key, History
} from 'lucide-react';
import { Perfil } from '@/types';

export interface NavItem {
  href: string;
  icon: any;
  label: string;
  perfis?: Perfil[];
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const navItems: NavSection[] = [
  {
    section: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    section: 'Módulos Operacionais',
    items: [
      { href: '/admin/faturamento', icon: DollarSign, label: 'Faturamento', perfis: ['administrador', 'diretoria', 'financeiro', 'gerente_operacoes'] },
      { href: '/admin/faturamento/metas', icon: LayoutDashboard, label: 'Metas e Alertas', perfis: ['administrador', 'diretoria', 'financeiro', 'auditoria'] },
      { href: '/admin/patrimonio', icon: Boxes, label: 'Patrimônio', perfis: ['administrador', 'diretoria', 'gerente_operacoes', 'supervisor', 'financeiro', 'auditoria', 'ti', 'administrativo'] },
      { href: '/admin/auditoria', icon: ShieldCheck, label: 'Auditoria', perfis: ['administrador', 'auditoria', 'diretoria'] },
      { href: '/admin/tecnologia-ia', icon: Cpu, label: 'Tecnologia / IA', perfis: ['administrador', 'auditoria', 'diretoria', 'ti'] },
      { href: '/admin/tecnologia-ia/chaves-tef', icon: Key, label: 'Chaves TEF', perfis: ['administrador', 'ti'] },
      { href: '/sinistros', icon: AlertTriangle, label: 'Sinistros' },
      { href: '/tarifarios', icon: ClipboardList, label: 'Tarifários e Convênios', perfis: ['administrador', 'diretoria', 'supervisor', 'ti'] },
    ]
  },
  {
    section: 'Operações',
    items: [
      { href: '/operacoes', icon: Building2, label: 'Operações', perfis: ['administrador','diretoria','gerente_operacoes','administrativo'] },
    ]
  },
  {
    section: 'Atendimento',
    items: [
      { href: '/central-solicitacoes', icon: ClipboardList, label: 'Central de Solicitações', perfis: ['administrador', 'ti', 'diretoria', 'gerente_operacoes', 'supervisor', 'analista_sinistro', 'financeiro', 'rh', 'dp', 'auditoria', 'administrativo'] },
    ]
  },
  {
    section: 'Administração',
    items: [
      { href: '/admin/usuarios', icon: Users, label: 'Usuários', perfis: ['administrador','administrativo','diretoria'] },
      { href: '/admin/colaboradores', icon: Briefcase, label: 'Colaboradores', perfis: ['administrador', 'diretoria', 'gerente_operacoes', 'rh', 'dp', 'administrativo'] },
      { href: '/admin/supervisores', icon: UserCog, label: 'Supervisores', perfis: ['administrador','administrativo','diretoria','gerente_operacoes'] },
      { href: '/admin/gerentes', icon: Briefcase, label: 'Gerentes', perfis: ['administrador','administrativo','diretoria'] },
      { href: '/admin/operacoes', icon: ClipboardList, label: 'Gerenciar Operações', perfis: ['administrador','administrativo','diretoria'] },
      { href: '/admin/permissoes', icon: ShieldCheck, label: 'Perfis e Permissões', perfis: ['administrador','ti'] },
      { href: '/admin/configuracoes', icon: Settings, label: 'Configurações do Sistema', perfis: ['administrador','ti'] },
      { href: '/admin/auditoria', icon: History, label: 'Log de Auditoria', perfis: ['administrador','ti'] },
    ]
  },
];
