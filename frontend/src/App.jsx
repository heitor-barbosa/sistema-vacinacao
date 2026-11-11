import { useState } from 'react';
import Agendas from './pages/Agendas.jsx';
import Alergias from './pages/Alergias.jsx';
import Inicio from './pages/Inicio.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Vacinas from './pages/Vacinas.jsx';
import './styles.css';

const MENU = [
  { grupo: 'Visão geral', paginas: ['Início'] },
  { grupo: 'Atendimento', paginas: ['Agendas'] },
  { grupo: 'Cadastros', paginas: ['Pacientes', 'Vacinas', 'Alergias'] },
];
const SEM_FILTRO = { usuario: '', data: '' };

export default function App() {
  const [pagina, setPagina] = useState('Início');
  const [filtroAgendas, setFiltroAgendas] = useState(SEM_FILTRO);

  function abrirAgendas(filtro) {
    setFiltroAgendas({ ...SEM_FILTRO, ...filtro });
    setPagina('Agendas');
  }

  function abrirPeloMenu(nome) {
    setFiltroAgendas(SEM_FILTRO);
    setPagina(nome);
  }

  return (
    <div className="aplicacao">
      <aside className="menu-lateral">
        <div className="marca">Sistema de Vacinação</div>
        <nav aria-label="Menu principal">
          {MENU.map(({ grupo, paginas }) => (
            <div className="menu-grupo" key={grupo}>
              <p className="menu-grupo-nome">{grupo}</p>
              {paginas.map((nome) => (
                <button key={nome} aria-current={pagina === nome ? 'page' : undefined} onClick={() => abrirPeloMenu(nome)}>
                  {nome}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main>
        {pagina === 'Início' && <Inicio verDia={(data) => abrirAgendas({ data })} />}
        {pagina === 'Agendas' && <Agendas
          key={`${filtroAgendas.usuario}|${filtroAgendas.data}`}
          usuarioInicial={filtroAgendas.usuario}
          dataInicial={filtroAgendas.data}
        />}
        {pagina === 'Pacientes' && <Pacientes verAgendas={(usuario) => abrirAgendas({ usuario: String(usuario) })} />}
        {pagina === 'Vacinas' && <Vacinas />}
        {pagina === 'Alergias' && <Alergias />}
      </main>
    </div>
  );
}
