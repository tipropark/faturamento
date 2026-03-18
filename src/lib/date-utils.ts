/**
 * Utilitários de data para regras de negócio da Leve Mobilidade
 */

/**
 * Adiciona dias úteis a uma data
 * Pula finais de semana (Sábado e Domingo)
 */
export function adicionarDiasUteis(data: Date, dias: number): Date {
  const novaData = new Date(data);
  let diasAdicionados = 0;
  
  while (diasAdicionados < dias) {
    novaData.setDate(novaData.getDate() + 1);
    const diaDaSemana = novaData.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      diasAdicionados++;
    }
  }
  
  return novaData;
}

/**
 * Calcula a diferença em dias úteis entre duas datas
 * Útil para validação de 48h úteis (2 dias úteis)
 */
export function diferencaDiasUteis(dataInicio: Date, dataFim: Date): number {
  let contador = 0;
  const atual = new Date(dataInicio);
  // Resetar horas para comparação de dias cheios se necessário, 
  // mas aqui vamos considerar o delta real
  
  while (atual < dataFim) {
    atual.setDate(atual.getDate() + 1);
    if (atual > dataFim) break;
    
    const diaDaSemana = atual.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      contador++;
    }
  }
  
  return contador;
}

/**
 * Verifica se a diferença entre ocorrência e registro ultrapassa 48h úteis (2 dias úteis)
 */
export function estaForaDoPrazoAbertura(dataOcorrencia: string | Date, dataRegistro: string | Date): boolean {
  const inicio = new Date(dataOcorrencia);
  const fim = new Date(dataRegistro);
  
  const diasUteis = diferencaDiasUteis(inicio, fim);
  
  // 48h úteis = 2 dias úteis
  return diasUteis >= 2;
}

/**
 * Retorna o status do SLA baseado na data limite
 */
export function getStatusSla(dataLimite: string | Date) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const limite = new Date(dataLimite);
  limite.setHours(0, 0, 0, 0);
  
  const diffTime = limite.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencido';
  if (diffDays === 0) return 'vencendo_hoje';
  if (diffDays <= 2) return 'proximo_vencimento';
  return 'no_prazo';
}

/**
 * Calcula o tempo restante para o vencimento do SLA em dias úteis
 */
export function calcularTempoSla(dataLimite: string | Date): string {
  if (!dataLimite) return 'Data indefinida';
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(dataLimite);
  limite.setHours(0, 0, 0, 0);

  if (hoje.getTime() === limite.getTime()) {
    return "Vence hoje";
  }

  if (hoje > limite) {
    const dias = diferencaDiasUteis(limite, hoje);
    return `Vencido há ${dias} ${dias === 1 ? 'dia útil' : 'dias úteis'}`;
  } else {
    const dias = diferencaDiasUteis(hoje, limite);
    return `Faltam ${dias} ${dias === 1 ? 'dia útil' : 'dias úteis'}`;
  }
}
