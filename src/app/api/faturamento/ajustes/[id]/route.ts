import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

/**
 * API para Remoção de Ajustes Financeiros
 * DELETE /api/faturamento/ajustes/[id]
 */
export const DELETE = withAudit(async (req, session) => {
  try {
    const userId = session.user.id as string;
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'ID do ajuste ausente' }, { status: 400 });
    }

    const supabase = await getAuditedClient(userId);

    // 1. Remover o ajuste
    // O Reprocessamento do resumo diário será feito automaticamente pelo TRIGGER (trg_after_ajuste_sync) que escuta DELETE.
    const { error: errDel } = await supabase
        .from('faturamento_ajustes')
        .delete()
        .eq('id', id);

    if (errDel) {
        console.error('Erro ao deletar ajuste:', errDel);
        return NextResponse.json({ error: errDel.message || 'Erro ao remover ajuste financeiro' }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Ajuste removido com sucesso'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Falha no ajustes DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
