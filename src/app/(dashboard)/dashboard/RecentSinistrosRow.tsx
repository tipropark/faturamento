'use client';

import { useRouter } from 'next/navigation';
import { STATUS_SINISTRO_LABELS } from '@/types';

interface RecentSinistrosRowProps {
  s: any;
}

export function RecentSinistrosRow({ s }: RecentSinistrosRowProps) {
  const router = useRouter();

  return (
    <tr 
      key={s.id} 
      className="cursor-pointer" 
      onClick={() => router.push(`/sinistros/${s.id}`)}
    >
      <td className="cell-code">{s.pr}</td>
      <td>
        <div className="cell-main">{s.cliente_nome}</div>
        <div className="cell-sub">Titular do Veículo</div>
      </td>
      <td>
        <div className="cell-main">{(s.operacao as any)?.nome_operacao || '-'}</div>
      </td>
      <td>
        <span className={`badge badge-status-${s.status}`}>
          {STATUS_SINISTRO_LABELS[s.status as keyof typeof STATUS_SINISTRO_LABELS] || s.status}
        </span>
      </td>
      <td style={{ textAlign: 'right' }} className="text-muted text-sm font-medium">
        {new Date(s.criado_em).toLocaleDateString('pt-BR')}
      </td>
    </tr>
  );
}
