import { type AcaoAssincrona, useAcao } from '../compartilhado/useAcao';
import { iniciativasApi } from './iniciativas.api';
import type { DadosIniciativaInput, DetalheIniciativa } from './iniciativas.types';

/** `POST /iniciativas`: submete uma nova iniciativa. */
export function useCriarIniciativa(): AcaoAssincrona<[DadosIniciativaInput], DetalheIniciativa> {
  return useAcao((dados: DadosIniciativaInput) => iniciativasApi.criar(dados));
}

/** `PATCH /iniciativas/:id`: salva a edição (só em Em andamento). */
export function useAtualizarIniciativa(
  id: string,
): AcaoAssincrona<[DadosIniciativaInput], DetalheIniciativa> {
  return useAcao((dados: DadosIniciativaInput) => iniciativasApi.atualizar(id, dados));
}

/** `POST /iniciativas/:id/ressubmissao`: ressubmete uma iniciativa reprovada. */
export function useRessubmeterIniciativa(
  id: string,
): AcaoAssincrona<[DadosIniciativaInput], DetalheIniciativa> {
  return useAcao((dados: DadosIniciativaInput) => iniciativasApi.ressubmeter(id, dados));
}
