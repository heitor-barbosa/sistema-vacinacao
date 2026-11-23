import Confirmacao from '../components/Confirmacao.jsx';
import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import { dataHoje, formatarData, PERIODICIDADES } from '../utils.js';
import Detalhes from '../components/Detalhes.jsx';
import Mensagens from '../components/Mensagens.jsx';

export default function Agendas({ usuarioInicial, dataInicial }) {
  const [agendas, setAgendas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const [filtros, setFiltros] = useState({
    data: usuarioInicial ? '' : (dataInicial || dataHoje()), situacao: '', usuario: usuarioInicial,
  });
  const [novo, setNovo] = useState(false);
  const [acao, setAcao] = useState(null);
  const [vacinaId, setVacinaId] = useState('');
  const [detalhes, setDetalhes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const parametros = new URLSearchParams();
    if (filtros.data) parametros.set('data', filtros.data);
    if (filtros.situacao) parametros.set('situacao', filtros.situacao);
    if (filtros.usuario) parametros.set('usuario', filtros.usuario);
    const caminho = parametros.size ? `/agendas/?${parametros}` : '/agendas/';

    setCarregando(true);
    setAgendas([]);
    setErro('');
    Promise.all([
      requisicao(caminho, { signal: controller.signal }),
      requisicao('/usuarios/', { signal: controller.signal }),
      requisicao('/vacinas/', { signal: controller.signal }),
    ]).then(([listaAgendas, usuarios, listaVacinas]) => {
      setAgendas(listaAgendas);
      setPacientes(usuarios);
      setVacinas(listaVacinas);
    }).catch((e) => { if (e.name !== 'AbortError') setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [filtros, atualizacao]);

  async function salvar(event) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    const dados = {
      usuario: Number(formulario.get('usuario')),
      vacina: Number(formulario.get('vacina')),
      data: formulario.get('data'),
      hora: formulario.get('hora'),
      observacoes: formulario.get('observacoes'),
    };
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      const criadas = await requisicao('/agendas/', { method: 'POST', dados });
      setNovo(false);
      setSucesso(`${criadas.length} agendamento(s) criado(s). Todas as doses estão na lista abaixo.`);
      setFiltros({ data: '', situacao: '', usuario: String(dados.usuario) });
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function baixar(agenda, situacao) {
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao(`/agendas/${agenda.id}/baixa/`, { method: 'POST', dados: { situacao } });
      if (detalhes?.id === agenda.id) setDetalhes(null);
      setAcao(null);
      setSucesso(`Agenda marcada como ${situacao}.`);
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setAcao(null);
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(agenda) {
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao(`/agendas/${agenda.id}/`, { method: 'DELETE' });
      if (detalhes?.id === agenda.id) setDetalhes(null);
      setAcao(null);
      setSucesso('Agenda excluída.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setAcao(null);
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const vacinaSelecionada = vacinas.find((vacina) => String(vacina.id) === vacinaId);

  return (
    <>
      {acao && <Confirmacao
        mensagem={acao.situacao
          ? `Marcar a dose ${acao.agenda.dose} de "${acao.agenda.vacina_titulo}" para ${acao.agenda.usuario_nome} como ${acao.situacao}?`
          : `Excluir a dose ${acao.agenda.dose} de "${acao.agenda.vacina_titulo}" para ${acao.agenda.usuario_nome}? As outras doses serão mantidas.`}
        confirmar={() => acao.situacao ? baixar(acao.agenda, acao.situacao) : excluir(acao.agenda)}
        cancelar={() => setAcao(null)} ocupado={ocupado}
      />}
      <div className="cabecalho-pagina">
        <h1>Agendas</h1>
        <button className="primario" onClick={() => { setNovo(true); setDetalhes(null); setVacinaId(''); }} disabled={ocupado || carregando || !pacientes.length || !vacinas.length}>Novo agendamento</button>
      </div>
      <p className="subtitulo">Consulte as doses e registre as aplicações ou os cancelamentos.</p>
      <section className="painel" aria-label="Filtros de agendas">
        <div className="filtros">
          <label>Data<input type="date" value={filtros.data} onChange={(e) => setFiltros({ ...filtros, data: e.target.value })} /></label>
          <label>Situação<select value={filtros.situacao} onChange={(e) => setFiltros({ ...filtros, situacao: e.target.value })}>
            <option value="">Todas</option><option value="Agendado">Agendado</option><option value="Realizado">Realizado</option><option value="Cancelado">Cancelado</option>
          </select></label>
          <label>Paciente<select value={filtros.usuario} onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}>
            <option value="">Todos</option>
            {pacientes.map((paciente) => <option key={paciente.id} value={paciente.id}>{paciente.nome} (#{paciente.id})</option>)}
          </select></label>
          <div className="filtros-acoes">
            <button onClick={() => setFiltros({ ...filtros, data: dataHoje() })}>Hoje</button>
            <button onClick={() => setFiltros({ data: '', situacao: '', usuario: '' })}>Limpar filtros</button>
          </div>
        </div>
      </section>
      <Mensagens erro={erro} sucesso={sucesso} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />
      {!carregando && (!pacientes.length || !vacinas.length) && !erro && <p className="ajuda">Para agendar, cadastre pelo menos um paciente e uma vacina nos menus correspondentes.</p>}
      {novo && <section className="painel" aria-label="Cadastro de agendamento">
        <h2>Novo agendamento</h2>
        <form className="formulario" onSubmit={salvar}>
          <label>Paciente<select name="usuario" defaultValue={filtros.usuario} required autoFocus>
            <option value="" disabled>Selecione</option>
            {pacientes.map((paciente) => <option key={paciente.id} value={paciente.id}>{paciente.nome} (#{paciente.id})</option>)}
          </select></label>
          <label>Vacina<select name="vacina" value={vacinaId} onChange={(e) => setVacinaId(e.target.value)} required>
            <option value="" disabled>Selecione</option>
            {vacinas.map((vacina) => <option key={vacina.id} value={vacina.id}>{vacina.titulo} (#{vacina.id})</option>)}
          </select></label>
          {vacinaSelecionada && <p className="campo-inteiro ajuda">
            Doses: {vacinaSelecionada.doses}.
            {vacinaSelecionada.doses > 1 && ` Intervalo: ${vacinaSelecionada.intervalo} ${PERIODICIDADES[vacinaSelecionada.periodicidade].toLowerCase()}. Todas as doses serão agendadas automaticamente.`}
          </p>}
          <label>Data da primeira dose<input type="date" name="data" defaultValue={filtros.data || dataHoje()} required /></label>
          <label>Horário<input type="time" name="hora" required /></label>
          <label className="campo-inteiro">Observações (opcional)<textarea name="observacoes" maxLength={200} /></label>
          <div className="acoes-formulario">
            <button className="primario" disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar agendamento'}</button>
            <button type="button" onClick={() => setNovo(false)} disabled={ocupado}>Cancelar</button>
          </div>
        </form>
      </section>}
      {detalhes && <Detalhes titulo="Dados da agenda" fechar={() => setDetalhes(null)} dados={{
        ID: detalhes.id, Paciente: `${detalhes.usuario_nome} (#${detalhes.usuario})`,
        Vacina: `${detalhes.vacina_titulo} (#${detalhes.vacina})`, Dose: detalhes.dose,
        Data: formatarData(detalhes.data), Horário: detalhes.hora,
        Situação: detalhes.situacao, 'Data da situação': formatarData(detalhes.data_situacao), Observações: detalhes.observacoes,
      }} />}
      {!carregando && <div className="tabela-container">
        <table>
          <caption>Agendamentos encontrados</caption>
          <thead><tr><th scope="col">Paciente</th><th scope="col">Vacina</th><th scope="col">Dose</th><th scope="col">Data / horário</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
          <tbody>
            {agendas.map((agenda) => <tr key={agenda.id}>
              <td>{agenda.usuario_nome}</td><td>{agenda.vacina_titulo}</td><td>{agenda.dose}</td>
              <td>{formatarData(agenda.data)}<br />{agenda.hora.slice(0, 5)}</td>
              <td><span className={`situacao ${agenda.situacao.toLowerCase()}`}>{agenda.situacao}</span></td>
              <td><div className="acoes">
                <button onClick={() => { setDetalhes(agenda); setNovo(false); }}>Consultar</button>
                {agenda.situacao === 'Agendado' && <>
                  <button onClick={() => setAcao({ agenda, situacao: 'Realizado' })} disabled={ocupado}>Realizar</button>
                  <button onClick={() => setAcao({ agenda, situacao: 'Cancelado' })} disabled={ocupado}>Cancelar agenda</button>
                </>}
                <button className="perigo" onClick={() => setAcao({ agenda, situacao: null })} disabled={ocupado}>Excluir</button>
              </div></td>
            </tr>)}
            {!agendas.length && <tr><td colSpan={6} className="vazio">Nenhuma agenda encontrada para os filtros selecionados.</td></tr>}
          </tbody>
        </table>
      </div>}
    </>
  );
}
