import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import { dataHoje, diasDoCalendario, formatarData, horaAtual } from '../utils.js';
import Confirmacao from '../components/Confirmacao.jsx';
import Mensagens from '../components/Mensagens.jsx';

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAXIMO_POR_DIA = 3;
const PRIMEIRA_HORA = 7;
const ULTIMA_HORA = 18;

function chaveDoDia(ano, mes, dia) {
  const mesTexto = String(mes + 1).padStart(2, '0');
  const diaTexto = String(dia).padStart(2, '0');
  return `${ano}-${mesTexto}-${diaTexto}`;
}

function agruparPorDia(agendas) {
  const grupos = {};
  for (const agenda of agendas) {
    if (!grupos[agenda.data]) grupos[agenda.data] = [];
    grupos[agenda.data].push(agenda);
  }
  return grupos;
}

function contarSituacao(agendas, situacao) {
  return agendas.filter((agenda) => agenda.situacao === situacao).length;
}

function horaDaAgenda(agenda) {
  return Number(agenda.hora.slice(0, 2));
}

// Horas exibidas na visão do dia: das 7h às 18h, ampliando se houver agendas fora desse período.
function horasDoDia(agendasDoDia) {
  const horasComAgenda = agendasDoDia.map(horaDaAgenda);
  const inicio = Math.min(PRIMEIRA_HORA, ...horasComAgenda);
  const fim = Math.max(ULTIMA_HORA, ...horasComAgenda);
  return Array.from({ length: fim - inicio + 1 }, (_, indice) => inicio + indice);
}

function nomeDoDia(chave) {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'long' });
}

export default function Inicio({ verDia }) {
  const hoje = dataHoje();
  const [anoAtual, mesAtual] = hoje.split('-').map(Number);

  const [agendas, setAgendas] = useState([]);
  const [visivel, setVisivel] = useState({ ano: anoAtual, mes: mesAtual - 1 });
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [acao, setAcao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erroAoCarregar, setErroAoCarregar] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErroAoCarregar('');
    requisicao('/agendas/', { signal: controller.signal })
      .then(setAgendas)
      .catch((e) => { if (e.name !== 'AbortError') setErroAoCarregar(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function selecionarDia(chave) {
    const [ano, mes] = chave.split('-').map(Number);
    setVisivel({ ano, mes: mes - 1 });
    setDiaSelecionado(chave);
    setSucesso('');
  }

  function mudarDia(deslocamento) {
    const [ano, mes, dia] = diaSelecionado.split('-').map(Number);
    const novoDia = new Date(ano, mes - 1, dia + deslocamento);
    selecionarDia(chaveDoDia(novoDia.getFullYear(), novoDia.getMonth(), novoDia.getDate()));
  }

  function mudarMes(deslocamento) {
    const novoMes = new Date(visivel.ano, visivel.mes + deslocamento, 1);
    setVisivel({ ano: novoMes.getFullYear(), mes: novoMes.getMonth() });
  }

  function irParaHoje() {
    if (diaSelecionado) {
      selecionarDia(hoje);
    } else {
      setVisivel({ ano: anoAtual, mes: mesAtual - 1 });
    }
  }

  async function baixar(agenda, situacao) {
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      const atualizada = await requisicao(`/agendas/${agenda.id}/baixa/`, { method: 'POST', dados: { situacao } });
      setAgendas(agendas.map((item) => (item.id === atualizada.id ? atualizada : item)));
      setSucesso(`Agenda de ${agenda.usuario_nome} marcada como ${situacao}.`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAcao(null);
      setOcupado(false);
    }
  }

  const agendasPorDia = agruparPorDia(agendas);
  const agendasDeHoje = agendasPorDia[hoje] || [];
  const agendasDoDia = agendasPorDia[diaSelecionado] || [];

  const primeiroDiaDoMes = new Date(visivel.ano, visivel.mes, 1);
  const nomeDoMes = primeiroDiaDoMes.toLocaleDateString('pt-BR', { month: 'long' });
  const prefixoDoMes = chaveDoDia(visivel.ano, visivel.mes, 1).slice(0, 7);
  const totalDoMes = agendas.filter((agenda) => agenda.data.startsWith(prefixoDoMes)).length;
  const horaDeAgora = diaSelecionado === hoje ? horaAtual() : null;

  const resumo = [
    { nome: 'Agendas de hoje', valor: agendasDeHoje.length },
    { nome: 'Aguardando aplicação', valor: contarSituacao(agendas, 'Agendado') },
    { nome: 'Realizadas', valor: contarSituacao(agendas, 'Realizado') },
    { nome: 'Canceladas', valor: contarSituacao(agendas, 'Cancelado') },
  ];

  return (
    <>
      {acao && <Confirmacao
        mensagem={`Marcar a dose ${acao.agenda.dose} de "${acao.agenda.vacina_titulo}" para ${acao.agenda.usuario_nome} como ${acao.situacao}?`}
        confirmar={() => baixar(acao.agenda, acao.situacao)}
        cancelar={() => setAcao(null)} ocupado={ocupado}
      />}
      <h1>Início</h1>
      <p className="subtitulo">Acompanhe os números gerais e selecione um dia no calendário para ver os agendamentos por horário.</p>
      <Mensagens erro={erroAoCarregar || erro} sucesso={sucesso} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />
      {!carregando && !erroAoCarregar && <>
        <section className="resumo" aria-label="Resumo das agendas">
          {resumo.map((item) => <div className="resumo-item" key={item.nome}>
            <span className="resumo-valor">{item.valor}</span>
            <span className="resumo-nome">{item.nome}</span>
          </div>)}
        </section>
        <div className={diaSelecionado ? 'inicio-grade com-dia' : 'inicio-grade'}>
          <section className={diaSelecionado ? 'painel calendario compacto' : 'painel calendario'} aria-label="Calendário de agendamentos">
            <div className="calendario-topo">
              <div>
                <h2 className="calendario-titulo">{nomeDoMes} de {visivel.ano}</h2>
                <p className="ajuda">{totalDoMes} agendamento(s) neste mês</p>
              </div>
              <div className="acoes">
                <button onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
                <button onClick={irParaHoje}>Hoje</button>
                <button onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
              </div>
            </div>
            <div className="calendario-grade">
              {DIAS_DA_SEMANA.map((nome) => <div className="calendario-semana" key={nome}>{nome}</div>)}
              {diasDoCalendario(visivel.ano, visivel.mes).map((dia, indice) => {
                if (dia === null) return <div key={`vazio-${indice}`} />;
                const chave = chaveDoDia(visivel.ano, visivel.mes, dia);
                const doDia = agendasPorDia[chave] || [];
                const restantes = doDia.length - MAXIMO_POR_DIA;
                return (
                  <button
                    key={chave}
                    className="dia"
                    aria-label={`${dia} de ${nomeDoMes}: ${doDia.length} agendamento(s)`}
                    aria-pressed={chave === diaSelecionado}
                    aria-current={chave === hoje ? 'date' : undefined}
                    onClick={() => selecionarDia(chave)}
                  >
                    <span className="dia-numero">{dia}</span>
                    {doDia.slice(0, MAXIMO_POR_DIA).map((agenda) => (
                      <span className={`evento situacao ${agenda.situacao.toLowerCase()}`} key={agenda.id}>
                        {agenda.hora.slice(0, 5)} {agenda.usuario_nome}
                      </span>
                    ))}
                    {restantes > 0 && <span className="evento-mais">+{restantes} mais</span>}
                    {doDia.length > 0 && <span className="dia-total">{doDia.length}</span>}
                  </button>
                );
              })}
            </div>
          </section>
          {diaSelecionado && <section className="painel" aria-label="Agendamentos do dia">
            <div className="dia-topo">
              <div>
                <h2>{formatarData(diaSelecionado)}</h2>
                <p className="ajuda dia-semana">{nomeDoDia(diaSelecionado)} · {agendasDoDia.length} agendamento(s)</p>
              </div>
              <div className="acoes">
                <button onClick={() => mudarDia(-1)} aria-label="Dia anterior">‹</button>
                <button onClick={() => mudarDia(1)} aria-label="Próximo dia">›</button>
                <button onClick={() => verDia(diaSelecionado)}>Gerenciar este dia</button>
                <button onClick={() => { setDiaSelecionado(null); setSucesso(''); }}>Voltar ao mês</button>
              </div>
            </div>
            <ol className="linha-do-tempo">
              {horasDoDia(agendasDoDia).map((hora) => {
                const daHora = agendasDoDia.filter((agenda) => horaDaAgenda(agenda) === hora);
                const horaTexto = `${String(hora).padStart(2, '0')}:00`;
                return (
                  <li key={hora} className={hora === horaDeAgora ? 'faixa-hora agora' : 'faixa-hora'} aria-label={`${horaTexto}: ${daHora.length} agendamento(s)`}>
                    <span className="faixa-rotulo">{horaTexto}</span>
                    <div className="faixa-agendas">
                      {daHora.map((agenda) => <article className={`cartao-agenda ${agenda.situacao.toLowerCase()}`} key={agenda.id}>
                        <div className="cartao-topo">
                          <strong>{agenda.hora.slice(0, 5)} · {agenda.usuario_nome}</strong>
                          <span className={`situacao ${agenda.situacao.toLowerCase()}`}>{agenda.situacao}</span>
                        </div>
                        <span>{agenda.vacina_titulo} · dose {agenda.dose}</span>
                        {agenda.data_situacao && <span className="ajuda">{agenda.situacao} em {formatarData(agenda.data_situacao)}</span>}
                        {agenda.observacoes && <span className="ajuda">Obs.: {agenda.observacoes}</span>}
                        {agenda.situacao === 'Agendado' && <div className="acoes">
                          <button onClick={() => setAcao({ agenda, situacao: 'Realizado' })} disabled={ocupado}>Realizar</button>
                          <button onClick={() => setAcao({ agenda, situacao: 'Cancelado' })} disabled={ocupado}>Cancelar agenda</button>
                        </div>}
                      </article>)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>}
        </div>
      </>}
    </>
  );
}
