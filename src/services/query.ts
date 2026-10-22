/**
 * Monta a query string a partir de um objeto, ignorando valores vazios (`undefined`,
 * `null`, `''`). Arrays viram lista separada por vírgula. Devolve `''` ou `'?a=1&b=2'`.
 */
export function montarQuery(
  params: Record<string, string | number | boolean | string[] | null | undefined>,
): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue;
    if (Array.isArray(valor)) {
      if (valor.length > 0) busca.set(chave, valor.join(','));
      continue;
    }
    busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : '';
}
