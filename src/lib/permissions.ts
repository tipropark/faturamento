import { Perfil } from '@/types';

export function canAccessAdmin(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'administrativo', 'ti'].includes(perfil);
}

export function canViewAll(perfil: Perfil): boolean {
  return ['administrador', 'diretoria'].includes(perfil);
}

export function canManageUsers(perfil: Perfil): boolean {
  return ['administrador', 'administrativo'].includes(perfil);
}

export function canAccessSinistros(perfil: Perfil): boolean {
  return [
    'administrador','diretoria','gerente_operacoes',
    'supervisor','analista_sinistro','financeiro','auditoria'
  ].includes(perfil);
}

export function canAnalyzeSinistro(perfil: Perfil): boolean {
  return ['administrador','analista_sinistro','gerente_operacoes'].includes(perfil);
}

export function canApproveFinanceiro(perfil: Perfil): boolean {
  return ['administrador','financeiro','diretoria'].includes(perfil);
}

export function isSupervisor(perfil: Perfil): boolean {
  return perfil === 'supervisor';
}

export function isGerenteOperacoes(perfil: Perfil): boolean {
  return perfil === 'gerente_operacoes';
}

export function isDiretoriaOrAdmin(perfil: Perfil): boolean {
  return ['administrador','diretoria'].includes(perfil);
}

export function canAccessTarifarios(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'supervisor', 'ti'].includes(perfil);
}

export function canApproveTarifario(perfil: Perfil): boolean {
  return ['administrador', 'diretoria'].includes(perfil);
}

export function canExecuteTarifario(perfil: Perfil): boolean {
  return ['administrador', 'ti'].includes(perfil);
}

export function canAccessMetas(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'financeiro', 'auditoria', 'gerente_operacoes'].includes(perfil);
}

export function canManageMetas(perfil: Perfil): boolean {
  return ['administrador', 'financeiro'].includes(perfil);
}


export function canAuditMetas(perfil: Perfil): boolean {
  return ['administrador', 'auditoria'].includes(perfil);
}

export function canAccessCentral(perfil: Perfil): boolean {
  return [
    'administrador', 'ti', 'diretoria', 'gerente_operacoes', 
    'supervisor', 'analista_sinistro', 'financeiro', 'rh', 'dp', 
    'auditoria', 'administrativo'
  ].includes(perfil);
}

export function canManageCentralConfig(perfil: Perfil): boolean {
  return ['administrador', 'ti', 'administrativo'].includes(perfil);
}

export function canViewAllCentralRequests(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'administrativo', 'auditoria'].includes(perfil);
}

export function canAccessCentralReports(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'gerente_operacoes', 'administrativo'].includes(perfil);
}


export function canAccessPatrimonio(perfil: Perfil): boolean {
  return [
    'administrador', 'diretoria', 'gerente_operacoes', 
    'supervisor', 'financeiro', 'auditoria', 'ti', 'administrativo'
  ].includes(perfil);
}

export function canManagePatrimonio(perfil: Perfil): boolean {
  return ['administrador', 'administrativo', 'ti'].includes(perfil);
}

export function canTransferPatrimonio(perfil: Perfil): boolean {
  return ['administrador', 'ti', 'gerente_operacoes', 'administrativo'].includes(perfil);
}

export function canManagePatrimonioMaintenance(perfil: Perfil): boolean {
  return ['administrador', 'administrativo', 'ti', 'gerente_operacoes'].includes(perfil);
}

export function canAuditPatrimonio(perfil: Perfil): boolean {
  return ['administrador', 'auditoria'].includes(perfil);
}

// --- PERMISSÕES DE COLABORADORES ---

export function canAccessColaboradores(perfil: Perfil): boolean {
  return [
    'administrador', 'diretoria', 'gerente_operacoes', 
    'supervisor', 'rh', 'dp', 'auditoria', 'administrativo'
  ].includes(perfil);
}

export function canManageColaboradores(perfil: Perfil): boolean {
  return ['administrador', 'rh', 'dp', 'administrativo'].includes(perfil);
}

export function canEditColaboradorOperacoes(perfil: Perfil): boolean {
  return ['administrador', 'rh', 'dp', 'gerente_operacoes', 'administrativo'].includes(perfil);
}

export function canViewColaboradorFinanceiro(perfil: Perfil): boolean {
  return ['administrador', 'diretoria', 'rh', 'dp', 'financeiro'].includes(perfil);
}
