/** Classes Tailwind compartilhadas pelas telas de iniciativa (cartão, botões, campos). */

export const CLASSE_CARTAO =
  'rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900';

const BASE_BOTAO =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60';

export const BTN_PRIMARIO = `${BASE_BOTAO} bg-red-600 text-white hover:bg-red-700`;

export const BTN_SECUNDARIO = `${BASE_BOTAO} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800`;

export const BTN_APROVAR = `${BASE_BOTAO} bg-green-700 text-white hover:bg-green-800`;

export const CLASSE_CAMPO =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-red-700 focus:outline-2 focus:outline-red-700 aria-[invalid=true]:border-red-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';

export const CLASSE_ERRO = 'mt-1 text-sm text-red-700 dark:text-red-400';

export const CLASSE_AJUDA = 'mt-1 text-sm text-gray-600 dark:text-gray-400';

export const CLASSE_TITULO_SECAO = 'text-lg font-semibold text-gray-900 dark:text-gray-100';
