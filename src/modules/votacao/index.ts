// API pública do módulo votacao: só o que outros módulos e as páginas usam hoje.
// Dentro do próprio módulo, importe direto do arquivo.
export { MiniVotos } from './components/MiniVotos';
export { PainelVotos } from './components/PainelVotos';
export { painelVotosVisivel, useVoto } from './useVoto';
