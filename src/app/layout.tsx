import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'Leve ERP — Sistema Corporativo',
  description: 'Sistema interno corporativo da Leve Mobilidade',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
