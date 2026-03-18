'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Email ou senha incorretos. Verifique suas credenciais.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ 
            background: 'var(--brand-primary)', 
            padding: '1.25rem 2.5rem', 
            borderRadius: '24px', 
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(39, 47, 92, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" stroke="white" strokeWidth="4" strokeLinejoin="round"/>
              <path d="M50 5L90 75L10 75L50 5Z" fill="white" fillOpacity="0.2"/>
              <path d="M50 95L90 25L10 25L50 95Z" fill="white" fillOpacity="0.1"/>
              <path d="M50 5V95" stroke="white" strokeWidth="2" strokeDasharray="4 4"/>
            </svg>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '1px' }}>LEVE ERP</span>
          </div>
          <div className="login-brand-sub" style={{ fontWeight: 700, color: 'var(--brand-primary)', letterSpacing: '2px', opacity: 0.8 }}>SISTEMA CORPORATIVO</div>
        </div>

        <div className="login-title">Acesso ao sistema</div>
        <div className="login-subtitle">
          Entre com suas credenciais para continuar
        </div>

        {error && (
          <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">E-mail corporativo</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute', left: '0.75rem',
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-400)'
                }}
              />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="seu.email@levemobilidade.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute', left: '0.75rem',
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-400)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem',
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--gray-400)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.9375rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Autenticando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem', paddingTop: '1.5rem',
          borderTop: '1px solid var(--gray-100)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
            Leve Mobilidade © {new Date().getFullYear()} — Uso interno restrito
          </p>
        </div>
      </div>
    </div>
  );
}
