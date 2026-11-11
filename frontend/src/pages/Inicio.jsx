import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import { dataHoje, diasDoCalendario, formatarData } from '../utils.js';
import Mensagens from '../components/Mensagens.jsx';

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAXIMO_POR_DIA = 3;

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

export default function Inicio({ verDia }) {
  const hoje = dataHoje();
  const [anoAtual, mesAtual] = hoje.split('-').map(Number);
  const mesDeHoje = { ano: anoAtual, mes: mesAtual - 1 };

  const [agendas, setAgendas] = useState([]);
  const [visivel, setVisivel] = useState(mesDeHoje);
  const [diaSelecionado, setDiaSelecionado] = useState(hoje);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    requisicao('/agendas/', { signal: controller.signal })
      .then(setAgendas)
      .catch((e) => { if (e.name !== 'AbortError') setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function mudarMes(deslocamento) {
    const novoMes = new Date(visivel.ano, visivel.mes + deslocamento, 1);
    setVisivel({ ano: novoMes.getFullYear(), mes: novoMes.getMonth() });
    setDiaSelecionado(null);
  }

  function irParaHoje() {
    setVisivel(mesDeHoje);
    setDiaSelecionado(hoje);
  }

  const agendasPorDia = agruparPorDia(agendas);
  const agendasDeHoje = agendasPorDia[hoje] || [];
  const agendasDoDia = agendasPorDia[diaSelecionado] || [];

  const primeiroDiaDoMes = new Date(visivel.ano, visivel.mes, 1);
  const nomeDoMes = primeiroDiaDoMes.toLocaleDateString('pt-BR', { month: 'long' });
  const prefixoDoMes = chaveDoDia(visivel.ano, visivel.mes, 1).slice(0, 7);
  const totalDoMes = agendas.filter((agenda) => agenda.data.startsWith(prefixoDoMes)).length;

  const resumo = [
    { nome: 'Agendas de hoje', valor: agendasDeHoje.length },
    { nome: 'Aguardando aplicação', valor: contarSituacao(agendas, 'Agendado') },
    { nome: 'Realizadas', valor: contarSituacao(agendas, 'Realizado') },
    { nome: 'Canceladas', valor: contarSituacao(agendas, 'Cancelado') },
  ];

  return (
    <>
      <h1>Início</h1>
      <p className="subtitulo">Acompanhe os números gerais e veja no calendário os agendamentos de cada dia.</p>
      <Mensagens erro={erro} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />
      {!carregando && !erro && <>
        <section className="resumo" aria-label="Resumo das agendas">
          {resumo.map((item) => <div className="resumo-item" key={item.nome}>
            <span className="resumo-valor">{item.valor}</span>
            <span className="resumo-nome">{item.nome}</span>
          </div>)}
        </section>
        <div className="inicio-grade">
          <section className="painel" aria-label="Calendário de agendamentos">
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
                    onClick={() => setDiaSelecionado(chave)}
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
          <section className="painel" aria-label="Prévia do dia">
            {diaSelecionado ? <>
              <h2>{formatarData(diaSelecionado)}</h2>
              <p className="ajuda">{agendasDoDia.length} agendamento(s) neste dia</p>
              <ul className="previa">
                {agendasDoDia.map((agenda) => <li key={agenda.id}>
                  <strong>{agenda.hora.slice(0, 5)} · {agenda.usuario_nome}</strong>
                  <span>{agenda.vacina_titulo} · dose {agenda.dose}</span>
                  <span className={`situacao ${agenda.situacao.toLowerCase()}`}>{agenda.situacao}</span>
                </li>)}
              </ul>
              <button className="primario" onClick={() => verDia(diaSelecionado)}>Gerenciar este dia</button>
            </> : <p className="ajuda">Selecione um dia no calendário para ver os agendamentos.</p>}
          </section>
        </div>
      </>}
    </>
  );
}
