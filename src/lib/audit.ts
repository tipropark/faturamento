import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export interface AuditLogParams {
  usuarioId: string;
  modulo: string;
  submodulo?: string;
  acao: string;
  descricao: string;
  entidade?: string;
  registroId?: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  status?: 'sucesso' | 'falha' | 'negado';
  criticidade?: 'baixa' | 'media' | 'alta' | 'critica';
  origem?: 'manual' | 'automatica' | 'integracao' | 'sistema';
  detalhes?: any;
  operacaoId?: string;
}

/**
 * Função centralizada para registro de auditoria manual/aplicação.
 * Usada para eventos que não são alterações diretas no banco (login, falhas, exportação).
 */
export async function recordAuditLog(req: NextRequest | null, params: AuditLogParams) {
  try {
    const supabase = await createAdminClient();
    
    const ip = req ? (req.headers.get('x-forwarded-for') || 'unknown') : 'internal';
    const userAgent = req ? (req.headers.get('user-agent') || 'unknown') : 'system';

    const { error } = await supabase.from('auditoria_administrativa').insert({
      usuario_id: params.usuarioId,
      modulo: params.modulo,
      submodulo: params.submodulo,
      acao: params.acao,
      descricao: params.descricao,
      entidade_afetada: params.entidade,
      registro_id: params.registroId,
      dados_anteriores: params.dadosAnteriores,
      dados_novos: params.dadosNovos,
      status: params.status || 'sucesso',
      origem: params.origem || 'manual',
      criticidade: params.criticidade || 'baixa',
      detalhes: params.detalhes || {},
      ip_address: ip,
      user_agent: userAgent,
      operacao_id: params.operacaoId,
      criado_em: new Date().toISOString()
    });

    if (error) console.error('Erro Auditoria:', error);
    return !error;
  } catch (err) {
    console.error('Falha Auditoria:', err);
    return false;
  }
}

/**
 * Wrapper para clientes Supabase que garante que o ID do usuário seja passado para os Triggers de DB.
 * Fundamental para a Auditoria Global Automática (v2).
 */
export async function getAuditedClient(userId: string) {
  const supabase = await createAdminClient();
  
  // Configura o ID do usuário na sessão do PostgreSQL para que os triggers fn_auditoria_global_automatica capturem.
  if (userId) {
    const { error: rpcError } = await supabase.rpc('set_config', { 
      name: 'audit.current_user_id', 
      value: userId, 
      is_local: true 
    });
    if (rpcError) console.error('Aviso: Falha ao setar contexto de auditoria no DB', rpcError);
  }
  
  return supabase;
}

/**
 * Helper para mascarar dados sensíveis.
 */
export function maskSensitiveData(data: any, keys: string[] = ['password', 'secret', 'token', 'key', 'credential']) {
  if (!data || typeof data !== 'object') return data;
  const masked = { ...data };
  for (const key of Object.keys(masked)) {
    if (keys.some(k => key.toLowerCase().includes(k)) && masked[key]) {
      masked[key] = '********';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key], keys);
    }
  }
  return masked;
}

/**
 * Middleware/Wrapper para API Routes que automatiza verificações e logs básicos.
 */
export function withAudit(handler: (req: NextRequest, session: any, context: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    try {
      const response = await handler(req, session, context);
      
      if (response.status === 403) {
        await recordAuditLog(req, {
          usuarioId: userId,
          modulo: req.nextUrl.pathname.split('/')[2] || 'sistema',
          acao: 'access_denied',
          descricao: `Acesso negado à rota: ${req.nextUrl.pathname}`,
          status: 'negado',
          criticidade: 'alta'
        });
      }

      return response;
    } catch (error: any) {
      await recordAuditLog(req, {
        usuarioId: userId,
        modulo: 'sistema',
        acao: 'api_error',
        descricao: `Erro crítico na API ${req.nextUrl.pathname}: ${error.message}`,
        status: 'falha',
        criticidade: 'critica',
        detalhes: { stack: error.stack }
      });
      throw error;
    }
  };
}
