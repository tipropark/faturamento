import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const PUT = withAudit(async (req, session, { params }) => {
  try {
    const { id } = params;
    const userId = session.user.id as string;
    const body = await req.json();
    
    const supabase = await getAuditedClient(userId);

    // Remover campos que não devem ser atualizados diretamente
    const { id: _, criado_em: __, atualizado_em: ___, operacao, automacao, ...updateData } = body;
    
    const { data: chaveAtualizada, error } = await supabase
      .from('tecnologia_ia_chaves_tef')
      .update({
        ...updateData,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(chaveAtualizada);
  } catch (error: any) {
    console.error('Exceção ao atualizar chave TEF:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição', detalhes: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withAudit(async (req, session, { params }) => {
  try {
    const { id } = params;
    const userId = session.user.id as string;
    const supabase = await getAuditedClient(userId);

    const { error } = await supabase
      .from('tecnologia_ia_chaves_tef')
      .delete()
      .eq('id', id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Exceção ao deletar chave TEF:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição', detalhes: error.message },
      { status: 500 }
    );
  }
});
