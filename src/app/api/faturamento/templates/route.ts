import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * API para listar templates de faturamento
 * GET /api/faturamento/templates
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from('faturamento_query_templates')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('LIST_TEMPLATES_ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`DEBUG_TEMPLATES: Encontrados ${data?.length || 0} templates`);
    if (data) data.forEach(t => console.log(`- ${t.nome} [${t.sistema}]`));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
