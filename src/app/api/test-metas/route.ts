import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const supabase = await getAuditedClient('system');
  const { data } = await supabase.from('metas_faturamento').select('*');
  return NextResponse.json(data);
}
