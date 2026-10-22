/** Corpo de erro do backend: Problem Details (RFC 7807). */
export interface Problema {
  status: number;
  /** Mensagem em português, pronta para a tela. */
  detail: string;
  code?: string;
  /** Erros por campo (422), com os nomes dos campos do DTO. */
  errors?: Record<string, string[]>;
}

interface CorpoDeErro {
  code?: string;
  detail?: string;
  message?: string | string[];
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Lê o Problem Details de uma resposta com falha. Aceita também o formato antigo do
 * NestJS (`{ message }`) e corpos que não são JSON, e sempre devolve algo utilizável.
 * Não consome o corpo da resposta original (usa um clone).
 */
export async function lerProblema(
  response: Response,
  mensagemPadrao = 'Não foi possível concluir a operação.',
): Promise<Problema> {
  let detail = '';
  let code: string | undefined;
  let errors: Record<string, string[]> | undefined;

  try {
    const corpo = (await response.clone().json()) as CorpoDeErro;
    const mensagem = corpo?.detail ?? corpo?.message ?? corpo?.error;
    detail = Array.isArray(mensagem) ? mensagem.filter(Boolean).join(', ') : (mensagem ?? '');
    code = corpo?.code;
    errors = corpo?.errors;
  } catch {
    try {
      detail = (await response.clone().text()).trim();
    } catch {
      // sem corpo legível
    }
  }

  return { status: response.status, detail: detail.trim() || mensagemPadrao, code, errors };
}
