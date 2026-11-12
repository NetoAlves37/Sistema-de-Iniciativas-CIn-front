// API pública do módulo divulgacao: só o que outros módulos e as páginas usam hoje.
// Dentro do próprio módulo, importe direto do arquivo.
export { CalendarioIniciativas } from './components/CalendarioIniciativas';
export { CartaoAprovada } from './components/CartaoAprovada';
export { PopoverEvento } from './components/PopoverEvento';
export type { Ocorrencia } from './divulgacao.types';
export { useAprovadas } from './useAprovadas';
export { ocorrenciaParaEvento, useOcorrencias } from './useOcorrencias';
export type { IntervaloCalendario } from './useOcorrencias';
