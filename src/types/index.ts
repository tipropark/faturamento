export type Perfil =
  | 'administrador'
  | 'diretoria'
  | 'gerente_operacoes'
  | 'supervisor'
  | 'analista_sinistro'
  | 'financeiro'
  | 'rh'
  | 'dp'
  | 'auditoria'
  | 'ti'
  | 'administrativo';

export type StatusUsuario = 'ativo' | 'inativo';

export type Bandeira = 'GPA' | 'Assaí' | 'Carrefour' | 'TriCeplo' | 'Outros';

export type TipoOperacao =
  | 'supermercado'
  | 'shopping'
  | 'hospital'
  | 'predio_comercial'
  | 'estacionamento'
  | 'outro';

export type StatusOperacao = 'ativa' | 'inativa';

export type StatusSinistro =
  | 'aberto'
  | 'em_analise'
  | 'aguardando_documentos'
  | 'aprovado'
  | 'reprovado'
  | 'encerrado';

export type PrioridadeSinistro = 'baixa' | 'media' | 'alta' | 'urgente';

export type StatusInconsistencia = 'pendente' | 'aprovada' | 'reprovada' | 'corrigida';

export type CategoriaSinistro =
  | 'avaria'
  | 'furto'
  | 'colisao'
  | 'estrutural'
  | 'reclamacao_posterior'
  | 'outros';
  
export type TipoSolicitacaoTarifario = 
  | 'cadastro_novo_tarifario'
  | 'alteracao_tarifario_existente'
  | 'cadastro_novo_convenio'
  | 'alteracao_convenio_existente';

export type StatusSolicitacaoTarifario =
  | 'pendente'
  | 'aprovado'
  | 'reprovado'
  | 'em_execucao'
  | 'concluido';

export type StatusMeta = 'ativa' | 'inativa' | 'cancelada';
export type TipoMeta = 'operacao' | 'global';
export type StatusApuracaoMeta = 
  | 'no_ritmo' 
  | 'levemente_atrasada' 
  | 'em_recuperacao' 
  | 'critica' 
  | 'sem_base_suficiente'
  | 'meta_atingida' 
  | 'meta_nao_atingida';

export type StatusDiarioMeta = 
  | 'acima_da_meta' 
  | 'dentro_da_meta' 
  | 'abaixo_da_meta' 
  | 'sem_movimento' 
  | 'sem_apuracao' 
  | 'apuracao_inconclusiva'
  | 'sem_dados';

export type ConfiancaApuracao = 'alta' | 'media' | 'baixa';
export type StatusAlertaMeta = 'pendente' | 'em_analise' | 'justificado' | 'resolvido' | 'descartado';
export type CriticidadeAlertaMeta = 'baixa' | 'media' | 'alta' | 'critica';
export type StatusTratativaAlerta = 'pendente' | 'em_analise' | 'concluida' | 'sem_procedencia';
export type CategoriaCausaMeta = 'queda_movimento' | 'despesa_elevada' | 'falha_sincronizacao' | 'inconsistencia_dados' | 'erro_operacional' | 'outros';

export type CategoriaAnexo =
  | 'imagens_ocorrencia'
  | 'evidencias_adicionais'
  | 'orcamento'
  | 'documentos'
  | 'comprovantes_financeiros'
  | 'documentos_cliente'
  | 'documento_veiculo'
  | 'cnh_rg_cpf'
  | 'ticket_cupom_fiscal'
  | 'boletim_ocorrencia'
  | 'orcamento_sinistrado'
  | 'reducao_orcamentos'
  | 'evidencia_conclusao'
  | 'imagens_cftv'
  | 'fotos_avaria'
  | 'fotos_prevencao';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  telefone?: string;
  status: StatusUsuario;
  ativo: boolean;
  gerente_operacoes_id?: string;
  gerente_operacoes?: Usuario;
  supervisores?: Usuario[];
  criado_em: string;
  atualizado_em: string;
}

export interface Operacao {
  id: string;
  nome_operacao: string;
  codigo_operacao: string;
  bandeira: Bandeira;
  tipo_operacao: TipoOperacao;
  cidade: string;
  uf: string;
  endereco?: string;
  quantidade_vagas: number;
  possui_cftv: boolean;
  supervisor_id: string;
  supervisor?: Usuario;
  gerente_operacoes_id?: string;
  gerente_operacoes?: Usuario;
  status: StatusOperacao;
  observacoes_operacionais?: string;
  // Novos campos estruturais da Evolução do Módulo de Operações
  cep?: string;
  quantidade_vagas_moto: number;
  possui_bicicletario: boolean;
  vagas_bicicletario: number;
  recuo_calcada: boolean;
  ticket_manual: boolean;
  segmento_local?: string;
  horario_funcionamento?: string;
  horario_fechamento?: string;
  pernoita_veiculo: boolean;
  local_guarda_chaves?: string;
  seguro_sinistro: boolean;
  possui_manobra: boolean;
  manobra_fora_estacionamento: boolean;
  qtd_cancelas: number;
  qtd_cftv: number;
  total_escopo_funcionarios: number;
  qtd_lideres: number;
  qtd_operadores_caixa: number;
  qtd_operadores_estacionamento: number;
  qtd_asg: number;
  direito_assiduidade: boolean;
  direito_cesta: boolean;
  valor_cesta: number;
  direito_ticket: boolean;
  valor_ticket: number;
  consumo_bobinas: boolean;
  bobinas_tipo_modelo?: string;
  aprovacao_diretoria: boolean;
  evidencia_alteracoes?: string;
  data_encerramento?: string;
  obs_gerente_operacoes?: string;
  // Integração CloudPark
  cloudpark_filial_codigo?: number;
  cloudpark_ativo?: boolean;
  integracao_faturamento_tipo?: string;

  criado_em: string;
  atualizado_em: string;
}

export interface Sinistro {
  id: string;
  pr: string;
  protocolo: string;
  status: StatusSinistro;
  prioridade: PrioridadeSinistro;
  criado_por_id: string;
  criado_por?: Usuario;
  operacao_id: string;
  operacao?: Operacao;
  supervisor_id: string;
  supervisor?: Usuario;
  gerente_operacoes_id?: string;
  gerente_operacoes?: Usuario;
  // Cliente
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  cliente_email?: string;
  // Veículo
  veiculo_placa: string;
  veiculo_modelo: string;
  veiculo_marca: string;
  // Ocorrência
  data_ocorrencia: string;
  data_emissao: string;
  motivo: string;
  danos: string;
  situacao?: string;
  observacoes?: string;
  possui_imagens: boolean;
  // Tratativa
  analista_id?: string;
  analista?: Usuario;
  data_inicio_analise?: string;
  obs_internas?: string;
  // Financeiro
  aprovado_pagamento?: boolean;
  data_pagamento?: string;
  obs_financeiro?: string;
  // Encerramento
  data_conclusao?: string;
  resultado_final?: string;
  criado_em: string;
  atualizado_em: string;
  // Campos da Evolução
  categoria_sinistro?: CategoriaSinistro;
  motivo_especifico?: string;
  local_detalhado?: string;
  data_limite_sla?: string;
  fora_do_prazo_abertura?: boolean;
  prevencao_melhoria?: string;
  prevencao_como_evitar?: string;
  prevencao_acao_recomendada?: string;
  prevencao_responsavel_id?: string;
  prevencao_responsavel?: Usuario;
  prevencao_status_acao?: string;
  prevencao_observacoes_aprendizado?: string;
  // Redução de Orçamentos
  reducao_valor_original?: number;
  reducao_valor_negociado?: number;
  reducao_observacao?: string;
  reducao_responsavel_id?: string;
  reducao_data?: string;
}

export interface MetaFaturamento {
  id: string;
  operacao_id?: string;
  operacao?: Operacao;
  tipo_meta: TipoMeta;
  ano: number;
  mes: number;
  valor_meta: number;
  meta_diaria_padrao?: number;
  considera_dias_semana?: boolean;
  percentual_tolerancia?: number;
  status: StatusMeta;
  observacoes?: string;
  criado_por_id: string;
  criado_por?: Usuario;
  criado_em: string;
  atualizado_em: string;
}

export interface ApuracaoMeta {
  id: string;
  meta_id: string;
  meta?: MetaFaturamento;
  operacao_id?: string;
  operacao?: Operacao;
  ano: number;
  mes: number;
  valor_meta: number;
  valor_realizado: number;
  valor_projetado?: number;
  desvio_valor: number;
  percentual_atingimento?: number;
  status_apuracao: StatusApuracaoMeta;
  confianca_apuracao: ConfiancaApuracao;
  ultima_sincronizacao_em: string | null;
  apurado_em: string;
  
  // Pivot para facilitar UI
  meta_parcial_esperada?: number;
  desvio_ritmo?: number;
}

export interface AlertaMeta {
  id: string;
  meta_id: string;
  meta?: MetaFaturamento;
  apuracao_id?: string;
  apuracao?: ApuracaoMeta;
  operacao_id?: string;
  operacao?: Operacao;
  tipo_alerta: string;
  criticidade: CriticidadeAlertaMeta;
  status: StatusAlertaMeta;
  motivo_preliminar?: string;
  gerado_automaticamente: boolean;
  gerado_em: string;
}

export interface TratativaAlerta {
  id: string;
  alerta_id: string;
  alerta?: AlertaMeta;
  operacao_id?: string;
  operacao?: Operacao;
  auditor_responsavel_id?: string;
  auditor?: Usuario;
  status: StatusTratativaAlerta;
  categoria_causa?: CategoriaCausaMeta;
  descricao_analise?: string;
  causa_raiz?: string;
  acao_corretiva?: string;
  parecer_final?: string;
  concluida_em?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Inconsistencia {
  id: string;
  sinistro_id: string;
  tipo: string;
  descricao: string;
  data_abertura: string;
  status: StatusInconsistencia;
  motivo_decisao?: string;
  analisado_por_id?: string;
  analisado_por?: Usuario;
  data_decisao?: string;
  anexo_url?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Anexo {
  id: string;
  sinistro_id: string;
  categoria: CategoriaAnexo;
  nome_arquivo: string;
  url: string;
  tamanho?: number;
  tipo_mime?: string;
  usuario_id: string;
  usuario?: Usuario;
  criado_em: string;
}

export interface HistoricoSinistro {
  id: string;
  sinistro_id: string;
  usuario_id: string;
  usuario?: Usuario;
  acao: string;
  descricao: string;
  criado_em: string;
}

export interface SolicitacaoTarifario {
  id: string;
  operacao_id: string;
  operacao?: Operacao;
  solicitante_id: string;
  solicitante?: Usuario;
  tipo: TipoSolicitacaoTarifario;
  data_desejada: string;
  descricao: string;
  status: StatusSolicitacaoTarifario;
  
  // Aprovação
  diretoria_id?: string;
  diretoria?: Usuario;
  data_parecer?: string;
  parecer_diretoria?: string;
  
  // Execução
  tecnico_ti_id?: string;
  tecnico_ti?: Usuario;
  data_inicio_execucao?: string;
  data_conclusao?: string;
  obs_tecnica?: string;
  
  criado_em: string;
  atualizado_em: string;
}

export interface TarifarioAnexo {
  id: string;
  solicitacao_id: string;
  nome_arquivo: string;
  url: string;
  tamanho?: number;
  tipo_mime?: string;
  usuario_id: string;
  usuario?: Usuario;
  criado_em: string;
}

export interface TarifarioHistorico {
  id: string;
  solicitacao_id: string;
  usuario_id: string;
  usuario?: Usuario;
  acao: string;
  descricao: string;
  criado_em: string;
}

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export const PERFIL_LABELS: Record<Perfil, string> = {
  administrador: 'Administrador',
  diretoria: 'Diretoria',
  gerente_operacoes: 'Gerente de Operações',
  supervisor: 'Supervisor',
  analista_sinistro: 'Analista de Sinistro',
  financeiro: 'Financeiro',
  rh: 'RH',
  dp: 'DP',
  auditoria: 'Auditoria',
  ti: 'TI',
  administrativo: 'Administrativo',
};

export const TIPO_SOLICITACAO_TARIFARIO_LABELS: Record<TipoSolicitacaoTarifario, string> = {
  cadastro_novo_tarifario: 'Cadastro de novo tarifário',
  alteracao_tarifario_existente: 'Alteração de tarifário existente',
  cadastro_novo_convenio: 'Cadastro de novo convênio',
  alteracao_convenio_existente: 'Alteração de convênio existente',
};

export const STATUS_TARIFARIO_LABELS: Record<StatusSolicitacaoTarifario, string> = {
  pendente: 'Pendente de Aprovação',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  em_execucao: 'Em Execução',
  concluido: 'Concluído',
};

export const STATUS_SINISTRO_LABELS: Record<StatusSinistro, string> = {
  aberto: 'Aberto',
  em_analise: 'Em Análise',
  aguardando_documentos: 'Aguardando Documentos',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  encerrado: 'Encerrado',
};

export const PRIORIDADE_LABELS: Record<PrioridadeSinistro, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const CATEGORIA_ANEXO_LABELS: Record<CategoriaAnexo, string> = {
  imagens_ocorrencia: 'Imagens da Ocorrência',
  evidencias_adicionais: 'Evidências Adicionais',
  orcamento: 'Orçamento',
  documentos: 'Documentos',
  comprovantes_financeiros: 'Comprovantes Financeiros',
  documentos_cliente: 'Documentos do Cliente',
  documento_veiculo: 'Documento do Veículo',
  cnh_rg_cpf: 'CNH / RG / CPF',
  ticket_cupom_fiscal: 'Ticket / Cupom Fiscal',
  boletim_ocorrencia: 'Boletim de Ocorrência',
  orcamento_sinistrado: 'Orçamento do Sinistrado',
  reducao_orcamentos: 'Redução de Orçamentos',
  evidencia_conclusao: 'Evidência da Conclusão',
  imagens_cftv: 'Imagens do CFTV',
  fotos_avaria: 'Fotos da Avaria',
  fotos_prevencao: 'Fotos de Prevenção/Melhoria',
};

export const BANDEIRA_OPTIONS: Bandeira[] = ['GPA', 'Assaí', 'Carrefour', 'TriCeplo', 'Outros'];

export const TIPO_OPERACAO_LABELS: Record<TipoOperacao, string> = {
  supermercado: 'Supermercado',
  shopping: 'Shopping',
  hospital: 'Hospital',
  predio_comercial: 'Prédio Comercial',
  estacionamento: 'Estacionamento',
  outro: 'Outro',
};

export const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

export const STATUS_META_LABELS: Record<StatusMeta, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
  cancelada: 'Cancelada',
};

export const TIPO_META_LABELS: Record<TipoMeta, string> = {
  operacao: 'Por Operação',
  global: 'Global / Consolidada',
};

export const STATUS_APURACAO_LABELS: Record<StatusApuracaoMeta, string> = {
  no_ritmo: 'No Ritmo',
  levemente_atrasada: 'Levemente Atrasada',
  em_recuperacao: 'Em Recuperação',
  critica: 'Crítica',
  sem_base_suficiente: 'Sem Base Suficiente',
  meta_atingida: 'Meta Atingida',
  meta_nao_atingida: 'Meta Não Atingida',
};

export const STATUS_DIARIO_META_LABELS: Record<StatusDiarioMeta, string> = {
  acima_da_meta: 'Acima da Meta',
  dentro_da_meta: 'Dentro da Meta',
  abaixo_da_meta: 'Abaixo da Meta',
  sem_movimento: 'Sem Movimento',
  sem_apuracao: 'Sem Apuração',
  apuracao_inconclusiva: 'Apuração Inconclusiva',
  sem_dados: 'Sem Dados',
};

export const CONFIANCA_APURACAO_LABELS: Record<ConfiancaApuracao, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const STATUS_ALERTA_META_LABELS: Record<StatusAlertaMeta, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  justificado: 'Justificado',
  resolvido: 'Resolvido',
  descartado: 'Descartado',
};

export const CRITICIDADE_ALERTA_LABELS: Record<CriticidadeAlertaMeta, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const STATUS_TRATATIVA_LABELS: Record<StatusTratativaAlerta, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  concluida: 'Concluída',
  sem_procedencia: 'Sem Procedência',
};

export const CATEGORIA_CAUSA_META_LABELS: Record<CategoriaCausaMeta, string> = {
  queda_movimento: 'Queda de Movimento',
  despesa_elevada: 'Despesa Elevada',
  falha_sincronizacao: 'Falha de Sincronização',
  inconsistencia_dados: 'Inconsistência de Dados',
  erro_operacional: 'Erro Operacional',
  outros: 'Outros',
};

// --- MÓDULO DE COLABORADORES ---

export type StatusColaborador = 'ativo' | 'afastado' | 'ferias' | 'desligado';

export type TipoVinculoColaborador = 
  | 'CLT' 
  | 'PJ' 
  | 'Mei' 
  | 'Estágio' 
  | 'Temporário' 
  | 'Terceirizado';

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  matricula?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  tipo_vinculo: TipoVinculoColaborador;
  status: StatusColaborador;
  data_admissao: string;
  data_desligamento?: string;
  usuario_id?: string;
  usuario?: Usuario;
  observacoes?: string;
  operacoes?: ColaboradorOperacao[];
  criado_em: string;
  atualizado_em: string;
}

export interface ColaboradorOperacao {
  id: string;
  colaborador_id: string;
  colaborador?: Colaborador;
  operacao_id: string;
  operacao?: Operacao;
  funcao_operacao?: string;
  responsavel_principal: boolean;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const STATUS_COLABORADOR_LABELS: Record<StatusColaborador, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  ferias: 'Férias',
  desligado: 'Desligado',
};

export const TIPO_VINCULO_COLABORADOR_LABELS: Record<TipoVinculoColaborador, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  Mei: 'MEI',
  Estágio: 'Estágio',
  Temporário: 'Temporário',
  Terceirizado: 'Terceirizado',
};
