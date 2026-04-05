'use client';

import React, { useState } from 'react';
import { 
  Boxes, ChevronLeft, Save, 
  Package, Tag, MapPin, User, Calendar, 
  DollarSign, FileText, CheckCircle2,
  AlertTriangle, Hammer, Briefcase, Plus,
  Info, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function NovoPatrimonio() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codigo_patrimonio: '',
    nome: '',
    descricao: '',
    categoria: 'TI',
    status: 'Estoque',
    operacao_id: '',
    responsavel_id: '',
    valor_compra: '',
    data_compra: '',
    data_garantia: '',
    campos_especificos: {}
  });

  // Fetch de operações para o Select
  const { data: operacoes } = useSWR('/api/operacoes', fetcher);
  // Fetch de colaboradores para o Select 
  const { data: colaboradores } = useSWR('/api/colaboradores', fetcher);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo_patrimonio || !formData.nome || !formData.operacao_id) {
      return alert('Preencha os campos obrigatórios (Tag, Nome e Operação)');
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patrimonio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor_compra: formData.valor_compra ? parseFloat(formData.valor_compra) : null,
          responsavel_id: formData.responsavel_id || null,
          data_compra: formData.data_compra || null,
          data_garantia: formData.data_garantia || null
        })
      });

      if (res.ok) {
        router.push('/admin/patrimonio');
      } else {
        const error = await res.json();
        alert('Erro ao salvar: ' + error.error);
      }
    } catch (err) {
      console.error(err);
      alert('Erro crítico ao salvar patrimônio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container premium-page">
      <style jsx global>{`
        .premium-page {
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }
        
        .form-card-premium {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid var(--gray-100);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .premium-form-section {
          padding: 2.5rem;
          border-bottom: 1px solid var(--gray-50);
        }

        .premium-form-section:last-child {
          border-bottom: none;
        }

        .section-header-premium {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .section-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--brand-primary-light);
          color: var(--brand-primary);
        }

        .section-title-premium {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--gray-900);
          letter-spacing: -0.02em;
        }

        .input-premium-group {
          position: relative;
          transition: all 0.2s;
        }

        .input-premium {
          width: 100%;
          height: 52px;
          padding: 0 1.25rem 0 3rem;
          background: var(--gray-50);
          border: 1px solid transparent;
          border-radius: 14px;
          font-weight: 600;
          color: var(--gray-900);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-premium:focus {
          background: #fff;
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 4px rgba(0, 0, 128, 0.05);
          transform: translateY(-1px);
        }

        .input-icon-premium {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
          pointer-events: none;
          transition: var(--transition);
        }

        .input-premium:focus + .input-icon-premium {
          color: var(--brand-primary);
        }

        .label-premium {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.625rem;
          margin-left: 0.25rem;
        }

        .select-premium {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.25rem;
          padding-right: 3rem;
        }

        .btn-premium-save {
          height: 52px;
          padding: 0 2rem;
          border-radius: 16px;
          background: var(--brand-primary);
          color: white;
          font-weight: 800;
          font-size: 0.9375rem;
          border: none;
          box-shadow: 0 10px 20px -5px rgba(0, 0, 80, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-premium-save:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 15px 30px -5px rgba(0, 0, 80, 0.4);
          background: var(--brand-primary-dark);
        }

        .btn-premium-save:active {
          transform: translateY(0) scale(0.98);
        }
        
        .textarea-premium {
          height: auto !important;
          min-height: 120px;
          padding: 1.25rem !important;
          line-height: 1.6;
        }

        .req-dot { color: var(--danger); font-weight: 900; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .faq-details summary::-webkit-details-marker { display: none; }
        .faq-details summary { list-style: none; }
        .faq-details[open] summary { color: var(--brand-primary); }
        .faq-details p { animation: slideDownFAQ 0.3s ease-out; }
        @keyframes slideDownFAQ {
          from { opacity: 0; margin-top: 0; }
          to { opacity: 1; margin-top: 0.75rem; }
        }
      `}</style>

      <header className="page-header mb-10">
        <div className="flex items-center gap-6">
          <Link href="/admin/patrimonio" className="btn-icon btn-sm" style={{ borderRadius: '14px', background: '#fff' }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: '2rem' }}>Novo Patrimônio</h1>
            <p className="page-subtitle">Preencha os dados abaixo para catalogar um novo ativo na rede</p>
          </div>
        </div>
      </header>

      <div className="grid grid-12 gap-8 items-start">
        <div className="col-span-8">
          <form id="patrimonio-form" onSubmit={handleSubmit} className="form-card-premium">
            {/* Seção 1: Identificação */}
            <div className="premium-form-section">
              <div className="section-header-premium">
                <div className="section-icon-box">
                  <Tag size={20} />
                </div>
                <h3 className="section-title-premium">Identificação do Ativo</h3>
              </div>

              <div className="form-grid grid-2 gap-x-8 gap-y-6">
                <div className="form-group mb-0">
                  <label className="label-premium">Código / Tag <span className="req-dot">•</span></label>
                  <div className="input-premium-group">
                    <input 
                      type="text" 
                      placeholder="ex: LEVE-0442" 
                      className="input-premium"
                      value={formData.codigo_patrimonio}
                      onChange={(e) => setFormData({...formData, codigo_patrimonio: e.target.value})}
                      required
                    />
                    <Tag className="input-icon-premium" size={18} />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="label-premium">Categoria de Ativo</label>
                  <div className="input-premium-group">
                    <select 
                      className="input-premium select-premium"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    >
                      <option value="TI">Hardware & Infra TI</option>
                      <option value="Facilities">Facilities & Escritório</option>
                      <option value="Operacional">Operacional & Pátio</option>
                      <option value="Veículo">Frotas / Veículos</option>
                      <option value="Mobiliário">Mobiliário</option>
                      <option value="Outros">Outros Ativos</option>
                    </select>
                    <Boxes className="input-icon-premium" size={18} />
                  </div>
                </div>

                <div className="form-group col-span-2 mb-0">
                  <label className="label-premium">Nome amigável do Ativo <span className="req-dot">•</span></label>
                  <div className="input-premium-group">
                    <input 
                      type="text" 
                      placeholder="ex: Monitor Dell 27' Ultrasharp P2723D" 
                      className="input-premium"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                    />
                    <Package className="input-icon-premium" size={18} />
                  </div>
                </div>

                <div className="form-group col-span-2 mb-0">
                  <label className="label-premium">Descrição técnica e observações</label>
                  <textarea 
                    className="input-premium textarea-premium" 
                    placeholder="Especifique detalhes como número de série, modelo exato, configuração ou estado atual do item..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Alocação */}
            <div className="premium-form-section">
              <div className="section-header-premium">
                <div className="section-icon-box" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <MapPin size={20} />
                </div>
                <h3 className="section-title-premium">Alocação e Posse</h3>
              </div>

              <div className="form-grid grid-2 gap-x-8 gap-y-6">
                <div className="form-group mb-0">
                  <label className="label-premium">Unidade / Operação <span className="req-dot">•</span></label>
                  <div className="input-premium-group">
                    <select 
                      className="input-premium select-premium"
                      value={formData.operacao_id}
                      onChange={(e) => setFormData({...formData, operacao_id: e.target.value})}
                      required
                    >
                      <option value="">Selecione o local...</option>
                      {operacoes?.map((op: any) => (
                        <option key={op.id} value={op.id}>{op.nome_operacao}</option>
                      ))}
                    </select>
                    <Building2 className="input-icon-premium" size={18} />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="label-premium">Atribuído ao Colaborador</label>
                  <div className="input-premium-group">
                    <select 
                      className="input-premium select-premium"
                      value={formData.responsavel_id}
                      onChange={(e) => setFormData({...formData, responsavel_id: e.target.value})}
                    >
                      <option value="">Uso Geral / Coletivo</option>
                      {colaboradores?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.cargo || c.tipo_vinculo})</option>
                      ))}
                    </select>
                    <Briefcase className="input-icon-premium" size={18} />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="label-premium">Status de Auditoria</label>
                  <div className="input-premium-group">
                    <select 
                      className="input-premium select-premium"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Estoque">Em Estoque (Livre)</option>
                      <option value="Ativo">Em Operação (Ativo)</option>
                      <option value="Manutenção">Em Reparo (Manutenção)</option>
                    </select>
                    <ShieldCheck className="input-icon-premium" size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Financeiro */}
            <div className="premium-form-section">
              <div className="section-header-premium">
                <div className="section-icon-box" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  <DollarSign size={20} />
                </div>
                <h3 className="section-title-premium">Histórico de Aquisição</h3>
              </div>

              <div className="form-grid grid-3 gap-x-6">
                <div className="form-group mb-0">
                  <label className="label-premium">Valor Compra</label>
                  <div className="input-premium-group">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0,00" 
                      className="input-premium"
                      value={formData.valor_compra}
                      onChange={(e) => setFormData({...formData, valor_compra: e.target.value})}
                    />
                    <DollarSign className="input-icon-premium" size={18} />
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="label-premium">Data Compra</label>
                  <div className="input-premium-group">
                    <input 
                      type="date" 
                      className="input-premium"
                      value={formData.data_compra}
                      onChange={(e) => setFormData({...formData, data_compra: e.target.value})}
                    />
                    <Calendar className="input-icon-premium" size={18} />
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="label-premium">Fim Garantia</label>
                  <div className="input-premium-group">
                    <input 
                      type="date" 
                      className="input-premium"
                      value={formData.data_garantia}
                      onChange={(e) => setFormData({...formData, data_garantia: e.target.value})}
                    />
                    <Calendar className="input-icon-premium" size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="premium-form-section bg-gray-50 flex flex-between items-center">
              <div className="flex items-center gap-2 text-muted">
                <Info size={16} />
                <span className="text-xs font-semibold">Os campos marcados com (•) são de preenchimento obrigatório.</span>
              </div>
              <div className="flex gap-4">
                <Link href="/admin/patrimonio" className="btn btn-ghost" style={{ height: '52px', padding: '0 2rem', borderRadius: '16px' }}>
                  Cancelar
                </Link>
                <button 
                  type="submit" 
                  className="btn-premium-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Finalizando...' : (
                    <>
                      <Save size={18} />
                      Concluir Cadastro
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Informativa */}
        <div className="col-span-4 flex flex-col gap-8">
          <section className="form-card-premium" style={{ background: '#0C0C24', color: '#ffffff', padding: '2.5rem' }}>
            <div className="flex flex-col gap-8">
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '18px', width: 'fit-content' }}>
                <ShieldCheck size={32} color="#ffffff" />
              </div>
              <div>
                <h4 className="font-black mb-3" style={{ fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em' }}>Diretrizes de Patrimônio</h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontWeight: 500 }}>Garantir a integridade do cadastro permite um rastreio eficiente e evita perdas operacionais na rede.</p>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-start">
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#ffffff', flexShrink: 0, marginTop: '2px' }}>1</div>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.6 }}>Use etiquetas metálicas ou QR codes oficiais para o código do ativo.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#ffffff', flexShrink: 0, marginTop: '2px' }}>2</div>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.6 }}>Vincule sempre um responsável para ativos de uso individual (ex: Laptop, Celular).</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#ffffff', flexShrink: 0, marginTop: '2px' }}>3</div>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.6 }}>Anexe fotografias e a Nota Fiscal na página de detalhes após o cadastro inicial.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="form-card-premium" style={{ padding: '2.5rem' }}>
            <h4 className="font-black mb-6" style={{ fontSize: '1.125rem', color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>Dúvidas Frequentes</h4>
            <div className="flex flex-col gap-5">
              <details className="faq-details">
                <summary className="font-bold cursor-pointer text-gray-800 transition" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', outline: 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }}></div>
                  <span style={{ fontSize: '0.95rem' }}>Onde encontro a TAG?</span>
                </summary>
                <p className="text-sm" style={{ paddingLeft: '1.15rem', marginTop: '0.75rem', color: 'var(--gray-500)', lineHeight: '1.6' }}>A TAG está localizada no verso do ativo ou na etiqueta metálica de inventário Leve.</p>
              </details>
              <div style={{ height: '1px', background: 'var(--gray-100)', width: '100%' }}></div>
              <details className="faq-details">
                <summary className="font-bold cursor-pointer text-gray-800 transition" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', outline: 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }}></div>
                  <span style={{ fontSize: '0.95rem' }}>Ativos em garantia?</span>
                </summary>
                <p className="text-sm" style={{ paddingLeft: '1.15rem', marginTop: '0.75rem', color: 'var(--gray-500)', lineHeight: '1.6' }}>Sempre informe a data de fim de garantia para receber alertas automáticos da equipe de infraestrutura e TI.</p>
              </details>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Subcomponents helper - Building2 is missing from local scope sometimes
function Building2({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  );
}
