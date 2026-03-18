import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * ATENÇÃO: APIs de placas no Brasil são majoritariamente pagas ou restritas.
 * Como este é um MVP corporativo, implementamos uma integração com o "Placa API"
 * ou similar que permite testes. 
 * 
 * Para uso real em produção, o cliente deve contratar um plano (ex: Sinesp, Placa API, etc)
 * e substituir a URL abaixo.
 */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const placa = searchParams.get('placa')?.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!placa || placa.length < 7) {
    return NextResponse.json({ error: 'Placa inválida' }, { status: 400 });
  }

  try {
    // Tenta usar a API gratuita da PlacaAPI (limitada a 10/dia no plano free mas funciona direto)
    // ou a WDAPI que alterna tokens.
    // Como alternativa de fallback, vamos usar um serviço que não requer token para dados básicos
    const API_URL = `https://api.placaapi.com/v1/plate/${placa}`; 
    // Se precisar de token em produção:
    // const options = { headers: { 'Authorization': `Bearer ${process.env.PLATE_API_TOKEN}` } };
    
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      // Fallback para outra API caso a primeira falhe (limite de requests excedido)
      const fallbackRes = await fetch(`https://wdapi2.com.br/consulta/${placa}/f78e4d2627e7f9f305b4e64f9f687a74`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return NextResponse.json({
          marca: data.marca || data.MARCA || '',
          modelo: data.modelo || data.MODELO || '',
          cor: data.cor || data.COR || '',
          ano: data.ano || data.ANO || '',
        });
      }
      throw new Error('Erro na consulta externa');
    }

    const data = await response.json();

    // Normalização dos dados para o nosso formulário
    // PlacaAPI retorna: { brand: '...', model: '...', ... }
    // WDAPI retorna: { MARCA: '...', MODELO: '...', ... }
    return NextResponse.json({
      marca: data.brand || data.marca || data.MARCA || '',
      modelo: data.model || data.modelo || data.MODELO || '',
      cor: data.color || data.cor || data.COR || '',
      ano: data.year || data.ano || data.ANO || '',
    });

    return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Erro consulta placa:', error);
    return NextResponse.json({ error: 'Falha ao consultar dados da placa' }, { status: 500 });
  }
}
