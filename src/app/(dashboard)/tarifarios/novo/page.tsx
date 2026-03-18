'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth'; // Not usable in client, will use session hook or pattern from Sinistros
import { ArrowLeft, Save, Upload, AlertCircle, Paperclip, X } from 'lucide-react';
import { TIPO_SOLICITACAO_TARIFARIO_LABELS } from '@/types';

export default function NovoTarifarioPage() {
  const router = useRouter();
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [form, setForm] = useState({
    operacao_id: '',
    tipo: 'cadastro_novo_tarifario',
    data_desejada: '',
    descricao: '',
  });

  const carregarOps = useCallback(async () => {
    const res = await fetch('/api/operacoes?status=ativa');
    const data = await res.json();
    setOperacoes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { carregarOps(); }, [carregarOps]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const MAX_SIZE = 500 * 1024 * 1024; // 500MB
      const newFiles = Array.from(e.target.files);
      const invalidFiles = newFiles.filter(f => f.size > MAX_SIZE);
      
      if (invalidFiles.length > 0) {
        setErro(`Os seguintes arquivos excedem o limite de 500MB: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }

      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!form.operacao_id) { setErro('Selecione uma operação'); return; }
    if (!form.data_desejada) { setErro('Informe a data desejada para aplicação'); return; }
    if (!form.descricao) { setErro('Informe a descrição da solicitação'); return; }
    if (files.length === 0) { setErro('É obrigatório anexar pelo menos um arquivo (tabela de preços, imagem ou documento)'); return; }

    setSaving(true);

    try {
      const res = await fetch('/api/tarifarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar solicitação');
      }

      const solicitacao = await res.json();

      // Upload de anexos
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        const uploadRes = await fetch(`/api/tarifarios/${solicitacao.id}/anexos`, {
          method: 'POST',
          body: fd,
        });
        if (!uploadRes.ok) {
          console.error('Erro ao subir anexos, mas a solicitação foi criada.');
        }
      }

      router.push(`/tarifarios/${solicitacao.id}`);
    } catch (err: any) {
      setErro(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: '0.5rem' }}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <h1 className="page-title">Nova Solicitação de Tarifário/Convênio</h1>
          <p className="page-subtitle">Preencha os dados abaixo para submeter à aprovação</p>
        </div>
      </div>

      {erro && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group span-2">
                <label className="form-label required">Operação</label>
                <select 
                  className="form-control" 
                  value={form.operacao_id} 
                  onChange={e => setForm(p => ({ ...p, operacao_id: e.target.value }))}
                >
                  <option value="">Selecione a operação...</option>
                  {operacoes.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nome_operacao} — {o.cidade}/{o.uf}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Tipo da Solicitação</label>
                <select 
                  className="form-control" 
                  value={form.tipo} 
                  onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                >
                  {Object.entries(TIPO_SOLICITACAO_TARIFARIO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Data desejada para aplicação</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.data_desejada} 
                  onChange={e => setForm(p => ({ ...p, data_desejada: e.target.value }))} 
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label required">Descrição da Solicitação</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={form.descricao} 
                  onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descreva detalhadamente o que precisa ser alterado..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Anexos Obrigatórios</div>
            <div className="card-subtitle">Tabela de preços, imagem ou documento relacionado</div>
          </div>
          <div className="card-body">
            <div 
              style={{ 
                border: '2px dashed var(--gray-200)', 
                borderRadius: 'var(--radius-md)', 
                padding: '2rem', 
                textAlign: 'center',
                backgroundColor: 'var(--gray-50)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={32} style={{ color: 'var(--gray-400)', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--gray-700)' }}>Clique para selecionar arquivos</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>Imagens ou PDF</div>
              <input id="file-input" type="file" multiple hidden accept="image/*,.pdf" onChange={handleFileChange} />
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', backgroundColor: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)' }}>
                    <Paperclip size={16} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{f.name}</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeFile(i)}>
                      <X size={14} color="var(--danger)" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="loading-spinner" />Enviando...</> : <><Save size={18} />Enviar Solicitação</>}
          </button>
        </div>
      </form>
    </div>
  );
}
