// API pública do módulo identidade: só o que outros módulos e as páginas usam hoje.
// Dentro do próprio módulo, importe direto do arquivo.
export { useMe } from './MeProvider';
export { PERFIL_LABELS } from './me.types';
export type { Perfil } from './me.types';
