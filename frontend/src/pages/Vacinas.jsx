import Confirmacao from '../components/Confirmacao.jsx';
import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import { PERIODICIDADES } from '../utils.js';
import Detalhes from '../components/Detalhes.jsx';
import Mensagens from '../components/Mensagens.jsx';

export default function Vacinas() {
  const [vacinas, setVacinas] = useState([]);
  const [novo, setNovo] = useState(false);
  const [exclusao, setExclusao] = useState(null);
  const [doses, setDoses] = useState(1);
  const [detalhes, setDetalhes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    requisicao('/vacinas/', { signal: controller.signal })
      .then(setVacinas)
      .catch((e) => { if (e.name !== 'AbortError') setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  async function salvar(event) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    const dados = {
      titulo: formulario.get('titulo'),
      descricao: formulario.get('descricao'),
      doses: Number(formulario.get('doses')),
      periodicidade: doses > 1 ? Number(formulario.get('periodicidade')) : null,
      intervalo: doses > 1 ? Number(formulario.get('intervalo')) : null,
    };
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao('/vacinas/', { method: 'POST', dados });
      setNovo(false);
      setSucesso('Vacina cadastrada.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(vacina) {
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao(`/vacinas/${vacina.id}/`, { method: 'DELETE' });
      if (detalhes?.id === vacina.id) setDetalhes(null);
      setExclusao(null);
      setSucesso('Vacina excluída.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setExclusao(null);
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      {exclusao && <Confirmacao
        mensagem={`Excluir a vacina "${exclusao.titulo}"? Todas as agendas vinculadas também serão excluídas.`}
        confirmar={() => excluir(exclusao)} cancelar={() => setExclusao(null)} ocupado={ocupado}
      />}
      <div className="cabecalho-pagina">
        <h1>Vacinas</h1>
        <button className="primario" onClick={() => { setNovo(true); setDoses(1); setDetalhes(null); }} disabled={ocupado || carregando}>Nova vacina</button>
      </div>
      <p className="subtitulo">Defina a quantidade de doses e o intervalo entre as aplicações.</p>
      <Mensagens erro={erro} sucesso={sucesso} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />
      {novo && <section className="painel" aria-label="Cadastro de vacina">
        <h2>Nova vacina</h2>
        <form className="formulario" onSubmit={salvar}>
          <label className="campo-inteiro">Título<input name="titulo" maxLength={60} required autoFocus /></label>
          <label className="campo-inteiro">Descrição (opcional)<textarea name="descricao" maxLength={200} /></label>
          <label>Doses<input type="number" name="doses" min={1} step={1} value={doses} onChange={(e) => setDoses(e.target.value)} required /></label>
          {doses > 1 && <>
            <label>Periodicidade<select name="periodicidade" defaultValue="" required>
              <option value="" disabled>Selecione</option>
              {Object.entries(PERIODICIDADES).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
            </select></label>
            <label>Intervalo<input type="number" name="intervalo" min={1} step={1} required /></label>
          </>}
          <div className="acoes-formulario">
            <button className="primario" disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar vacina'}</button>
            <button type="button" onClick={() => setNovo(false)} disabled={ocupado}>Cancelar</button>
          </div>
        </form>
      </section>}
      {detalhes && <Detalhes titulo="Dados da vacina" fechar={() => setDetalhes(null)} dados={{
        ID: detalhes.id, Título: detalhes.titulo, Descrição: detalhes.descricao,
        Doses: detalhes.doses, Periodicidade: PERIODICIDADES[detalhes.periodicidade], Intervalo: detalhes.intervalo,
      }} />}
      {!carregando && <div className="tabela-container">
        <table>
          <caption>Vacinas cadastradas</caption>
          <thead><tr><th scope="col">Título</th><th scope="col">Doses</th><th scope="col">Periodicidade</th><th scope="col">Intervalo</th><th scope="col">Ações</th></tr></thead>
          <tbody>
            {vacinas.map((vacina) => <tr key={vacina.id}>
              <td>{vacina.titulo}</td><td>{vacina.doses}</td>
              <td>{PERIODICIDADES[vacina.periodicidade] || '—'}</td><td>{vacina.intervalo ?? '—'}</td>
              <td><div className="acoes">
                <button onClick={() => { setDetalhes(vacina); setNovo(false); }}>Consultar</button>
                <button className="perigo" onClick={() => setExclusao(vacina)} disabled={ocupado}>Excluir</button>
              </div></td>
            </tr>)}
            {!vacinas.length && <tr><td colSpan={5} className="vazio">Nenhuma vacina cadastrada.</td></tr>}
          </tbody>
        </table>
      </div>}
    </>
  );
}
