import { useEffect, useState } from 'react';
import { requisicao } from '../api.js';
import { dataHoje, formatarData, UFS } from '../utils.js';
import Detalhes from '../components/Detalhes.jsx';
import Mensagens from '../components/Mensagens.jsx';

export default function Pacientes({ verAgendas }) {
  const [pacientes, setPacientes] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [novo, setNovo] = useState(false);
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
    Promise.all([
      requisicao('/usuarios/', { signal: controller.signal }),
      requisicao('/alergias/', { signal: controller.signal }),
    ]).then(([usuarios, listaAlergias]) => {
      setPacientes(usuarios);
      setAlergias(listaAlergias);
    }).catch((e) => { if (e.name !== 'AbortError') setErro(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  async function salvar(event) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    const dados = {
      nome: formulario.get('nome'),
      data_nascimento: formulario.get('data_nascimento'),
      sexo: formulario.get('sexo'),
      logradouro: formulario.get('logradouro'),
      numero: formulario.get('numero'),
      setor: formulario.get('setor'),
      cidade: formulario.get('cidade'),
      uf: formulario.get('uf'),
      alergias: formulario.getAll('alergias').map(Number),
    };
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao('/usuarios/', { method: 'POST', dados });
      setNovo(false);
      setSucesso('Paciente cadastrado.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(paciente) {
    if (!window.confirm(`Excluir o paciente "${paciente.nome}"? Todas as agendas vinculadas também serão excluídas.`)) return;
    setErro('');
    setSucesso('');
    setOcupado(true);
    try {
      await requisicao(`/usuarios/${paciente.id}/`, { method: 'DELETE' });
      if (detalhes?.id === paciente.id) setDetalhes(null);
      setSucesso('Paciente excluído.');
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <div className="cabecalho-pagina">
        <h1>Pacientes</h1>
        <button className="primario" onClick={() => { setNovo(true); setDetalhes(null); }} disabled={ocupado || carregando}>Novo paciente</button>
      </div>
      <p className="subtitulo">Cadastre as pessoas que serão vacinadas e suas possíveis alergias.</p>
      <Mensagens erro={erro} sucesso={sucesso} carregando={carregando} tentarNovamente={() => setAtualizacao((valor) => valor + 1)} />
      {novo && <section className="painel" aria-label="Cadastro de paciente">
        <h2>Novo paciente</h2>
        <form className="formulario" onSubmit={salvar}>
          <label className="campo-inteiro">Nome<input name="nome" maxLength={60} required autoFocus /></label>
          <label>Data de nascimento<input type="date" name="data_nascimento" max={dataHoje()} required /></label>
          <label>Sexo<select name="sexo" defaultValue="" required>
            <option value="" disabled>Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option>
          </select></label>
          <label>Logradouro<input name="logradouro" maxLength={60} required /></label>
          <label>Número<input type="number" name="numero" step={1} min={-9999999999} max={9999999999} required /></label>
          <label>Setor<input name="setor" maxLength={40} required /></label>
          <label>Cidade<input name="cidade" maxLength={40} required /></label>
          <label>UF<select name="uf" defaultValue="" required>
            <option value="" disabled>Selecione</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select></label>
          <fieldset className="campo-inteiro">
            <legend>Alergias (opcional)</legend>
            {alergias.length ? <div className="checkboxes">
              {alergias.map((alergia) => <label key={alergia.id}>
                <input type="checkbox" name="alergias" value={alergia.id} />{alergia.nome}
              </label>)}
            </div> : <p className="ajuda">Nenhuma alergia cadastrada. Você pode cadastrar o paciente sem alergias.</p>}
          </fieldset>
          <div className="acoes-formulario">
            <button className="primario" disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar paciente'}</button>
            <button type="button" onClick={() => setNovo(false)} disabled={ocupado}>Cancelar</button>
          </div>
        </form>
      </section>}
      {detalhes && <Detalhes titulo="Dados do paciente" fechar={() => setDetalhes(null)} dados={{
        ID: detalhes.id, Nome: detalhes.nome, 'Data de nascimento': formatarData(detalhes.data_nascimento),
        Sexo: detalhes.sexo === 'M' ? 'Masculino' : 'Feminino', Logradouro: detalhes.logradouro,
        Número: detalhes.numero, Setor: detalhes.setor, Cidade: detalhes.cidade, UF: detalhes.uf,
        Alergias: detalhes.alergias_detalhes.map((alergia) => alergia.nome).join(', ') || 'Nenhuma',
      }} />}
      {!carregando && <div className="tabela-container">
        <table>
          <caption>Pacientes cadastrados</caption>
          <thead><tr><th scope="col">Nome</th><th scope="col">Nascimento</th><th scope="col">Cidade</th><th scope="col">UF</th><th scope="col">Ações</th></tr></thead>
          <tbody>
            {pacientes.map((paciente) => <tr key={paciente.id}>
              <td>{paciente.nome}</td><td>{formatarData(paciente.data_nascimento)}</td><td>{paciente.cidade}</td><td>{paciente.uf}</td>
              <td><div className="acoes">
                <button onClick={() => { setDetalhes(paciente); setNovo(false); }}>Consultar</button>
                <button onClick={() => verAgendas(paciente.id)}>Ver agendamentos</button>
                <button className="perigo" onClick={() => excluir(paciente)} disabled={ocupado}>Excluir</button>
              </div></td>
            </tr>)}
            {!pacientes.length && <tr><td colSpan={5} className="vazio">Nenhum paciente cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>}
    </>
  );
}
