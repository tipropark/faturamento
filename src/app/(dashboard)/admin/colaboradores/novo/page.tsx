'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Contact, Save, ArrowLeft, 
  UserCheck, Building2, Calendar, 
  Info, Briefcase, FileText
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { TIPO_VINCULO_COLABORADOR_LABELS, StatusColaborador, TipoVinculoColaborador } from '@/types';
import Link from 'next/link';

export default function NovoColaboradorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    matricula: '',
    email: '',
    telefone: '',
    cargo: '',
    departamento: '',
    tipo_vinculo: 'CLT' as TipoVinculoColaborador,
    status: 'ativo' as StatusColaborador,
    data_admissao: new Date().toISOString().split('T')[0],
    usuario_id: '',
    operacao_id: '',
    observacoes: ''
  });

  const { data: usuarios } = useSWR('/api/usuarios', fetcher);
  const { data: operacoes } = useSWR('/api/operacoes', fetcher);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar colaborador');

      router.push(`/admin/colaboradores/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="form-page-content">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/colaboradores" className="btn btn-secondary btn-icon btn-sm">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="page-title">Novo Colaborador</h1>
            <p className="page-subtitle">Cadastre os dados funcionais e de acesso do colaborador</p>
          </div>
        </div>
        <div className="page-actions">
          <button 
            type="submit" 
            form="form-colaborador" 
            className="btn btn-primary" 
            disabled={saving}
            style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
          >
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Cadastro'}
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} /> {error}
        </div>
      )}

      <form id="form-colaborador" onSubmit={handleSubmit} className="premium-form-grid">
        {/* Seção 1: Dados Pessoais */}
        <section className="card card-premium-section">
          <div className="card-header border-none">
            <h3 className="card-title"><Contact size={18} /> Dados Pessoais</h3>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">Nome Completo</label>
                <input 
                  className="form-control" 
                  name="nome" 
                  value={formData.nome} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="form-group">
                <label className="form-label required">CPF</label>
                <input 
                  className="form-control" 
                  name="cpf" 
                  value={formData.cpf} 
                  onChange={handleChange} 
                  required 
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail Pessoal</label>
                <input 
                  className="form-control" 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="email@pessoal.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp</label>
                <input 
                  className="form-control" 
                  name="telefone" 
                  value={formData.telefone} 
                  onChange={handleChange} 
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Dados Funcionais */}
        <section className="card card-premium-section">
          <div className="card-header border-none">
            <h3 className="card-title"><Briefcase size={18} /> Dados Funcionais</h3>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Matrícula</label>
                <input 
                  className="form-control" 
                  name="matricula" 
                  value={formData.matricula} 
                  onChange={handleChange} 
                  placeholder="Ex: 504030"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo / Função</label>
                <input 
                  className="form-control" 
                  name="cargo" 
                  value={formData.cargo} 
                  onChange={handleChange} 
                  placeholder="Ex: Manobrista"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <input 
                  className="form-control" 
                  name="departamento" 
                  value={formData.departamento} 
                  onChange={handleChange} 
                  placeholder="Ex: Operações"
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Tipo de Vínculo</label>
                <select 
                  className="form-control" 
                  name="tipo_vinculo" 
                  value={formData.tipo_vinculo} 
                  onChange={handleChange} 
                  required
                >
                  {Object.entries(TIPO_VINCULO_COLABORADOR_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Data de Admissão</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input 
                    className="form-control" 
                    type="date" 
                    name="data_admissao" 
                    value={formData.data_admissao} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Operação Inicial</label>
                <select 
                  className="form-control" 
                  name="operacao_id" 
                  value={formData.operacao_id} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Selecione uma operação...</option>
                  {operacoes?.map((op: any) => (
                    <option key={op.id} value={op.id}>{op.nome_operacao}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 3: Acesso e Observações */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <section className="card card-premium-section">
            <div className="card-header border-none">
              <h3 className="card-title"><UserCheck size={18} /> Acesso ao Sistema</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Vincular Usuário Existente</label>
                <select 
                  className="form-control" 
                  name="usuario_id" 
                  value={formData.usuario_id} 
                  onChange={handleChange}
                >
                  <option value="">Colaborador sem acesso (Login não necessário)</option>
                  {usuarios?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                  ))}
                </select>
                <small className="form-text mt-2" style={{ color: 'var(--gray-500)', fontSize: '11px', display: 'block' }}>
                   * Apenas selecione se este colaborador precisar realizar login no ERP.
                </small>
              </div>
            </div>
          </section>

          <section className="card card-premium-section">
            <div className="card-header border-none">
              <h3 className="card-title"><FileText size={18} /> Observações</h3>
            </div>
            <div className="card-body">
              <div className="form-group mb-0">
                <textarea 
                  className="form-control" 
                  name="observacoes" 
                  value={formData.observacoes} 
                  onChange={handleChange}
                  rows={3}
                  placeholder="Anotações internas sobre o colaborador..."
                  style={{ resize: 'none' }}
                />
              </div>
            </div>
          </section>
        </div>
      </form>

      <style jsx>{`
        .form-page-content {
          max-width: 1000px;
          margin: 0 auto;
        }
        .premium-form-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .card-premium-section {
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid var(--gray-200);
        }
        .card-header .card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          color: var(--brand-primary);
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .alert-danger {
          background: rgba(var(--danger-rgb, 239, 68, 68), 0.1);
          color: var(--danger);
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid var(--danger);
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .form-grid-2, div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
