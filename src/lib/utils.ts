export function gerarPR(sequencia: number): string {
  const ano = new Date().getFullYear();
  const num = String(sequencia).padStart(5, '0');
  return `PR-${ano}-${num}`;
}

export function gerarProtocolo(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `LEVE-${ts}-${rand}`;
}

export function formatarCPF(cpf: string): string {
  const nums = cpf.replace(/\D/g, '');
  return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarTelefone(tel: string): string {
  const nums = tel.replace(/\D/g, '');
  if (nums.length === 11) {
    return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatarData(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function formatarDataHora(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function formatarTamanho(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
