import Confirmacao from '../components/Confirmacao.jsx';
import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import Mensagens from '../components/Mensagens.jsx';

export default function Alergias() {
  const [alergias, setAlergias] = useState([]);
  // A página mostra a listagem ou o cadastro (novo).
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
    requisicao('/alergias/', { signal: controller.signal })
      .then(setAlergias)
      .catch((e) => { if (e.name !== 'AbortError') setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function abrirTela(cadastro) {
    setNovo(cadastro);
    setErro('');
    setSucesso('');
  }

  async function salvar(event) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao('/alergias/', { method: 'POST', dados: { nome: formulario.get('nome') } });
      setNovo(false);
      setSucesso('Alergia cadastrada.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(alergia) {
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao(`/alergias/${alergia.id}/`, { method: 'DELETE' });
      setExclusao(null);
      setSucesso('Alergia excluída.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setExclusao(null);
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const mensagens = <Mensagens erro={erro} sucesso={sucesso} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />;

  if (novo) {
    return (
      <>
        <button className="voltar" onClick={() => abrirTela(false)} disabled={ocupado}>‹ Voltar para alergias</button>
        <h1>Nova alergia</h1>
        <p className="subtitulo">A alergia poderá ser associada aos pacientes.</p>
        {mensagens}
        <section className="painel" aria-label="Cadastro de alergia">
          <form className="formulario" onSubmit={salvar}>
            <label className="campo-inteiro">Nome<input name="nome" maxLength={40} required autoFocus /></label>
            <div className="acoes-formulario">
              <button className="primario" disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar alergia'}</button>
              <button type="button" onClick={() => abrirTela(false)} disabled={ocupado}>Cancelar</button>
            </div>
          </form>
        </section>
      </>
    );
  }

  return (
    <>
      {exclusao && <Confirmacao
        mensagem={`Excluir a alergia "${exclusao.nome}"? Ela será removida dos pacientes associados.`}
        confirmar={() => excluir(exclusao)} cancelar={() => setExclusao(null)} ocupado={ocupado}
      />}
      <div className="cabecalho-pagina">
        <h1>Alergias</h1>
        <button className="primario" onClick={() => abrirTela(true)} disabled={ocupado || carregando}>Nova alergia</button>
      </div>
      <p className="subtitulo">Cadastre as alergias que poderão ser associadas aos pacientes.</p>
      {mensagens}
      {!carregando && <div className="tabela-container">
        <table>
          <caption>Alergias cadastradas</caption>
          <thead><tr><th scope="col">ID</th><th scope="col">Nome</th><th scope="col">Ações</th></tr></thead>
          <tbody>
            {alergias.map((alergia) => <tr key={alergia.id}>
              <td>{alergia.id}</td><td>{alergia.nome}</td>
              <td><button className="perigo" onClick={() => setExclusao(alergia)} disabled={ocupado}>Excluir</button></td>
            </tr>)}
            {!alergias.length && <tr><td colSpan={3} className="vazio">Nenhuma alergia cadastrada.</td></tr>}
          </tbody>
        </table>
      </div>}
    </>
  );
}
