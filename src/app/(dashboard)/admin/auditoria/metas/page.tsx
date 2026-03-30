'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditoriaMetasRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/auditoria/faturamento');
  }, [router]);
  return null;
}
