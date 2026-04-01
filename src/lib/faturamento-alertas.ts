import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Necessário para auditoria e escrita em massa

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AlertaContexto {
  operacao_id: string;
  data_referencia: string;
  valor_realizado: number;
  valor_meta_diaria: number;
  dia_semana: number; // 0-6
  is_feriado: boolean;
  is_dia_operacional: boolean;
  resumos_anteriores: any[];
}

/**
 * Motor de Alertas de Faturamento (Auditável e Explicável)
 */
export class FaturamentoAlertEngine {

  /**
   * Avalia uma operação em um período específico para detectar desvios
   */
  async avaliarPeriodo(operacaoId: string, dataInicio: string, dataFim: string) {
    // 1. Carregar Regras Ativas
    const { data: regras } = await supabase.from('faturamento_regras_alerta').select('*').eq('habilitada', true);
    if (!regras) return [];

    // 2. Carregar Contexto Operacional (Calendário e Feriados)
    const { data: calendario } = await supabase.from('faturamento_operacao_calendario').select('*').eq('operacao_id', operacaoId).single();
    const { data: feriados } = await supabase.from('faturamento_feriados').select('*').gte('data', dataInicio).lte('data', dataFim);
    
    // 3. Carregar Metas Ativas da Operação
    const { data: metasData } = await supabase.from('metas_faturamento')
      .select('*')
      .eq('operacao_id', operacaoId)
      .eq('status', 'ativa');

    // 4. Carregar Resumos Reais
    const { data: resumos } = await supabase.from('faturamento_resumo_diario')
      .select('*')
      .eq('operacao_id', operacaoId)
      .gte('data_referencia', dataInicio)
      .lte('data_referencia', dataFim)
      .order('data_referencia', { ascending: true });

    if (!resumos) return [];

    // 5. Carregar Alertas já Existentes para evitar duplicatas (Regra de Negócio)
    const { data: alertasExistentes } = await supabase.from('faturamento_alertas')
      .select('data_referencia, regra_id')
      .eq('operacao_id', operacaoId)
      .gte('data_referencia', dataInicio)
      .lte('data_referencia', dataFim);

    const alertasGerados: any[] = [];

    // 6. Processar Cada Dia do Período
    for (const resumo of resumos) {
      const dataRef = resumo.data_referencia;
      
      // Se já existe algum alerta para esta regra e este dia, pulamos (Não queremos repetir alertas corrigidos)
      const jaExisteNoDia = (regraId: string) => 
        alertasExistentes?.some(a => a.data_referencia === dataRef && a.regra_id === regraId);

      const d = new Date(dataRef + 'T12:00:00');
      const diaSemana = d.getDay(); // 0 (Dom) a 6 (Sab)
      
      const valorRealizado = (Number(resumo.total_receita_ajustada) || 0) + 
                             (Number(resumo.total_avulso_ajustado) || 0) + 
                             (Number(resumo.total_mensalista_ajustado) || 0);

      // 7. Buscar Meta do Mês Correspondente
      const [y, mStr] = dataRef.split('-');
      const year = Number(y);
      const month = Number(mStr);
      const metaMesCurrent = metasData?.find(meta => meta.ano === year && meta.mes === month);
      
      // REGRA AUDITORIA SÊNIOR: Se não há meta cadastrada para o mês da operação, não geramos alerta operacional
      if (!metaMesCurrent) {
        // console.log(`Pulando dia ${dataRef}: Operação sem meta cadastrada para ${month}/${year}`);
        continue; 
      }

      const diasNoMes = new Date(year, month, 0).getDate();
      const metaDiaria = (Number(metaMesCurrent.valor_meta) || 0) / diasNoMes;

      // Supressão Contextual
      const isFeriado = feriados?.some(f => f.data === dataRef) || false;
      const isDiaOperacional = this.checkDiaOperacional(calendario, diaSemana);
      
      const contexto: AlertaContexto = {
        operacao_id: operacaoId,
        data_referencia: dataRef,
        valor_realizado: valorRealizado,
        valor_meta_diaria: metaDiaria,
        dia_semana: diaSemana,
        is_feriado: isFeriado,
        is_dia_operacional: isDiaOperacional,
        resumos_anteriores: resumos.filter(r => r.data_referencia < dataRef).slice(-7)
      };

      // Avaliar Regras
      for (const regra of regras) {
        // Pulo se o alerta já existe (Regra: Nunca dois alertas para o mesmo problema no mesmo dia)
        if (jaExisteNoDia(regra.id)) continue;

        const resultado = this.executarRegra(regra, contexto, resumos);
        if (resultado.gerarAlerta) {
          alertasGerados.push({
            operacao_id: operacaoId,
            data_referencia: dataRef,
            regra_id: regra.id,
            severidade: regra.severidade,
            score: regra.score_base,
            resumo: resultado.resumo,
            detalhes: resultado.detalhes,
            suprimido: resultado.deveSuprimir,
            motivo_supressao: resultado.motivoSupressao,
            tipo_alerta: regra.codigo,
            expira_em: new Date(Date.now() + 6 * 3600000).toISOString(), // Válido por 6h por padrão
          });
        }
      }
    }

    // 6. Gravar Alertas Bloqueando Duplicatas
    if (alertasGerados.length > 0) {
      await supabase.from('faturamento_alertas').upsert(alertasGerados, { 
        onConflict: 'operacao_id,data_referencia,regra_id' 
      });
    }

    return alertasGerados;
  }

  /**
   * Execução em Lote para Rotina Agendada (Job)
   */
  async processarJobGlobal() {
    const jobStart = new Date();
    let totalAlertas = 0;
    let opsSuccess = 0;
    let errors = [];

    try {
      // 1. Marcar Início no log
      await supabase.from('faturamento_alertas_v2_status').insert({
        status_execucao: 'em_processamento',
        ultima_execucao: jobStart.toISOString()
      });

      // 2. Buscar Operações Com Metas Ativas neste mês
      const now = new Date();
      const { data: metas } = await supabase
        .from('metas_faturamento')
        .select('operacao_id')
        .eq('ano', now.getFullYear())
        .eq('mes', now.getMonth() + 1);

      const opIds = Array.from(new Set(metas?.map(m => m.operacao_id).filter(Boolean) || []));
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      const rangeStart = sevenDaysAgo > startOfMonth ? sevenDaysAgo : startOfMonth;

      // 3. Processar em lotes controlados
      for (const id of opIds) {
        try {
          const gerados = await this.avaliarPeriodo(id, rangeStart, today);
          totalAlertas += gerados.length;
          opsSuccess++;
        } catch (e: any) {
          errors.push(`Erro na Op ${id}: ${e.message}`);
        }
      }

      // 4. Finalizar e Salvar Status
      const { data: lastStatus } = await supabase
        .from('faturamento_alertas_v2_status')
        .select('id')
        .order('ultima_execucao', { ascending: false })
        .limit(1)
        .single();

      await supabase.from('faturamento_alertas_v2_status').upsert({
         id: lastStatus?.id,
         status_execucao: errors.length > 0 ? 'parcial' : 'sucesso',
         quantidade_processada: totalAlertas,
         ultima_execucao: new Date().toISOString(),
         erros: errors.join('\n')
      });

      return { success: true, totalAlertas, opsSuccess, errors };
    } catch (e: any) {
      console.error("Erro crítico no Job:", e);
      return { success: false, error: e.message };
    }
  }

  private checkDiaOperacional(cal: any, dia: number): boolean {
    if (!cal) return true; // Default: funciona todo dia
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return cal[dias[dia]] === true;
  }

  private executarRegra(regra: any, ctx: AlertaContexto, todosResumos: any[]) {
    const desvioPercentual = ctx.valor_meta_diaria > 0 ? (ctx.valor_meta_diaria - ctx.valor_realizado) / ctx.valor_meta_diaria : 0;
    
    // Regra: DIA_ZERADO
    if (regra.codigo === 'DIA_ZERADO') {
      const isZero = ctx.valor_realizado === 0;
      const deveSuprimir = ctx.is_feriado || !ctx.is_dia_operacional;
      return {
        gerarAlerta: isZero && !deveSuprimir, // REGRA: Se não funciona no dia, não gera alerta de zero
        deveSuprimir,
        motivoSupressao: deveSuprimir ? 'Supressão: Dia não operacional ou feriado.' : null,
        resumo: 'Faturamento zerado em dia operacional.',
        detalhes: { valor: 0, meta: ctx.valor_meta_diaria }
      };
    }

    // Regra: SEQUENCIA_ABAIXO_META
    if (regra.codigo === 'SEQUENCIA_ABAIXO_META') {
      const diasAlvo = regra.parametros?.dias_consecutivos || 3;
      // Pegar os últimos N dias incluindo hoje
      const historicoRecente = todosResumos.filter(r => r.data_referencia <= ctx.data_referencia).slice(-diasAlvo);
      
      if (historicoRecente.length >= diasAlvo) {
        const todosAbaixo = historicoRecente.every(r => {
          const v = (Number(r.total_receita_ajustada) || 0) + (Number(r.total_avulso_ajustado) || 0) + (Number(r.total_mensalista_ajustado) || 0);
          return v < ctx.valor_meta_diaria;
        });

        return {
          gerarAlerta: todosAbaixo,
          deveSuprimir: ctx.is_feriado,
          resumo: `${diasAlvo} dias consecutivos abaixo da meta.`,
          detalhes: { dias: diasAlvo, ultimos_valores: historicoRecente.map(h => h.total_receita_ajustada) }
        };
      }
    }

    // Regra: QUEDA_BRUSCA_HISTORICA
    if (regra.codigo === 'QUEDA_BRUSCA_HISTORICA') {
      const threshold = (regra.parametros?.percentual_queda || 35) / 100;
      const passados = ctx.resumos_anteriores || [];
      
      if (passados.length >= 3) {
        const mediaPassada = passados.reduce((acc, r) => acc + (Number(r.total_receita_ajustada) || 0) + (Number(r.total_avulso_ajustado) || 0) + (Number(r.total_mensalista_ajustado) || 0), 0) / passados.length;
        const queda = mediaPassada > 0 ? (mediaPassada - ctx.valor_realizado) / mediaPassada : 0;
        
        if (queda > threshold) {
          return {
            gerarAlerta: true,
            deveSuprimir: ctx.is_feriado || !ctx.is_dia_operacional,
            resumo: `Queda brusca de ${(queda * 100).toFixed(1)}% comparado à média recente.`,
            detalhes: { queda, realizado: ctx.valor_realizado, media_historica: mediaPassada }
          };
        }
      }
    }

    // Regra: DESVIO_META_DIARIA
    if (regra.codigo === 'DESVIO_META_DIARIA') {
      const threshold = (regra.parametros?.percentual_desvio || 25) / 100;
      const isAbaixo = desvioPercentual > threshold;
      const deveSuprimir = ctx.is_feriado || !ctx.is_dia_operacional;
      return {
        gerarAlerta: isAbaixo && !deveSuprimir, // REGRA: Ignorar desvios em dias que não funcionam
        deveSuprimir: deveSuprimir,
        resumo: `Desvio de ${(desvioPercentual * 100).toFixed(1)}% em relação à meta diária.`,
        detalhes: { desvio: desvioPercentual, realizado: ctx.valor_realizado, meta: ctx.valor_meta_diaria }
      };
    }

    return { gerarAlerta: false };
  }
}
