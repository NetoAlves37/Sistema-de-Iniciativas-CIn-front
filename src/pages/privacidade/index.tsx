/** Aviso de privacidade (HU-24, RNF-01): página estática. */
export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Privacidade
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Como o Sistema de Iniciativas do CIn/UFPE trata os seus dados pessoais.
        </p>
      </div>

      <div className="space-y-8 text-gray-800 dark:text-gray-200">
        <section aria-labelledby="priv-dados">
          <h2 id="priv-dados" className="mb-2 text-xl font-bold">
            Quais dados o sistema usa
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              O seu identificador, o seu nome e o seu perfil (aluno, professor, comitê avaliador ou
              administrador), que vêm do login institucional.
            </li>
            <li>
              O conteúdo que você registra no sistema: as iniciativas que submete, os comentários
              (sugestões) que escreve e os votos que dá.
            </li>
          </ul>
        </section>

        <section aria-labelledby="priv-para-que">
          <h2 id="priv-para-que" className="mb-2 text-xl font-bold">
            Para que esses dados servem
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Identificar a autoria das iniciativas e dos comentários.</li>
            <li>Controlar as permissões de cada pessoa (editar, votar, decidir).</li>
            <li>Exibir o seu nome nas suas contribuições.</li>
          </ul>
        </section>

        <section aria-labelledby="priv-nao-exibe">
          <h2 id="priv-nao-exibe" className="mb-2 text-xl font-bold">
            O que não é exibido
          </h2>
          <p>
            O seu e-mail e o seu contato não são guardados nem exibidos pelo sistema. Outras pessoas
            veem apenas o seu nome e o seu perfil.
          </p>
        </section>

        <section aria-labelledby="priv-controlador">
          <h2 id="priv-controlador" className="mb-2 text-xl font-bold">
            Quem é o controlador
          </h2>
          <p>O controlador dos dados é o Centro de Informática (CIn) da UFPE.</p>
        </section>

        <section aria-labelledby="priv-direitos">
          <h2 id="priv-direitos" className="mb-2 text-xl font-bold">
            Como exercer os seus direitos
          </h2>
          <p>
            Para exercer os seus direitos como titular dos dados (acesso, correção, eliminação e
            demais previstos na LGPD), escreva para{' '}
            <a
              href="mailto:privacidade@cin.ufpe.br"
              className="font-semibold text-red-800 underline dark:text-red-300"
            >
              privacidade@cin.ufpe.br
            </a>
            .
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Endereço provisório, a confirmar pelo CIn.
          </p>
        </section>
      </div>
    </div>
  );
}
