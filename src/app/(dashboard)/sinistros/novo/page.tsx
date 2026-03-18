'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, AlertCircle, Search, ChevronDown, Check, FileText, User, Paperclip, X } from 'lucide-react';
import { UF_OPTIONS, CATEGORIA_ANEXO_LABELS, CategoriaAnexo } from '@/types';
import { formatarTamanho } from '@/lib/utils';
import { estaForaDoPrazoAbertura } from '@/lib/date-utils';
import { MARCAS_VEICULOS, MODELOS_POR_MARCA } from '@/constants/veiculos';

export default function NovoSinistroPage() {
  const router = useRouter();
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [filesByCategory, setFilesByCategory] = useState<Record<string, File[]>>({});
  const [uf, setUf] = useState('SP');
  const [autoUf, setAutoUf] = useState('');
  const [searchingPlate, setSearchingPlate] = useState(false);

  const [form, setForm] = useState({
    operacao_id: '',
    data_ocorrencia: '',
    data_emissao: new Date().toISOString().split('T')[0],
    motivo: '',
    danos: '',
    observacoes: '',
    cliente_nome: '',
    cliente_cpf: '',
    cliente_telefone: '',
    cliente_email: '',
    veiculo_placa: '',
    veiculo_modelo: '',
    veiculo_marca: '',
    categoria_sinistro: 'avaria',
    motivo_especifico: '',
    prioridade: 'media',
    possui_imagens: true,
    justificativa_ausencia_imagens: '',
    prevencao_melhoria: '',
    prevencao_como_evitar: '',
    local_detalhado: '',
    prevencao_observacoes_aprendizado: '',
  });

  const CATEGORIA_MOTIVOS: Record<string, string[]> = {
    avaria: ['Avaria em lanterna', 'Avaria em para-choque', 'Arranhão', 'Capô', 'Lateral traseira esquerda', 'Retrovisor', 'Vidro'],
    furto: ['Furto de pertences', 'Furto parcial do veículo', 'Furto total do veículo', 'Estepe', 'Pneu'],
    colisao: ['Moto', 'Cancela', 'Mastro da cancela', 'Veículo x Veículo', 'Veículo x Objeto'],
    estrutural: ['Infiltração', 'Queda de objeto', 'Piso/Pavimento'],
    reclamacao_posterior: ['Reclamação posterior', 'Sinistro não identificado'],
    outros: ['Outros']
  };

  const buscarDadosPlaca = async (placa: string) => {
    const cleanPlate = placa.replace(/[^A-Z0-9]/g, '');
    if (cleanPlate.length < 7) return;

    setSearchingPlate(true);
    
    try {
      const res = await fetch(`/api/utils/veiculo?placa=${cleanPlate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.marca || data.modelo) {
          setForm(p => ({
            ...p,
            veiculo_marca: data.marca || '',
            veiculo_modelo: data.modelo || ''
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar placa:", err);
    } finally {
      setSearchingPlate(false);
    }
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const limitedValue = value.slice(0, 7);
    
    setForm(p => ({ ...p, veiculo_placa: limitedValue }));
    
    if (limitedValue.length === 7) {
      buscarDadosPlaca(limitedValue);
    }
  };

  const carregarOps = useCallback(async () => {
    const res = await fetch('/api/operacoes?status=ativa');
    const data = await res.json();
    setOperacoes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { carregarOps(); }, [carregarOps]);

  // Ao selecionar operação, preencher UF automático
  const handleOperacaoChange = (opId: string) => {
    setForm(p => ({ ...p, operacao_id: opId }));
    const op = operacoes.find(o => o.id === opId);
    if (op) setAutoUf(op.uf);
  };

  const handleFileChange = (categoria: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesByCategory(prev => ({
        ...prev,
        [categoria]: [...(prev[categoria] || []), ...newFiles]
      }));
      setForm(p => ({ ...p, possui_imagens: true }));
    }
  };

  const removeFile = (categoria: string, idx: number) => {
    setFilesByCategory(prev => ({
      ...prev,
      [categoria]: prev[categoria].filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!form.operacao_id) { setErro('Selecione uma operação'); return; }
    if (!form.data_ocorrencia) { setErro('Informe a data da ocorrência'); return; }
    if (!form.categoria_sinistro) { setErro('Selecione a categoria do sinistro'); return; }
    if (!form.motivo_especifico) { setErro('Selecione o motivo específico'); return; }
    if (!form.cliente_nome) { setErro('Informe o nome do cliente'); return; }
    if (!form.cliente_cpf) { setErro('Informe o CPF do cliente'); return; }
    if (!form.veiculo_placa) { setErro('Informe a placa do veículo'); return; }
    if (!form.veiculo_marca) { setErro('Selecione a marca do veículo'); return; }
    if (!form.veiculo_modelo) { setErro('Selecione o modelo do veículo'); return; }
    
    if (!form.possui_imagens && !form.justificativa_ausencia_imagens) {
      setErro('Informe a justificativa pela ausência de imagens de CFTV');
      return;
    }

    if (form.possui_imagens) {
      if (!filesByCategory['imagens_cftv'] || filesByCategory['imagens_cftv'].length === 0) {
        setErro('Você marcou que possui imagens, favor anexar Imagens do CFTV! Se não, justifique a ausência marcando "Não há imagens".');
        return;
      }
      if (!filesByCategory['fotos_avaria'] || filesByCategory['fotos_avaria'].length === 0) {
        setErro('Favor anexar também Fotos da Avaria (obrigatório para análise do sinistro).');
        return;
      }
    }

    setSaving(true);

    const payload = { ...form };
    const res = await fetch('/api/sinistros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      setErro(err.error || 'Erro ao criar sinistro');
      setSaving(false);
      return;
    }

    const sinistro = await res.json();

    // Upload de arquivos por categoria
    const uploadPromises = Object.entries(filesByCategory).map(async ([cat, fileList]) => {
      if (fileList.length > 0) {
        const fd = new FormData();
        fileList.forEach(f => fd.append('files', f));
        fd.append('categoria', cat);
        return fetch(`/api/sinistros/${sinistro.id}/anexos`, { method: 'POST', body: fd });
      }
    });

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

    router.push(`/sinistros/${sinistro.id}`);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom: '0.75rem', borderRadius: '8px', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Abertura de Sinistro</h1>
          <p className="page-subtitle" style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Registre os detalhes da ocorrência para análise</p>
        </div>
      </div>

      {erro && (
        <div style={{ 
          background: 'var(--danger-bg)', 
          color: 'var(--danger)', 
          padding: '1rem 1.5rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          border: '1px solid var(--danger)'
        }}>
          <AlertCircle size={18} />
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dados do Solicitante */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title">Dados do Solicitante</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group span-2">
                <label className="form-label required">Operação</label>
                <select className="form-control" value={form.operacao_id} onChange={e => handleOperacaoChange(e.target.value)}>
                  <option value="">Selecione a operação...</option>
                  {operacoes.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nome_operacao} — {o.cidade}/{o.uf} ({o.bandeira})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado (UF)</label>
                <input className="form-control" value={autoUf || uf} readOnly={!!autoUf}
                  onChange={e => setUf(e.target.value)}
                  style={{ background: autoUf ? 'var(--gray-50)' : 'white' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data de emissão</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-control" type="date" value={form.data_emissao} readOnly style={{ background: 'var(--gray-50)', cursor: 'not-allowed' }} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>Data original de preenchimento (somente leitura)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dados da Ocorrência */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title">Dados da Ocorrência</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label required">Data da ocorrência</label>
                <input className="form-control" type="date" value={form.data_ocorrencia} onChange={set('data_ocorrencia')} />
                {form.data_ocorrencia && estaForaDoPrazoAbertura(form.data_ocorrencia, form.data_emissao) && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                    <AlertCircle size={14} /> Fora do prazo de abertura (48h úteis)
                  </div>
                )}
              </div>
              <div className="form-group">
                <div style={{ visibility: 'hidden' }}><label className="form-label">Placeholder</label><input className="form-control" /></div>
              </div>
              <div className="form-group">
                <label className="form-label required">Categoria do Sinistro</label>
                <select className="form-control" value={form.categoria_sinistro} onChange={e => {
                  setForm(p => ({ ...p, categoria_sinistro: e.target.value, motivo_especifico: '' }));
                }}>
                  <option value="avaria">Avaria</option>
                  <option value="furto">Furto</option>
                  <option value="colisao">Colisão</option>
                  <option value="estrutural">Estrutural</option>
                  <option value="reclamacao_posterior">Reclamação posterior</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Motivo Específico</label>
                <select className="form-control" value={form.motivo_especifico} onChange={set('motivo_especifico')}>
                  <option value="">Selecione o motivo específico...</option>
                  {form.categoria_sinistro && CATEGORIA_MOTIVOS[form.categoria_sinistro]?.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group span-2">
                <label className="form-label required">Danos</label>
                <textarea className="form-control" rows={3} value={form.danos} onChange={set('danos')} placeholder="Descreva os danos causados..." />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Observações</label>
                <textarea className="form-control" rows={2} value={form.observacoes} onChange={set('observacoes')} placeholder="Informações adicionais..." />
              </div>
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title">Dados do Cliente</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group span-2">
                <label className="form-label required">Nome completo</label>
                <input className="form-control" value={form.cliente_nome} onChange={set('cliente_nome')} placeholder="Nome do cliente" />
              </div>
              <div className="form-group">
                <label className="form-label required">CPF</label>
                <input className="form-control" value={form.cliente_cpf} onChange={set('cliente_cpf')} placeholder="000.000.000-00" />
              </div>
              <div className="form-group">
                <label className="form-label required">Telefone</label>
                <input className="form-control" value={form.cliente_telefone} onChange={set('cliente_telefone')} placeholder="(11) 99999-9999" />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.cliente_email} onChange={set('cliente_email')} placeholder="cliente@email.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Dados do Veículo */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title">Dados do Veículo</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label required">Placa</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-control" 
                    value={form.veiculo_placa} 
                    onChange={handlePlateChange} 
                    placeholder="ABC1234" 
                    style={{ textTransform: 'uppercase' }} 
                  />
                  {searchingPlate && (
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      <span className="loading-spinner dark" style={{ width: '14px', height: '14px' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Marca</label>
                <select 
                  className="form-control" 
                  value={form.veiculo_marca} 
                  onChange={e => {
                    const val = e.target.value;
                    setForm(p => ({ ...p, veiculo_marca: val, veiculo_modelo: '' }));
                  }}
                >
                  <option value="">Selecione a marca...</option>
                  {MARCAS_VEICULOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Modelo</label>
                <select 
                  className="form-control" 
                  value={form.veiculo_modelo} 
                  onChange={e => setForm(p => ({ ...p, veiculo_modelo: e.target.value }))}
                  disabled={!form.veiculo_marca}
                >
                  <option value="">{form.veiculo_marca ? "Selecione o modelo..." : "Selecione a marca primeiro"}</option>
                  {form.veiculo_marca && (MODELOS_POR_MARCA[form.veiculo_marca] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="Outro (Não listado)">Outro (Não listado)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Prevenção e Aprendizado */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title">Prevenção e Aprendizado</div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group span-2">
                <label className="form-label">Local da Ocorrência (Setor / Vaga / Piso / Andar)</label>
                <input className="form-control" value={form.local_detalhado} onChange={set('local_detalhado')} placeholder="Detalhes do local da ocorrência..." />
              </div>
              <div className="form-group span-2">
                <label className="form-label">O que poderia ser melhorado?</label>
                <textarea className="form-control" rows={2} value={form.prevencao_melhoria} onChange={set('prevencao_melhoria')} placeholder="Ações que a operação pode tomar..." />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Como esse sinistro poderia ter sido evitado?</label>
                <textarea className="form-control" rows={2} value={form.prevencao_como_evitar} onChange={set('prevencao_como_evitar')} placeholder="Ex: Câmeras posicionadas diferente, mais luz, lider acompanhando..." />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Observações de Prevenção/Aprendizado</label>
                <textarea className="form-control" rows={2} value={form.prevencao_observacoes_aprendizado} onChange={set('prevencao_observacoes_aprendizado')} placeholder="Informações adicionais da prevenção..." />
              </div>
            </div>
          </div>
        </div>

        {/* Evidências */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title">Evidências</div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Possui imagens de CFTV?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                {[{ v: true, l: 'Sim, anexar agora' }, { v: false, l: 'Não há imagens' }].map(({ v, l }) => (
                  <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', background: form.possui_imagens === v ? 'var(--brand-primary-light)' : 'white', borderColor: form.possui_imagens === v ? 'var(--brand-primary)' : 'var(--gray-200)' }}>
                    <input type="radio" checked={form.possui_imagens === v} onChange={() => setForm(p => ({ ...p, possui_imagens: v }))} hidden />
                    {form.possui_imagens === v ? <Check size={14} color="var(--brand-primary)" /> : <div style={{ width: 14 }} />}
                    <span style={{ fontWeight: form.possui_imagens === v ? 600 : 400, color: form.possui_imagens === v ? 'var(--brand-primary)' : 'var(--gray-600)' }}>{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {!form.possui_imagens && (
              <div className="form-group animate-in" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                <label className="form-label required" style={{ color: 'var(--danger)', fontWeight: 700 }}>Motivo da ausência de imagens</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  value={form.justificativa_ausencia_imagens} 
                  onChange={set('justificativa_ausencia_imagens')} 
                  placeholder="Justifique obrigatoriamente por que não há imagens deste sinistro..."
                  style={{ borderColor: 'var(--danger-border)' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> Uma inconsistência será gerada automaticamente pela falta de evidências.
                </div>
              </div>
            )}

            {form.possui_imagens && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                {[
                  {
                    titulo: '1. Documentos Obrigatórios da Ocorrência',
                    icon: FileText,
                    categorias: ['imagens_cftv', 'fotos_avaria', 'imagens_ocorrencia', 'ticket_cupom_fiscal', 'boletim_ocorrencia']
                  },
                  {
                    titulo: '2. Documentos do Cliente e do Veículo',
                    icon: User,
                    categorias: ['documentos_cliente', 'documento_veiculo', 'cnh_rg_cpf']
                  },
                  {
                    titulo: '3. Prevenção e Outros',
                    icon: Paperclip,
                    categorias: ['fotos_prevencao', 'evidencias_adicionais']
                  }
                ].map((secao) => (
                  <div key={secao.titulo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.5rem' }}>
                      <secao.icon size={18} style={{ color: 'var(--brand-primary)' }} />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-700)' }}>{secao.titulo}</h3>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                      {secao.categorias.map((catId) => {
                        const catLabel = CATEGORIA_ANEXO_LABELS[catId as CategoriaAnexo];
                        const items = filesByCategory[catId] || [];
                        const temArquivos = items.length > 0;
                        
                        return (
                          <div 
                            key={catId} 
                            className="card" 
                            style={{ 
                              border: temArquivos ? '1px solid var(--brand-primary-light)' : '1px dotted var(--gray-300)', 
                              backgroundColor: temArquivos ? 'white' : 'var(--gray-50)', 
                              padding: '1rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ color: temArquivos ? 'var(--brand-primary)' : 'var(--gray-600)' }}>{catLabel}</span>
                              <span className={`badge ${temArquivos ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                                {items.length}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: temArquivos ? '0.75rem' : '0' }}>
                              {items.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--gray-50)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)' }}>
                                  <Paperclip size={12} style={{ color: 'var(--brand-primary)' }} />
                                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-700)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {f.name}
                                  </span>
                                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }} 
                                          onClick={() => removeFile(catId, i)}>
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            <button 
                              type="button" 
                              className={`btn ${temArquivos ? 'btn-ghost' : 'btn-secondary'} btn-xs`} 
                              style={{ width: '100%', fontSize: '0.7rem', gap: '0.4rem', marginTop: temArquivos ? '0' : '0.5rem' }} 
                              onClick={() => document.getElementById(`input-${catId}`)?.click()}
                            >
                              <Upload size={12} /> {temArquivos ? 'Adicionar mais' : 'Fazer Upload'}
                            </button>
                            <input id={`input-${catId}`} type="file" multiple hidden accept="image/*,.pdf" onChange={handleFileChange(catId)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <><span className="loading-spinner" />Registrando sinistro...</> : <><Save size={18} />Registrar Sinistro</>}
          </button>
        </div>
      </form>
    </div>
  );
}
