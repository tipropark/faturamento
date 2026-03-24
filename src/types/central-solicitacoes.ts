import { Perfil } from './index';

export type CentralStatusSlug = 'novo' | 'em_triagem' | 'em_atendimento' | 'aguardando_solicitante' | 'concluido' | 'cancelado';
export type CentralPrioridadeSlug = 'baixa' | 'normal' | 'alta' | 'urgente';
export type ObrigatoriedadeOperacao = 'obrigatoria' | 'opcional' | 'dispensada';
export type TipoCampoDinamico = 'texto_curto' | 'texto_longo' | 'select' | 'multiselect' | 'data' | 'numero' | 'checkbox' | 'upload' | 'vinculo_operacao' | 'vinculo_usuario';
export type TipoInteracaoCentral = 'mensagem' | 'status_change' | 'responsible_change' | 'file_upload' | 'conclusion' | 'reopening' | 'system_log';

export interface CentralDepartamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
  icone?: string;
  cor?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface CentralStatus {
  id: string;
  nome: string;
  slug: CentralStatusSlug;
  cor?: string;
  ordem: number;
  finaliza_solicitacao: boolean;
  ativo: boolean;
}

export interface CentralPrioridade {
  id: string;
  nome: string;
  slug: CentralPrioridadeSlug;
  cor?: string;
  ordem: number;
  ativo: boolean;
}

export interface CentralCategoria {
  id: string;
  departamento_id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
  exige_operacao: ObrigatoriedadeOperacao;
  permite_anexo: boolean;
  sla_primeira_resposta_horas?: number;
  sla_conclusao_horas?: number;
}

export interface CentralSubcategoria {
  id: string;
  categoria_id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
}

export interface CentralCampoDinamico {
  id: string;
  departamento_id?: string;
  categoria_id?: string;
  nome_uuid: string;
  label: string;
  tipo: TipoCampoDinamico;
  configuracoes?: any;
  obrigatorio: boolean;
  ordem: number;
  ativo: boolean;
}

export interface CentralSolicitacao {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  departamento_id: string;
  categoria_id: string;
  subcategoria_id?: string;
  solicitante_id: string;
  operacao_id?: string;
  status_id: string;
  prioridade_id: string;
  responsavel_id?: string;
  
  data_abertura: string;
  data_primeira_resposta?: string;
  data_limite_primeira_resposta?: string;
  data_limite_conclusao?: string;
  data_conclusao?: string;
  
  nota_avaliacao?: number;
  comentario_avaliacao?: string;
  
  criado_em: string;
  atualizado_em: string;

  // Joined fields
  departamento?: CentralDepartamento;
  categoria?: CentralCategoria;
  subcategoria?: CentralSubcategoria;
  solicitante?: { nome: string; email: string };
  responsavel?: { nome: string; email: string };
  status?: CentralStatus;
  prioridade?: CentralPrioridade;
  operacao?: { nome_operacao: string };
}

export interface CentralInteracao {
  id: string;
  solicitacao_id: string;
  usuario_id: string;
  tipo: TipoInteracaoCentral;
  conteudo?: string;
  metadados?: any;
  criado_em: string;
  usuario?: { nome: string };
}

export interface CentralAnexo {
  id: string;
  solicitacao_id: string;
  interacao_id?: string;
  nome_arquivo: string;
  url: string;
  tamanho?: number;
  tipo_mime?: string;
  usuario_id: string;
  criado_em: string;
}

export interface CentralDepartamentoResponsavel {
  id: string;
  departamento_id: string;
  usuario_id: string;
  eh_gestor: boolean;
  usuario?: { nome: string; email: string; perfil: Perfil };
}
