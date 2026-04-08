import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'Leve ERP — Sistema Corporativo',
  description: 'Sistema interno corporativo da Leve Mobilidade',
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '10px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
