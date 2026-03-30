'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, RefreshCcw, AlertTriangle, CheckCircle2,
  PenLine, Info, Calendar, Target, Activity, Search, Filter,
  ChevronRight, Clock, FileText, CheckCircle, ShieldAlert,
  ArrowRightCircle, ListTodo
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
      case 'novo':
      case 'pendente': return 'var(--warning)';
      case 'em_analise': return 'var(--brand-primary)';
      case 'justificado': return 'var(--brand-primary)';
      case 'resolvido': return 'var(--success)';
      case 'descartado': return 'var(--gray-400)';
      default: return 'var(--gray-400)';
    }
  };

  const groupedAlerts = useMemo(() => {
    return {
      pendentes: alertas.filter(a => a.status === 'novo' || a.status === 'pendente'),
      emTratativa: alertas.filter(a => a.status === 'em_analise' || a.status === 'justificado'),
      concluidos: alertas.filter(a => a.status === 'resolvido' || a.status === 'descartado')
    };
  }, [alertas]);

  const stats = useMemo(() => ({
    total: alertas.length,
    pendentes: groupedAlerts.pendentes.length,
    emTratativa: groupedAlerts.emTratativa.length,
    concluidos: groupedAlerts.concluidos.length
  }), [alertas.length, groupedAlerts]);

  const renderAlertTable = (sectionAlerts: any[], title: string, icon: React.ReactNode, color: string) => {
    if (sectionAlerts.length === 0) return null;

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
          paddingBottom: '0.5rem', borderBottom: `1px solid var(--gray-100)`
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: color, color: 'white', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            {icon}
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gray-900)' }}>
            {title} ({sectionAlerts.length})
          </h3>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Data Ref.</th>
                <th>Diagnóstico / Ocorrência</th>
                <th style={{ textAlign: 'center' }}>Severidade</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sectionAlerts.map((a: any) => (
                <tr key={a.id} className="cursor-pointer" onClick={() => setSelectedAlerta(a)}>
                  <td>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                      {new Date((a.data_referencia || a.criado_at).split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 700 }}>ID #{a.id?.substring(0,8)}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-800)' }}>{getRegraFriendlyName(a.regra, a.tipo_alerta)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500, maxWidth: '500px' }}>{a.resumo}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${a.severidade === 'critico' ? 'badge-danger' : a.severidade === 'alerta' ? 'badge-warning' : 'badge-primary'}`} style={{ padding: '0.25rem 0.75rem' }}>
                      {(a.severidade || 'insight').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                      <div className="badge-dot" style={{ color: getStatusColor(a.status) }} />
                      <span style={{ color: 'var(--gray-700)' }}>
                        {(STATUS_ALERTA_META_LABELS[a.status as StatusAlertaMeta] || a.status).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-xs btn-primary">TRATAR</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="page-body" style={{ background: 'var(--bg-app)', padding: '2rem 2.5rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            className="btn-icon"
            onClick={() => router.push('/admin/auditoria/faturamento')}
            style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'white', boxShadow: 'var(--shadow-sm)' }}
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Auditoria de Faturamento
              </span>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--gray-300)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-500)' }}>
                {operacao?.bandeira || 'LOG'}
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              {loading && !operacao ? (
                <span style={{ color: 'var(--gray-200)', animation: 'pulse 1.5s infinite' }}>Carregando operação...</span>
              ) : (
                operacao?.nome_operacao || 'Unidade não encontrada'
              )}
            </h1>
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchDados}
          disabled={loading}
          style={{ height: '44px', padding: '0 1.25rem', borderRadius: '12px' }}
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          <span style={{ fontWeight: 700 }}>Sincronizar</span>
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2.5rem', gap: '1.25rem' }}>
        <div className="stat-card" style={{
          background: 'var(--brand-primary)',
          border: 'none',
          boxShadow: '0 15px 35px -10px rgba(0,0,128,0.3)'
        }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <Target size={22} />
          </div>
          <div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem' }}>Total Ocorrências</div>
            <div className="stat-value" style={{ color: 'white', fontSize: '1.5rem' }}>{stats.total}</div>
          </div>
        </div>
        <div className="stat-card" style={{ boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-dark)', width: '40px', height: '40px' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-label" style={{ fontSize: '0.65rem' }}>Pendentes</div>
            <div className="stat-value" style={{ color: 'var(--warning-dark)', fontSize: '1.5rem' }}>{stats.pendentes}</div>
          </div>
        </div>
        <div className="stat-card" style={{ boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <div className="stat-icon-wrapper" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', width: '40px', height: '40px' }}>
            <Activity size={20} />
          </div>
          <div>
            <div className="stat-label" style={{ fontSize: '0.65rem' }}>Em Tratativa</div>
            <div className="stat-value" style={{ color: 'var(--brand-primary)', fontSize: '1.5rem' }}>{stats.emTratativa}</div>
          </div>
        </div>
        <div className="stat-card" style={{ boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-dark)', width: '40px', height: '40px' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-label" style={{ fontSize: '0.65rem' }}>Concluídos</div>
            <div className="stat-value" style={{ color: 'var(--success-dark)', fontSize: '1.5rem' }}>{stats.concluidos}</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ListTodo size={20} color="var(--brand-primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gray-900)' }}>Fila de Auditoria da Unidade</h2>
        </div>

        {loading && alertas.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <RefreshCcw size={32} className="animate-spin" style={{ color: 'var(--gray-200)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-400)' }}>Sincronizando registros da unidade...</p>
          </div>
        ) : (
          <>
            {renderAlertTable(groupedAlerts.pendentes, "Ocorrências Pendentes", <ShieldAlert size={16} />, 'var(--warning)')}
            {renderAlertTable(groupedAlerts.emTratativa, "Em Tratativa / Análise", <ArrowRightCircle size={16} />, 'var(--brand-primary)')}
            {renderAlertTable(groupedAlerts.concluidos, "Ocorrências Concluídas", <CheckCircle size={16} />, 'var(--success)')}

            {alertas.length === 0 && (
              <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray-50)', borderRadius: '20px' }}>
                <CheckCircle2 size={48} color="var(--success)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: '0.25rem' }}>Tudo em ordem!</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', fontWeight: 600 }}>Nenhuma ocorrência pendente para esta operação.</p>
              </div>
            )}
          </>
        )}
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
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
