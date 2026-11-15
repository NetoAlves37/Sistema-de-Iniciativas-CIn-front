import type { TipoCadastro } from './iniciativas.types';

/** Os três tipos que existiam antes do cadastro, para os testes (semeados em `vitest.setup.ts`). */
export const TIPOS_DE_TESTE: TipoCadastro[] = [
  { id: 1, code: 'EXTENSAO', nome: 'Extensão', cor: '#9BE0A0', ativo: true, iniciativas: 4 },
  { id: 2, code: 'PESQUISA', nome: 'Pesquisa', cor: '#A7C7F2', ativo: true, iniciativas: 0 },
  { id: 3, code: 'EVENTO', nome: 'Evento', cor: '#F7AE85', ativo: true, iniciativas: 2 },
];
