import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Perfil } from '@/types';
import LayoutWrapper from '@/components/LayoutWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = {
    id: session.user.id as string,
    nome: session.user.name || '',
    email: session.user.email || '',
    perfil: (session.user as any).perfil as Perfil,
  };

  return (
    <LayoutWrapper user={user}>
      {children}
    </LayoutWrapper>
  );
}
