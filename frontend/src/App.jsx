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

// Ícones do menu lateral, desenhados em SVG para não exigir uma biblioteca.
const ICONES = {
  'Início': <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  Agendas: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
  Pacientes: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.85" /></>,
  Vacinas: <><path d="m18 2 4 4" /><path d="m17 7 3-3" /><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" /><path d="m9 11 4 4" /><path d="m5 19-3 3" /><path d="m14 4 6 6" /></>,
  Alergias: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
};

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
        <div className="marca">
          <img className="marca-logo" src="/logo.svg" alt="" />
          <div>
            <span className="marca-nome">SIGV</span>
            <span className="marca-descricao">Sistema Inteligente de Gestão da Vacinação</span>
          </div>
        </div>
        <nav aria-label="Menu principal">
          {MENU.map(({ grupo, paginas }) => (
            <div className="menu-grupo" key={grupo}>
              <p className="menu-grupo-nome">{grupo}</p>
              {paginas.map((nome) => (
                <button key={nome} aria-current={pagina === nome ? 'page' : undefined} onClick={() => abrirPeloMenu(nome)}>
                  <svg className="menu-icone" viewBox="0 0 24 24" aria-hidden="true">{ICONES[nome]}</svg>
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
