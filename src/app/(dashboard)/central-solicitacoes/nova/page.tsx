'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ChevronRight, 
  ArrowLeft,
  FileText,
  Paperclip,
  Save,
  Info
} from 'lucide-react';
import { CentralDepartamento, CentralCategoria, CentralSubcategoria, CentralCampoDinamico } from '@/types/central-solicitacoes';
import { Operacao } from '@/types';

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // States para seleção
  const [departamentos, setDepartamentos] = useState<CentralDepartamento[]>([]);
  const [selectedDeptoId, setSelectedDeptoId] = useState<string | null>(null);
  
  const [categorias, setCategorias] = useState<CentralCategoria[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  
  const [subcategorias, setSubcategorias] = useState<CentralSubcategoria[]>([]);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);

  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [selectedOperacaoId, setSelectedOperacaoId] = useState<string | null>(null);

  const [camposDinamicos, setCamposDinamicos] = useState<CentralCampoDinamico[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade_id: '',
  });

  // Fetch inicial de departamentos
  useEffect(() => {
    // Simulação de fetch para teste inicial
    setDepartamentos([
      { id: '1', nome: 'TI', descricao: 'Suporte Técnico', ativo: true, ordem: 1, icone: 'Monitor' },
      { id: '2', nome: 'RH', descricao: 'Recursos Humanos', ativo: true, ordem: 2, icone: 'Users' },
      { id: '3', nome: 'Financeiro', descricao: 'Gestão Financeira', ativo: true, ordem: 3, icone: 'DollarSign' },
      { id: '4', nome: 'Operações', descricao: 'Suporte de Campo', ativo: true, ordem: 4, icone: 'Truck' },
    ] as any);
  }, []);

  // Fetch categorias quando muda o depto
  useEffect(() => {
    if (selectedDeptoId) {
      // Simulação de fetch
      setCategorias([
        { id: 'c1', departamento_id: selectedDeptoId, nome: 'Acesso a Sistema', exige_operacao: 'opcional' },
        { id: 'c2', departamento_id: selectedDeptoId, nome: 'Hardware/Equipamento', exige_operacao: 'obrigatoria' },
        { id: 'c3', departamento_id: selectedDeptoId, nome: 'Dúvida Operacional', exige_operacao: 'dispensada' },
      ] as any);
    }
  }, [selectedDeptoId]);

  // Fetch subcategorias e campos dinâmicos quando muda a cat
  useEffect(() => {
    if (selectedCatId) {
      setLoading(true);
      // Simulação
      setTimeout(() => {
        setSubcategorias([
          { id: 's1', categoria_id: selectedCatId, nome: 'Bloqueio de usuário' },
          { id: 's2', categoria_id: selectedCatId, nome: 'Mudança de perfil' },
        ] as any);
        setCamposDinamicos([
          { id: 'f1', label: 'Sistema Afetado', tipo: 'select', configuracoes: ['ERP', 'Site', 'App Supervisor'], obrigatorio: true },
          { id: 'f2', label: 'Código do Erro (se houver)', tipo: 'texto_curto', obrigatorio: false },
        ] as any);
        setLoading(false);
      }, 500);
    }
  }, [selectedCatId]);

  const handleDeptoSelect = (id: string) => {
    setSelectedDeptoId(id);
    setSelectedCatId(null);
    setStep(2);
  };

  const currentCategory = categorias.find(c => c.id === selectedCatId);

  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto py-4">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="btn btn-secondary btn-icon"
          title="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">Nova Solicitação</h1>
          <p className="page-subtitle">Passo {step} de 3 — {step === 1 ? 'Selecione o Departamento de Destino' : step === 2 ? 'Defina a Categoria' : 'Preencha os Detalhes da Solicitação'}</p>
        </div>
      </header>

      {/* Step 1: Departamento de Destino */}
      {step === 1 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {departamentos.map((depto) => (
            <div 
              key={depto.id} 
              className={`card flex flex-col items-center text-center p-8 cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-lg ${selectedDeptoId === depto.id ? 'border-brand-primary bg-brand-primary-light' : ''}`}
              onClick={() => handleDeptoSelect(depto.id)}
            >
              <div 
                className="w-16 h-16 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center mb-6"
              >
                <Building2 size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{depto.nome}</h4>
                <p className="text-xs text-muted mt-2 leading-relaxed">{depto.descricao}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Step 2: Categoria */}
      {step === 2 && (
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted mb-4 px-2">Selecione a Categoria</h3>
          {categorias.map((cat) => (
            <div 
              key={cat.id} 
              className="card flex items-center justify-between p-6 cursor-pointer hover:border-brand-primary hover:bg-gray-50 transition-all"
              onClick={() => {
                setSelectedCatId(cat.id);
                setStep(3);
              }}
            >
              <div>
                <h4 className="text-lg font-bold text-gray-900">{cat.nome}</h4>
                <div className="flex gap-3 mt-3">
                  {cat.exige_operacao === 'obrigatoria' && <span className="badge badge-danger">Exige Unidade</span>}
                  {cat.exige_operacao === 'opcional' && <span className="badge badge-info">Unidade Opcional</span>}
                  <span className="badge badge-primary">SLA: {cat.sla_conclusao_horas || 48}h</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>
          ))}
        </section>
      )}

      {/* Step 3: Detalhes */}
      {step === 3 && (
        <section className="card p-10">
          <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); setSuccess(true); }}>
            {/* Context Summary Banner */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex gap-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Departamento Destino</span>
                <span className="text-sm font-bold text-brand-primary">{departamentos.find(d => d.id === selectedDeptoId)?.nome}</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-gray-200 pl-12">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Categoria</span>
                <span className="text-sm font-bold text-brand-primary">{currentCategory?.nome}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Título / Assunto da Solicitação</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Exemplo: Preciso de acesso à impressora do DP" 
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Subcategoria */}
              {subcategorias.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Subcategoria</label>
                  <select className="form-control">
                    <option value="">Selecione...</option>
                    {subcategorias.map(sub => <option key={sub.id} value={sub.id}>{sub.nome}</option>)}
                  </select>
                </div>
              )}

              {/* Operação (Condicional) */}
              {currentCategory?.exige_operacao !== 'dispensada' && (
                <div className="form-group">
                  <label className="form-label">Unidade Operacional Relacionada {currentCategory?.exige_operacao === 'obrigatoria' && '*'}</label>
                  <select className="form-control" required={currentCategory?.exige_operacao === 'obrigatoria'}>
                    <option value="">Selecione a unidade...</option>
                    <option value="op1">Curitiba Store 01</option>
                    <option value="op2">São Paulo Hospital X</option>
                  </select>
                  <p className="cell-sub mt-2">Vincule a uma unidade caso o problema seja local</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Prioridade da Solicitação</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'baixa', label: 'Baixa', class: 'badge-priority-baixa' },
                  { id: 'normal', label: 'Normal', class: 'badge-priority-normal' },
                  { id: 'alta', label: 'Alta', class: 'badge-priority-alta' },
                  { id: 'urgente', label: 'Urgente', class: 'badge-priority-urgente' },
                ].map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                    <input type="radio" name="prioridade" value={p.id} />
                    <span className={`badge ${p.class} uppercase text-[10px] font-black tracking-tighter`}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Campos Dinâmicos Layout Refined */}
            {camposDinamicos.length > 0 && (
              <div className="bg-brand-primary-light/30 p-8 rounded-2xl border border-brand-primary-light grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 mb-2">
                  <Info size={16} className="text-brand-primary" />
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Informações Complementares Deste Tipo de Solicitação</span>
                </div>
                {camposDinamicos.map(campo => (
                  <div key={campo.id} className="form-group">
                    <label className="form-label">{campo.label} {campo.obrigatorio && '*'}</label>
                    {campo.tipo === 'select' ? (
                      <select className="form-control" required={campo.obrigatorio}>
                        <option value="">Selecione...</option>
                        {Array.isArray(campo.configuracoes) && campo.configuracoes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="form-control" required={campo.obrigatorio} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Descrição Detalhada do Chamado</label>
              <textarea 
                className="form-control" 
                rows={6} 
                placeholder="Descreva o problema ou solicitação com o máximo de detalhes possível para agilizar o atendimento..."
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Anexos e Documentos</label>
              <div 
                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:border-brand-primary hover:bg-white transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:text-brand-primary transition-all">
                   <Paperclip size={24} />
                </div>
                <p className="text-sm font-bold text-gray-900">Arraste ou clique para anexar</p>
                <p className="text-xs text-muted mt-2">Imagens (JPG/PNG), PDFs ou Prints (máx 10MB)</p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button type="submit" className="btn btn-primary px-12 py-4 text-lg">
                <Save size={20} />
                Registrar Solicitação
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
