'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, ChevronRight, ArrowLeft, Paperclip, Send, CheckCircle2, 
  Monitor, Users, DollarSign, Truck, Zap, Info, ChevronLeft, Tag,
  Package, Boxes, ShieldCheck, MapPin, Briefcase, Calendar, Save
} from 'lucide-react';
import Link from 'next/link';

const ICON_MAP: Record<string, any> = {
  Monitor: <Monitor size={20} />,
  Users: <Users size={20} />,
  DollarSign: <DollarSign size={20} />,
  Truck: <Truck size={20} />,
};

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [departamentos] = useState([
    { id: '1', nome: 'TI & Tecnologia', descricao: 'Sistemas e Acessos', icone: 'Monitor' },
    { id: '2', nome: 'Gente & Gestão', descricao: 'RH e Benefícios', icone: 'Users' },
    { id: '3', nome: 'Financeiro', descricao: 'Pagamentos e Notas', icone: 'DollarSign' },
    { id: '4', nome: 'Logística', descricao: 'Frota e Suporte', icone: 'Truck' },
  ]);
  
  const [categorias] = useState([
    { id: 'c1', depto: '1', nome: 'Acesso a Sistemas Internos', sla: '24h' },
    { id: 'c2', depto: '1', nome: 'Manutenção de Hardware', sla: '48h' },
    { id: 'c3', depto: '1', nome: 'Dúvidas Operacionais ERP', sla: '12h' },
  ]);

  const [selectedDeptoId, setSelectedDeptoId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const handleNext = (next: number, id: string, type: 'depto' | 'cat') => {
    if (type === 'depto') setSelectedDeptoId(id);
    if (type === 'cat') setSelectedCatId(id);
    setStep(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => { setSuccess(true); setIsSubmitting(false); }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-100">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação enviada com sucesso!</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Demos início ao seu protocolo. Acompanhe o status pelo painel.</p>
        <div className="flex gap-4">
          <button onClick={() => router.push('/central-solicitacoes/todas')} className="btn btn-primary px-8">Ver Chamados</button>
          <button onClick={() => window.location.reload()} className="btn btn-ghost">Nova Solicitação</button>
        </div>
      </div>
    );
  }

  const currentDepto = departamentos.find(d => d.id === selectedDeptoId);
  const currentCat = categorias.find(c => c.id === selectedCatId);

  return (
    <div className="page-container premium-page">
      <style jsx>{`
        .step-card-premium {
          background: #ffffff;
          border: 1px solid var(--gray-100);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .step-card-premium:hover {
          transform: translateY(-4px);
          border-color: var(--brand-primary);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 80, 0.1);
        }

        .step-card-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-50);
          color: var(--gray-400);
          transition: all 0.3s;
        }

        .step-card-premium:hover .step-card-icon-box {
          background: var(--brand-primary);
          color: white;
        }
      `}</style>

      <header className="page-header mb-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : router.back()} 
              className="btn-icon btn-sm" 
              style={{ borderRadius: '14px', background: '#fff' }}
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="page-title" style={{ fontSize: '2rem' }}>
                {step === 1 ? 'Nova Solicitação' : step === 2 ? 'Escolha o Assunto' : 'Preencha os Detalhes'}
              </h1>
              <p className="page-subtitle">Passo {step} de 3 — Siga as instruções abaixo</p>
            </div>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 w-10 rounded-full ${step >= s ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-12 gap-8 items-start">
        <div className="col-span-8">
          
          {step === 1 && (
            <div className="grid grid-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {departamentos.map(d => (
                <div key={d.id} className="step-card-premium" onClick={() => handleNext(2, d.id, 'depto')}>
                  <div className="step-card-icon-box">
                    {ICON_MAP[d.icone] || <Building2 size={22} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-900">{d.nome}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{d.descricao}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-200" />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-500">
              <div className="bg-brand-primary-light/20 p-5 rounded-2xl border border-brand-primary-light flex items-center gap-4 mb-6">
                 <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center">
                    {ICON_MAP[currentDepto?.icone || ''] || <Building2 size={20} />}
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block">Área Selecionada</span>
                    <h3 className="font-bold text-gray-900">{currentDepto?.nome}</h3>
                 </div>
              </div>

              {categorias.filter(c => c.depto === selectedDeptoId).map(c => (
                <div key={c.id} className="step-card-premium" onClick={() => handleNext(3, c.id, 'cat')}>
                  <div className="step-card-icon-box" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-800">{c.nome}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SLA Estimado: {c.sla}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-200" />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="form-card-premium animate-in fade-in slide-in-from-right-2 duration-500">
              
              <div className="premium-form-section">
                <div className="section-header-premium">
                  <div className="section-icon-box">
                    <Info size={20} />
                  </div>
                  <div>
                     <h3 className="section-title-premium">Informações do Chamado</h3>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{currentDepto?.nome} / {currentCat?.nome}</p>
                  </div>
                </div>

                <div className="form-grid grid-2 gap-x-8 gap-y-6">
                  <div className="form-group col-span-2 mb-0">
                    <label className="label-premium">Título do Chamado <span className="req-dot">•</span></label>
                    <div className="input-premium-group">
                      <input type="text" className="input-premium" placeholder="ex: Problema no acesso ao ERP" required />
                      <Tag className="input-icon-premium" size={18} />
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <label className="label-premium">Unidade Operacional <span className="req-dot">•</span></label>
                    <div className="input-premium-group">
                      <select className="input-premium select-premium" required>
                        <option value="">Selecione...</option>
                        <option value="matriz">Matriz Curitiba</option>
                        <option value="filial-sp">Filial São Paulo</option>
                      </select>
                      <MapPin className="input-icon-premium" size={18} />
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <label className="label-premium">Prioridade Sugerida</label>
                    <div className="input-premium-group">
                      <select className="input-premium select-premium">
                        <option value="normal">Normal</option>
                        <option value="alta">Alta (Bloqueio Total)</option>
                        <option value="baixa">Informativa / Dúvida</option>
                      </select>
                      <Zap className="input-icon-premium" size={18} />
                    </div>
                  </div>

                  <div className="form-group col-span-2 mb-0">
                    <label className="label-premium">Relato do Problema <span className="req-dot">•</span></label>
                    <textarea 
                      className="input-premium textarea-premium" 
                      placeholder="Descreva aqui o que está acontecendo. Se houver erro, informe o código..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="premium-form-section">
                <div className="section-header-premium">
                  <div className="section-icon-box" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                    <Paperclip size={20} />
                  </div>
                  <h3 className="section-title-premium">Evidências e Arquivos</h3>
                </div>

                <div className="border-2 border-dashed border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-brand-primary transition-all cursor-pointer group">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <Paperclip size={28} />
                   </div>
                   <h4 className="font-bold text-gray-900 mb-1">Arraste seus anexos aqui</h4>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Prints de tela ajudam muito no suporte</p>
                </div>
              </div>

              <div className="premium-form-section bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Info size={16} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Protocolo digital Leve ERP</span>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   <button 
                    type="submit" 
                    className="btn-premium-save"
                    disabled={isSubmitting}
                    style={{ width: 'auto', minWidth: '240px' }}
                   >
                    {isSubmitting ? 'Enviando...' : <><Send size={18} /> Registrar Solicitação</>}
                   </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="col-span-4 flex flex-col gap-8">
          <section className="form-card-premium" style={{ background: '#0C0C24', color: '#ffffff', padding: '2.5rem' }}>
            <div className="flex flex-col gap-8">
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '18px', width: 'fit-content' }}>
                <ShieldCheck size={32} color="#ffffff" />
              </div>
              <div>
                <h4 className="font-black mb-3" style={{ fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em' }}>Suporte Inteligente</h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontWeight: 500 }}>Estamos prontos para te ajudar. Siga as orientações para um atendimento rápido.</p>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-start">
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#ffffff', flexShrink: 0, marginTop: '2px' }}>1</div>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.6 }}>Seja específico no título para triagem rápida.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#ffffff', flexShrink: 0, marginTop: '2px' }}>2</div>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.6 }}>Anexe prints de erro para facilitar a análise técnica.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#ffffff', flexShrink: 0, marginTop: '2px' }}>3</div>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.6 }}>Acompanhe o SLA de resposta direto no seu painel.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="form-card-premium" style={{ padding: '2.5rem' }}>
             <h4 className="font-black mb-6 text-gray-900 uppercase tracking-widest text-xs">Informações Úteis</h4>
             <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="text-xs font-bold text-gray-700">SLA Médio de 24h para TI</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <ShieldCheck size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-gray-700">Chamados 100% Auditados</span>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
