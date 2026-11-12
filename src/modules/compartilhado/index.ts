// API pública do módulo compartilhado: só o que outros módulos e as páginas usam hoje.
// Dentro do próprio módulo, importe direto do arquivo.
export {
  BTN_APROVAR,
  BTN_PRIMARIO,
  BTN_SECUNDARIO,
  CLASSE_AJUDA,
  CLASSE_CAMPO,
  CLASSE_CARTAO,
  CLASSE_ERRO,
  CLASSE_TITULO_SECAO,
} from './estilos';
export { fmtDia, fmtInstante, fmtPeriodo, restanteAte } from './prazo';
export { useAcao } from './useAcao';
export type { AcaoAssincrona } from './useAcao';
export { useListaPaginada } from './useListaPaginada';
export type { OpcoesPaginacao } from './useListaPaginada';
