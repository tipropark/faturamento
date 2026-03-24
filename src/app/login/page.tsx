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
            padding: '1.25rem', 
            borderRadius: '20px', 
            marginBottom: '1.25rem',
            boxShadow: '0 12px 24px rgba(0, 0, 80, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px'
          }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" stroke="white" strokeWidth="6" strokeLinejoin="round"/>
              <path d="M50 5L90 75L10 75L50 5Z" fill="white" fillOpacity="0.2"/>
              <path d="M50 95L90 25L10 25L50 95Z" fill="white" fillOpacity="0.1"/>
              <path d="M50 5V95" stroke="white" strokeWidth="2" strokeDasharray="4 4"/>
            </svg>
          </div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 900, 
            color: 'var(--brand-primary)', 
            letterSpacing: '-0.02em',
            fontFamily: 'Outfit, sans-serif'
          }}>
            LEVE <span style={{ color: 'var(--brand-secondary)' }}>ERP</span>
          </div>
          <div style={{ 
            fontWeight: 700, 
            color: 'var(--gray-400)', 
            fontSize: '0.65rem',
            letterSpacing: '0.15em', 
            textTransform: 'uppercase',
            marginTop: '0.25rem'
          }}>
            Sistema de Gestão Integrada
          </div>
        </div>

        <h1 className="login-title">Seja bem-vindo</h1>
        <p className="login-subtitle">
          Entre com seu e-mail corporativo para acessar
        </p>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">E-mail corporativo</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute', left: '1rem',
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-400)'
                }}
              />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="seu.email@levemobilidade.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Senha</label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute', left: '1rem',
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-400)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
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
                  display: 'flex', alignItems: 'center',
                  padding: '8px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Autenticando...
              </>
            ) : 'Entrar no Sistema'}
          </button>
        </form>

        <div style={{
          marginTop: '2.5rem', paddingTop: '1.5rem',
          borderTop: '1px solid var(--gray-100)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>
            Leve Mobilidade © {new Date().getFullYear()} — Uso restrito e monitorado
          </p>
        </div>
      </div>
    </div>
  );
}
