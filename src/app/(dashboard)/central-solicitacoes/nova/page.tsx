'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, ChevronRight, CheckCircle2, 
  Monitor, Users, DollarSign, Truck, Zap, Info, ChevronLeft, Tag,
  Boxes, MapPin, Paperclip, Send
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Monitor: <Monitor size={32} />,
  Users: <Users size={32} />,
  DollarSign: <DollarSign size={32} />,
  Truck: <Truck size={32} />,
};

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const [prioridades, setPrioridades] = useState<any[]>([]);
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [selectedDeptoId, setSelectedDeptoId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadConfig() {
      setErrorStatus(null);
      setLoading(true);
      try {
        const res = await fetch('/api/central-solicitacoes/config');
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Erro HTTP: ${res.status}`);
        }
        const data = await res.json();
        
        if (!data.departamentos || data.departamentos.length === 0) {
          console.warn('API retornou lista de departamentos vazia.');
        }

        setDepartamentos(data.departamentos || []);
        setCategorias(data.categorias || []);
        setSubcategorias(data.subcategorias || []);
        setPrioridades(data.prioridades || []);
        setOperacoes(data.operacoes || []);
      } catch (error: any) {
        console.error('Erro ao carregar configurações:', error);
        setErrorStatus(error.message || 'Falha na conexão com o servidor');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleNext = (id: string, type: 'depto' | 'cat' | 'subcat') => {
    if (type === 'depto') {
      setSelectedDeptoId(id);
      setSelectedCatId(null);
      setSelectedSubcatId(null);
      setStep(2);
    }
    
    if (type === 'cat') {
      setSelectedCatId(id);
      setSelectedSubcatId(null);
      
      const subs = subcategorias.filter(s => s.categoria_id === id && s.ativo);
      if (subs.length > 0) {
        setStep(3);
      } else {
        setStep(4);
      }
    }

    if (type === 'subcat') {
      setSelectedSubcatId(id);
      setStep(4);
    }
  };

  const currentDepto = departamentos.find(d => d.id === selectedDeptoId);
  const currentCat = categorias.find(c => c.id === selectedCatId);
  const currentSubcat = subcategorias.find(s => s.id === selectedSubcatId);

  // Regra de Negócio: Exigência de Operação
  const exigeOperacao = currentCat?.exige_operacao || 'opcional';
  const isOperacaoObrigatoria = exigeOperacao === 'obrigatoria';
  const isOperacaoDispensada = exigeOperacao === 'dispensada';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const operacao_id = formData.get('operacao_id');

      // Validação extra se for obrigatória
      if (isOperacaoObrigatoria && !operacao_id) {
        alert('Por favor, selecione uma unidade/operação.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        titulo: formData.get('titulo'),
        descricao: formData.get('descricao'),
        departamento_id: selectedDeptoId,
        categoria_id: selectedCatId,
        subcategoria_id: selectedSubcatId,
        operacao_id: isOperacaoDispensada ? null : (operacao_id || null),
        prioridade_id: prioridades.find(p => p.slug === (formData.get('prioridade') || 'normal'))?.id || prioridades[0]?.id
      };

      const res = await fetch('/api/central-solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar solicitação');
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  const currentStepTitle = 
    step === 1 ? 'Central de Mensagens' : 
    step === 2 ? 'Qual o assunto?' : 
    step === 3 ? 'Aperfeiçoe o Assunto' : 
    'Abertura de Chamado';

  return (
    <div className="page-container premium-page">
      <style jsx>{`
        .step-indicator-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 4rem;
          position: relative;
        }

        .step-indicator-line {
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 3px;
          background: #f1f5f9;
          z-index: 0;
          transform: translateY(-50%);
        }

        .step-indicator-line-active {
          position: absolute;
          top: 50%;
          left: 10%;
          height: 3px;
          background: #272F5C;
          z-index: 1;
          transform: translateY(-50%);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-node {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .step-node.active {
          border-color: #272F5C;
          color: #272F5C;
          box-shadow: 0 0 15px rgba(39, 47, 92, 0.2);
        }

        .step-node.completed {
          background: #272F5C;
          border-color: #272F5C;
          color: #fff;
        }

        .selection-card {
          aspect-ratio: 1 / 1;
          background: #fff;
          border-radius: 24px;
          border: 2px solid #f1f5f9;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .selection-card:hover {
          transform: translateY(-8px);
          border-color: #272F5C;
          box-shadow: 0 20px 40px rgba(39, 47, 92, 0.08);
        }

        .selection-card.selected {
          border-color: #272F5C;
          background: rgba(39, 47, 92, 0.02);
          box-shadow: 0 20px 40px rgba(39, 47, 92, 0.12);
        }

        .selection-check {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          border: 2px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .selection-card.selected .selection-check {
          background: #272F5C;
          border-color: #272F5C;
          color: #fff;
        }

        .nav-footer-wizard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid #f1f5f9;
        }

        .btn-wizard-next {
          background: #272F5C;
          color: white;
          padding: 1rem 2.5rem;
          border-radius: 99px;
          font-weight: 800;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          box-shadow: 0 10px 20px rgba(39, 47, 92, 0.3);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-wizard-next:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 15px 30px rgba(39, 47, 92, 0.45);
        }

        .btn-wizard-prev {
          background: transparent;
          color: #272F5C;
          padding: 1rem 2rem;
          border-radius: 99px;
          font-weight: 800;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 2px solid #272F5C;
          transition: all 0.3s ease;
        }

        .btn-wizard-prev:hover {
          background: rgba(39, 47, 92, 0.05);
          transform: scale(1.05);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="step-indicator-container">
          <div className="step-indicator-line" />
          <div 
            className="step-indicator-line-active" 
            style={{ width: `${(step - 1) * 33.3 + 10}%` }} 
          />
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`step-node ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            >
              {step > s ? <CheckCircle2 size={18} /> : <span className="font-bold">{s}</span>}
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">{currentStepTitle}</h1>
          <p className="text-gray-500 font-medium tracking-wide text-sm">Passo {step} de 4 — Escolha uma das opções abaixo</p>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="animate-spin mb-4"><Zap size={40} /></div>
              <p className="font-bold uppercase tracking-widest text-xs">Carregando formulário inteligente...</p>
            </div>
          ) : errorStatus ? (
            <div className="p-12 text-center bg-red-50 rounded-2xl border border-dashed border-red-200 animate-in fade-in zoom-in duration-300">
               <Info className="mx-auto mb-4 text-red-400" size={32} />
               <h3 className="font-bold text-red-900 mb-1">Falha técnica detectada</h3>
               <p className="text-sm text-red-500 mb-4">{errorStatus}</p>
               <button onClick={() => window.location.reload()} className="btn btn-error btn-sm px-6">Tentar Novamente</button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {departamentos.length === 0 ? (
                      <div className="col-span-1 md:col-span-3 p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                         <Info className="mx-auto mb-4 text-gray-400" size={32} />
                         <h3 className="font-bold text-gray-900 mb-1">Nenhum departamento configurado</h3>
                         <p className="text-sm text-gray-500 mb-4">Verifique se as tabelas foram criadas e se os registros estão marcados como 'Ativos' no banco de dados.</p>
                         <button onClick={() => window.location.reload()} className="mt-4 btn btn-ghost btn-sm">Recarregar Página</button>
                      </div>
                    ) : (
                      departamentos.map(d => (
                        <div 
                          key={d.id} 
                          className={`selection-card ${selectedDeptoId === d.id ? 'selected' : ''}`} 
                          onClick={() => setSelectedDeptoId(d.id)}
                        >
                          <div className="selection-check">
                            {selectedDeptoId === d.id && <CheckCircle2 size={14} />}
                          </div>
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-50 text-[#DB3A2E] mb-2 transition-all">
                            {ICON_MAP[d.icone] || <Building2 size={32} />}
                          </div>
                          <div className="text-center">
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{d.nome}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{d.descricao || 'Área de Negócio'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="nav-footer-wizard">
                    <button onClick={() => router.back()} className="btn-wizard-prev">Voltar</button>
                    <button 
                      onClick={() => handleNext(selectedDeptoId!, 'depto')} 
                      disabled={!selectedDeptoId}
                      className="btn-wizard-next"
                    >
                      Próximo <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categorias.filter(c => c.departamento_id === selectedDeptoId && c.ativo).map(c => (
                      <div 
                        key={c.id} 
                        className={`selection-card ${selectedCatId === c.id ? 'selected' : ''}`} 
                        onClick={() => setSelectedCatId(c.id)}
                      >
                        <div className="selection-check">
                          {selectedCatId === c.id && <CheckCircle2 size={14} />}
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-50 text-[#DB3A2E] mb-2 transition-all">
                          <Tag size={32} />
                        </div>
                        <div className="text-center">
                          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{c.nome}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">SLA: {c.sla_conclusao_horas || 48}h</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="nav-footer-wizard">
                    <button onClick={() => setStep(1)} className="btn-wizard-prev">Anterior</button>
                    <button 
                      onClick={() => handleNext(selectedCatId!, 'cat')} 
                      disabled={!selectedCatId}
                      className="btn-wizard-next"
                    >
                      Próximo <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subcategorias.filter(s => s.categoria_id === selectedCatId && s.ativo).map(s => (
                      <div 
                        key={s.id} 
                        className={`selection-card ${selectedSubcatId === s.id ? 'selected' : ''}`} 
                        onClick={() => setSelectedSubcatId(s.id)}
                      >
                        <div className="selection-check">
                          {selectedSubcatId === s.id && <CheckCircle2 size={14} />}
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-50 text-[#DB3A2E] mb-2 transition-all">
                          <Boxes size={32} />
                        </div>
                        <div className="text-center">
                          <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{s.nome}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Opção Específica</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="nav-footer-wizard">
                    <button onClick={() => setStep(2)} className="btn-wizard-prev">Anterior</button>
                    <button 
                      onClick={() => handleNext(selectedSubcatId!, 'subcat')} 
                      disabled={!selectedSubcatId}
                      className="btn-wizard-next"
                    >
                      Próximo <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <form id="nova-solicitacao-form" onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-700" autoComplete="off">
                  <div className="form-card-premium">
                    <div className="premium-form-section">
                      <div className="section-header-premium">
                        <div className="section-icon-box" style={{ background: 'rgba(39, 47, 92, 0.1)', color: '#272F5C' }}>
                          <Info size={20} />
                        </div>
                        <div>
                          <h3 className="section-title-premium uppercase tracking-tighter">Detalhes da Solicitação</h3>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            {currentDepto?.nome} / {currentCat?.nome} {currentSubcat ? `/ ${currentSubcat.nome}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-1 md:col-span-2 mb-0">
                          <label htmlFor="titulo" className="label-premium uppercase text-[10px] font-black tracking-widest text-gray-400 mb-2 block">Assunto / Resumo <span className="text-[#DB3A2E]">•</span></label>
                          <div className="relative">
                            <input 
                              type="text" 
                              id="titulo"
                              name="titulo" 
                              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder:text-gray-300 focus:border-[#272F5C] focus:outline-none transition-all pl-12" 
                              placeholder="Título curto que resuma o problema" 
                              required 
                              autoComplete="off"
                            />
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          </div>
                        </div>

                        {!isOperacaoDispensada && (
                          <div className="mb-0">
                            <label htmlFor="operacao_id" className="label-premium uppercase text-[10px] font-black tracking-widest text-gray-400 mb-2 block">
                              Unidade / Operação {isOperacaoObrigatoria && <span className="text-[#DB3A2E]">•</span>}
                            </label>
                            <div className="relative">
                              <select 
                                id="operacao_id"
                                name="operacao_id" 
                                className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-[#272F5C] focus:outline-none transition-all pl-12 appearance-none" 
                                required={isOperacaoObrigatoria}
                                autoComplete="off"
                              >
                                <option value="">Selecione a unidade</option>
                                {operacoes.map(op => (
                                  <option key={op.id} value={op.id}>{op.nome_operacao}</option>
                                ))}
                              </select>
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                          </div>
                        )}

                        <div className={isOperacaoDispensada ? "col-span-1 md:col-span-2 mb-0" : "mb-0"}>
                          <label htmlFor="prioridade" className="label-premium uppercase text-[10px] font-black tracking-widest text-gray-400 mb-2 block">Urgência</label>
                          <div className="relative">
                            <select 
                              id="prioridade" 
                              name="prioridade" 
                              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-[#272F5C] focus:outline-none transition-all pl-12 appearance-none"
                              autoComplete="off"
                            >
                              <option value="normal">Automática (Normal)</option>
                              {prioridades.map(p => (
                                <option key={p.id} value={p.slug}>{p.nome}</option>
                              ))}
                            </select>
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 mb-0">
                          <label htmlFor="descricao" className="label-premium uppercase text-[10px] font-black tracking-widest text-gray-400 mb-2 block">Descrição Detalhada <span className="text-[#DB3A2E]">•</span></label>
                          <textarea 
                            id="descricao"
                            name="descricao"
                            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder:text-gray-300 focus:border-[#272F5C] focus:outline-none transition-all min-h-[150px]" 
                            placeholder="Descreva aqui o que está acontecendo com o máximo de detalhes possível..."
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="premium-form-section bg-gray-50/50 p-8 rounded-b-3xl">
                      <div className="section-header-premium flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#272F5C] shadow-sm">
                          <Paperclip size={20} />
                        </div>
                        <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Anexos e Evidências</h3>
                      </div>

                      <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center bg-white hover:bg-gray-50 hover:border-[#272F5C] transition-all cursor-pointer group">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-[#272F5C] group-hover:text-white transition-all text-[#272F5C]">
                            <Paperclip size={28} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1 tracking-tight">Upload de arquivos</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Clique ou arraste imagens e PDFs</p>
                      </div>
                    </div>
                  </div>

                  <div className="nav-footer-wizard">
                    <button type="button" onClick={() => setStep(currentSubcat ? 3 : 2)} className="btn-wizard-prev">Anterior</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn-wizard-next"
                    >
                      {isSubmitting ? 'Enviando...' : <><Send size={18} /> Protocolar Chamado</>}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
