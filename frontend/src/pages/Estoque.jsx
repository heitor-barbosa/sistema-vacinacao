import Confirmacao from '../components/Confirmacao.jsx';
import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import { formatarData } from '../utils.js';
import Mensagens from '../components/Mensagens.jsx';

// Classificação da validade calculada pela API (RN20), com o texto e o estilo exibidos.
const VALIDADES = {
  Valido: { texto: 'Válido', classe: 'valido' },
  'Vence em breve': { texto: 'Vence em breve', classe: 'vence-em-breve' },
  Vencido: { texto: 'Vencido', classe: 'vencido' },
};

function SituacaoValidade({ situacao }) {
  const validade = VALIDADES[situacao];
  return <span className={`situacao ${validade.classe}`}>{validade.texto}</span>;
}

// Resumo de uma vacina: doses dos lotes ainda não vencidos e avisos de validade.
function resumirLotes(lotes) {
  const naoVencidos = lotes.filter((lote) => lote.situacao_validade !== 'Vencido');
  return {
    doses: naoVencidos.reduce((total, lote) => total + lote.quantidade, 0),
    venceEmBreve: lotes.filter((lote) => lote.situacao_validade === 'Vence em breve').length,
    vencidos: lotes.length - naoVencidos.length,
  };
}

function CartaoVacina({ vacina, lotes, abrir }) {
  const resumo = resumirLotes(lotes);
  return (
    <button className="cartao-vacina" onClick={abrir}>
      <span className="cartao-vacina-titulo">{vacina.titulo}</span>
      <span className="cartao-vacina-doses">{resumo.doses}</span>
      <span className="cartao-vacina-legenda">doses em lotes válidos</span>
      <span className="cartao-vacina-lotes">
        {lotes.length ? `${lotes.length} lote(s)` : 'Nenhum lote cadastrado'}
      </span>
      {resumo.venceEmBreve > 0 && <span className="situacao vence-em-breve">{resumo.venceEmBreve} vence(m) em breve</span>}
      {resumo.vencidos > 0 && <span className="situacao vencido">{resumo.vencidos} vencido(s)</span>}
    </button>
  );
}

export default function Estoque() {
  const [lotes, setLotes] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  // A tela mostra os cards, os lotes de uma vacina (vacinaId) ou o cadastro de lote (novo).
  const [vacinaId, setVacinaId] = useState(null);
  const [novo, setNovo] = useState(false);
  const [exclusao, setExclusao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    Promise.all([
      requisicao('/lotes/', { signal: controller.signal }),
      requisicao('/vacinas/', { signal: controller.signal }),
    ]).then(([listaLotes, listaVacinas]) => {
      setLotes(listaLotes);
      setVacinas(listaVacinas);
    }).catch((e) => { if (e.name !== 'AbortError') setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function abrirTela({ vacina = null, cadastro = false }) {
    setVacinaId(vacina);
    setNovo(cadastro);
    setErro('');
    setSucesso('');
  }

  async function salvar(event) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    const dados = {
      vacina: Number(formulario.get('vacina')),
      numero: formulario.get('numero'),
      fabricante: formulario.get('fabricante'),
      validade: formulario.get('validade'),
      quantidade: Number(formulario.get('quantidade')),
    };
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao('/lotes/', { method: 'POST', dados });
      setNovo(false);
      setVacinaId(dados.vacina);
      setSucesso('Lote cadastrado.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(lote) {
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao(`/lotes/${lote.id}/`, { method: 'DELETE' });
      setExclusao(null);
      setSucesso('Lote excluído.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setExclusao(null);
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const mensagens = <Mensagens erro={erro} sucesso={sucesso} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />;
  const voltar = <button className="voltar" onClick={() => abrirTela({})} disabled={ocupado}>‹ Voltar ao estoque</button>;
  const vacinaSelecionada = vacinas.find((vacina) => vacina.id === vacinaId);

  if (novo) {
    return (
      <>
        {voltar}
        <h1>Novo lote</h1>
        <p className="subtitulo">Cada unidade da quantidade corresponde a uma dose.</p>
        {mensagens}
        <section className="painel" aria-label="Cadastro de lote">
          <form className="formulario" onSubmit={salvar}>
            <label className="campo-inteiro">Vacina<select name="vacina" defaultValue={vacinaId ?? ''} required autoFocus>
              <option value="" disabled>Selecione</option>
              {vacinas.map((vacina) => <option key={vacina.id} value={vacina.id}>{vacina.titulo} (#{vacina.id})</option>)}
            </select></label>
            <label>Número do lote<input name="numero" maxLength={30} required /></label>
            <label>Fabricante<input name="fabricante" maxLength={60} required /></label>
            <label>Validade<input type="date" name="validade" required /></label>
            <label>Quantidade de doses<input type="number" name="quantidade" min={0} step={1} required /></label>
            <div className="acoes-formulario">
              <button className="primario" disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar lote'}</button>
              <button type="button" onClick={() => abrirTela({ vacina: vacinaId })} disabled={ocupado}>Cancelar</button>
            </div>
          </form>
        </section>
      </>
    );
  }

  if (vacinaSelecionada) {
    const lotesDaVacina = lotes.filter((lote) => lote.vacina === vacinaId);
    const resumo = resumirLotes(lotesDaVacina);
    return (
      <>
        {exclusao && <Confirmacao
          mensagem={`Excluir o lote "${exclusao.numero}" da vacina "${exclusao.vacina_titulo}"? Um lote já utilizado em uma aplicação não pode ser excluído.`}
          confirmar={() => excluir(exclusao)} cancelar={() => setExclusao(null)} ocupado={ocupado}
        />}
        {voltar}
        <div className="cabecalho-pagina">
          <h1>{vacinaSelecionada.titulo}</h1>
          <button className="primario" onClick={() => abrirTela({ vacina: vacinaId, cadastro: true })} disabled={ocupado || carregando}>Novo lote</button>
        </div>
        <p className="subtitulo">{resumo.doses} doses em lotes válidos · {lotesDaVacina.length} lote(s)</p>
        {mensagens}
        {!carregando && <section className="painel" aria-label={`Lotes de ${vacinaSelecionada.titulo}`}>
          <h2>Lotes em ordem de validade</h2>
          {!lotesDaVacina.length && <p className="vazio">Nenhum lote cadastrado para esta vacina.</p>}
          <ul className="lista-lotes">
            {lotesDaVacina.map((lote) => <li key={lote.id} className={`cartao-lote ${VALIDADES[lote.situacao_validade].classe}`}>
              <div className="cartao-lote-dados">
                <strong>Lote {lote.numero}</strong>
                <span>{lote.fabricante}</span>
                <span>Validade: {formatarData(lote.validade)} <SituacaoValidade situacao={lote.situacao_validade} /></span>
              </div>
              <div className="cartao-lote-doses"><strong>{lote.quantidade}</strong> doses</div>
              <button className="perigo" onClick={() => setExclusao(lote)} disabled={ocupado}>Excluir</button>
            </li>)}
          </ul>
        </section>}
      </>
    );
  }

  return (
    <>
      <div className="cabecalho-pagina">
        <h1>Estoque</h1>
        <button className="primario" onClick={() => abrirTela({ cadastro: true })} disabled={carregando || !vacinas.length}>Novo lote</button>
      </div>
      <p className="subtitulo">Escolha uma vacina para ver as doses de cada lote.</p>
      {mensagens}
      {!carregando && !vacinas.length && !erro && <p className="ajuda">Para cadastrar um lote, cadastre pelo menos uma vacina no menu Vacinas.</p>}
      {!carregando && <section className="cartoes-vacina" aria-label="Vacinas em estoque">
        {vacinas.map((vacina) => <CartaoVacina
          key={vacina.id} vacina={vacina} lotes={lotes.filter((lote) => lote.vacina === vacina.id)}
          abrir={() => abrirTela({ vacina: vacina.id })}
        />)}
      </section>}
    </>
  );
}
