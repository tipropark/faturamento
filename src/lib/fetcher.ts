export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Erro na requisição');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};
