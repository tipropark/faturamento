'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, RefreshCcw, AlertTriangle, CheckCircle2, 
  PenLine, Info, Calendar, Target, Activity, Search, Filter, ChevronRight
} from 'lucide-react';
import { 
  StatusAlertaMeta, STATUS_ALERTA_META_LABELS 
} from '@/types';
import AlertaTratativaModal from '@/components/faturamento/AlertaTratativaModal';

const REGRA_LABELS: Record<string, string> = {
  'DIA_ZERADO': 'Faturamento Não Identificado',
  'SEQUENCIA_ABAIXO_META': 'Sequência abaixo da Meta',
  'QUEDA_BRUSCA_HISTORICA': 'Queda Brusca de Receita',
  'DESVIO_META_DIARIA': 'Desvio de Meta Diária',
  'ATINGIMENTO_CRITICO': 'Atingimento Crítico',
  'ESTAGNACAO_FATURAMENTO': 'Estagnação de Faturamento'
};

const getRegraFriendlyName = (regra: any, tipoAlerta: string) => {
  if (regra?.titulo) return regra.titulo;
  const codigo = regra?.codigo || tipoAlerta;
  return REGRA_LABELS[codigo] || codigo.replace(/_/g, ' ').toUpperCase();
};

export default function OperationAlertsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [operacao, setOperacao] = useState<any>(null);
  const [selectedAlerta, setSelectedAlerta] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<string>('');

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      const [resOp, resAlertas, resSess] = await Promise.all([
        fetch(`/api/operacoes?id=${id}`),
        fetch(`/api/faturamento/alertas?operacao_id=${id}`),
        fetch('/api/auth/session')
      ]);
      
      const dataOp = await resOp.json();
      const dataAlertas = await resAlertas.json();
      const sess = await resSess.json();

      setOperacao(dataOp);
      setAlertas(Array.isArray(dataAlertas) ? dataAlertas : []);
      setUserProfile(sess?.user?.perfil || '');

      if (selectedAlerta) {
        const updated = (dataAlertas as any[]).find(a => a.id === selectedAlerta.id);
        if (updated) setSelectedAlerta(updated);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, selectedAlerta?.id]);

  useEffect(() => {
    fetchDados();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'novo': return '#F97316';
      case 'em_analise': return '#3B82F6';
      case 'resolvido': return '#22C55E';
      default: return '#94A3B8';
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header V2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push('/admin/auditoria/metas')}
            style={{ 
              width: '40px', height: '40px', borderRadius: '10px', background: 'white', 
              border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={20} color="#64748B" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>Auditoria Individual</span>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>{operacao?.bandeira || 'LOG'}</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginTop: '0.2rem' }}>
              {operacao?.nome_operacao || 'Carregando Operação...'}
            </h1>
          </div>
        </div>
        
        <button 
          onClick={fetchDados} 
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: 600, color: '#475569', cursor: 'pointer'
          }}
        >
          <RefreshCcw size={16} className={loading ? 'rotate-animation' : ''} />
          Sincronizar
        </button>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
         <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>TOTAL DE OCORRÊNCIAS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{alertas.length}</div>
         </div>
         <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#F97316', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>PENDENTES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F97316' }}>{alertas.filter(a => a.status === 'novo').length}</div>
         </div>
         <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>EM TRATATIVA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B82F6' }}>{alertas.filter(a => a.status === 'em_analise').length}</div>
         </div>
         <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>CONCLUÍDOS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22C55E' }}>{alertas.filter(a => a.status === 'resolvido').length}</div>
         </div>
      </div>

      {/* Alerts Table V2 */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.4rem', background: '#F8FAFC', borderRadius: '6px' }}><Activity size={18} color="#3B82F6" /></div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>Fila de Auditoria da Unidade</h2>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                     <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Data Ref.</th>
                     <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Diagnóstico</th>
                     <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Severidade</th>
                     <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Status</th>
                     <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Ações</th>
                  </tr>
               </thead>
               <tbody>
                  {loading && alertas.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>Sincronizando registros de faturamento...</td></tr>
                  ) : alertas.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>Unidade sem pendências de auditoria.</td></tr>
                  ) : alertas.map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="hover-row">
                       <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B' }}>
                             {new Date((a.data_referencia || a.criado_at).split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600 }}>ID #{a.id?.substring(0,8)}</div>
                       </td>
                       <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>{getRegraFriendlyName(a.regra, a.tipo_alerta)}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.resumo}</div>
                       </td>
                       <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px',
                            background: a.severidade === 'critico' ? '#FEF2F2' : '#EFF6FF',
                            color: a.severidade === 'critico' ? '#EF4444' : '#3B82F6'
                          }}>
                             {(a.severidade || 'insight').toUpperCase()}
                          </span>
                       </td>
                       <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>
                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(a.status) }} />
                             {(STATUS_ALERTA_META_LABELS[a.status as StatusAlertaMeta] || a.status).toUpperCase()}
                          </div>
                       </td>
                       <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <button 
                            className="btn-tratar"
                            onClick={() => setSelectedAlerta(a)}
                            style={{ 
                              padding: '0.4rem 1rem', background: '#0F172A', color: 'white', border: 'none', 
                              borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                            }}
                          >
                             TRATAR OCORRÊNCIA
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {selectedAlerta && (
        <AlertaTratativaModal 
          alerta={selectedAlerta}
          onClose={() => setSelectedAlerta(null)}
          onRefresh={fetchDados}
          canEdit={userProfile === 'auditoria' || userProfile === 'administrador'}
        />
      )}

      <style jsx>{`
        .hover-row:hover { background: #F8FAFC; }
        .btn-tratar:hover { background: #1E293B !important; transform: translateY(-1px); }
        .rotate-animation { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
