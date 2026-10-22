import { Link } from 'react-router-dom';
import { Links } from '../../../utils/enums';
import { BTN_PRIMARIO, BTN_SECUNDARIO, CLASSE_CARTAO } from '../estilos';

interface NadaPorAquiProps {
  mensagem: string;
  /** Mostra "Tentar de novo" (para erros que podem ser passageiros, como falha de rede). */
  aoTentarDeNovo?: () => void;
}

/** Cartão de "Nada por aqui": iniciativa inexistente, sem permissão ou falha ao carregar. */
export function NadaPorAqui({ mensagem, aoTentarDeNovo }: NadaPorAquiProps) {
  return (
    <div className={`${CLASSE_CARTAO} mx-auto max-w-xl text-center`}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nada por aqui</h1>
      <p role="alert" className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        {mensagem}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        {aoTentarDeNovo && (
          <button type="button" onClick={aoTentarDeNovo} className={BTN_SECUNDARIO}>
            Tentar de novo
          </button>
        )}
        <Link to={Links.INICIO} className={BTN_PRIMARIO}>
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
