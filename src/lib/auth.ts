import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/server';
import { Perfil } from '@/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = await createAdminClient();
        const { data: usuario, error } = await supabase
          .from('usuarios')
          .select('id, nome, email, senha_hash, perfil, status, ativo')
          .eq('email', credentials.email)
          .single();

        if (error || !usuario) return null;
        if (!usuario.ativo || usuario.status === 'inativo') return null;

        const senhaValida = await bcrypt.compare(
          credentials.password as string,
          usuario.senha_hash
        );
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil as Perfil,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.perfil = (user as any).perfil;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).perfil = token.perfil;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8h
  // AUTH_SECRET é lido automaticamente pelo NextAuth v5 do .env.local
});
