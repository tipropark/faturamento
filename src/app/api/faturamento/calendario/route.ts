import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

/**
 * Atualiza o calendário de funcionamento de uma operação
 * Utilizado para desativar alertas em dias que a operação não funciona (ex: domingos)
 */
export const PATCH = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const body = await req.json();

  const { operacao_id, dia, funciona } = body;

  if (!operacao_id || !dia) {
    return NextResponse.json({ error: 'Parâmetros insuficientes' }, { status: 400 });
  }

  // Validar se o dia é um dos campos permitidos
  const diasValidos = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  if (!diasValidos.includes(dia)) {
    return NextResponse.json({ error: 'Dia da semana inválido' }, { status: 400 });
  }

  // Tentar atualizar ou inserir caso não exista (upsert)
  const { error } = await supabase
    .from('faturamento_operacao_calendario')
    .upsert({ 
      operacao_id, 
      [dia]: funciona,
      atualizado_at: new Date().toISOString()
    }, { onConflict: 'operacao_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Calendário atualizado: ${dia} = ${funciona}` });
});
