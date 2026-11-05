import { toast } from '@cincoders/cinnamon';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../../modules/identidade/MeProvider';
import { IniciativaForm } from '../../modules/iniciativas/components/IniciativaForm';
import type { DadosIniciativaInput } from '../../modules/iniciativas/iniciativas.types';
import { useCriarIniciativa } from '../../modules/iniciativas/useAcoesIniciativa';
import { linkDetalhe } from '../../utils/enums';

/** `/iniciativas/nova`: submissão direta (sem rascunho e sem fotos). */
export default function SubmeterPage() {
  const { me } = useMe();
  const navigate = useNavigate();
  const { executar } = useCriarIniciativa();

  const introducao = (comVotacao: boolean) => {
    const prazos = me?.prazos;
    if (!prazos) return 'Preencha os campos e submeta.';
    const refinamento = `A iniciativa fica ${prazos.refinamentoDias} dia(s) aberta a sugestões`;
    return comVotacao
      ? `Preencha os campos e submeta. ${refinamento} e depois ${prazos.votacaoDias} dia(s) em votação, antes de ir para o comitê.`
      : `Preencha os campos e submeta. ${refinamento} e depois segue para o comitê, sem votação.`;
  };

  const aoEnviar = async (dados: DadosIniciativaInput) => {
    const criada = await executar(dados);
    toast.success('Iniciativa submetida e aberta a sugestões');
    navigate(linkDetalhe(criada.id));
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <IniciativaForm
        titulo="Submeter iniciativa"
        introducao={introducao}
        rotuloEnvio="Submeter iniciativa"
        aoEnviar={aoEnviar}
      />
    </div>
  );
}
