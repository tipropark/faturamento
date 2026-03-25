import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Rotas públicas
  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/api/auth') ||
    pathname.includes('/agente-config') ||
    pathname.startsWith('/api/faturamento/importar-movimentos')
  ) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Proteger tudo mais
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
