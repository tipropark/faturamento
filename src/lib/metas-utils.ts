import { SupabaseClient } from '@supabase/supabase-js';
import { ApuracaoMeta, MetaFaturamento, ConfiancaApuracao, StatusApuracaoMeta } from '@/types';

/**
 * Calcula o realizado de uma meta (global ou por operação)
 */
/**
 * Aciona o recálculo diário no banco e traz o resumo consolidado
 */
export async function apurarMeta(
  supabase: SupabaseClient,
  meta: MetaFaturamento
): Promise<Partial<ApuracaoMeta>> {
  const { id: meta_id } = meta;
  
  // 1. Chamar procedimento de recálculo diário no PostgreSQL
  const { error: errRPC } = await supabase.rpc('reprocessar_metas_diarias', { p_meta_id: meta_id });
  if (errRPC) throw new Error(`Erro ao reprocessar metas: ${errRPC.message}`);
  
  // 2. Buscar a apuração mais recente da meta (processada pelo RPC acima)
  const { data: apu, error: errApu } = await supabase
    .from('metas_faturamento_apuracoes')
    .select(`
      *,
      ultima_diaria:metas_faturamento_apuracoes_diarias(*)
    `)
    .eq('meta_id', meta_id)
    .order('apurado_em', { ascending: false })
    .limit(1)
    .maybeSingle(); // Usar maybeSingle para evitar erro 500 se o trigger demorar
    
  if (errApu || !apu) return null as any; // Se não achou ainda, ignora apuração inicial no POST

  // Adicionamos o informativo do ritmo ao payload
  const ultimaDiaria = apu.ultima_diaria?.[0] || {}; // O join pode vir como array dependendo da config

  return {
    ...apu,
    meta_parcial_esperada: ultimaDiaria.valor_meta_parcial_esperada,
    desvio_ritmo: (apu.valor_realizado || 0) - (ultimaDiaria.valor_meta_parcial_esperada || 0)
  } as any;
}

/**
 * Registra alertas e tratativas baseados na apuração e ritmo
 */
export async function processarAlertasMeta(
  supabase: SupabaseClient,
  apuracao: any
) {
  const { status_apuracao, meta_id, operacao_id, valor_realizado, meta_parcial_esperada, desvio_ritmo } = apuracao;

  // 1. Determinar Tipo de Alerta do Dia
  let tipo_alerta = null;
  let criticidade: string = 'media';
  let motivo = '';

  if (status_apuracao === 'meta_nao_atingida') {
    tipo_alerta = 'nao_atingimento';
    criticidade = 'alta';
    motivo = `Meta finalizada sem atingir o objetivo esperado. Realizado: ${valor_realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  } else if (desvio_ritmo < 0) {
    // Está abaixo do ritmo esperado no mês
    const percDesvio = Math.abs(desvio_ritmo / (meta_parcial_esperada || 1)) * 100;
    
    if (percDesvio > 15) {
       tipo_alerta = 'risco_nao_atingimento';
       criticidade = percDesvio > 30 ? 'critica' : 'alta';
       motivo = `Ritmo operacional crítico: ${percDesvio.toFixed(1)}% abaixo da meta parcial esperada para hoje.`;
    }
  } else if (status_apuracao === 'apuracao_inconclusiva') {
     tipo_alerta = 'apuracao_inconclusiva';
     criticidade = 'media';
     motivo = `Falta de dados de sincronização confiáveis para apurar o desempenho diário.`;
  }

  if (!tipo_alerta) return;

  // 2. Verificar se já existe alerta ABERTO do mesmo tipo para esta meta para evitar spam
  const { data: existing } = await supabase
    .from('metas_faturamento_alertas')
    .select('id')
    .eq('meta_id', meta_id)
    .eq('tipo_alerta', tipo_alerta)
    .eq('status', 'aberto')
    .maybeSingle();

  if (existing) return;

  // 3. Criar Novo Alerta
  const { data: alerta, error: errAlerta } = await supabase
    .from('metas_faturamento_alertas')
    .insert({
      meta_id,
      apuracao_id: apuracao.id,
      operacao_id,
      tipo_alerta,
      criticidade,
      status: 'aberto',
      motivo_preliminar: motivo,
      gerado_automaticamente: true
    })
    .select()
    .single();
    
  if (errAlerta || !alerta) return;
  
  // 4. Se criticidade >= Media, garantir que existe tratativa pendente na Auditoria
  const needsTratativa = ['alta', 'media', 'critica'].includes(criticidade);
  if (needsTratativa) {
      await supabase.from('metas_faturamento_tratativas').insert({
          alerta_id: alerta.id,
          operacao_id,
          status: 'pendente'
      });
  }
}
