import { useState } from 'react';
import Alergias from './pages/Alergias.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Vacinas from './pages/Vacinas.jsx';
import './styles.css';

export default function App() {
  const [pagina, setPagina] = useState('Agendas');
  const [pacienteAgenda, setPacienteAgenda] = useState('');

  function verAgendas(usuario) {
    setPacienteAgenda(String(usuario));
    setPagina('Agendas');
  }

  return (
    <>
      <header className="topo">
        <div className="topo-conteudo">
          <div className="marca">Sistema de Vacinação</div>
          <nav aria-label="Menu principal">
            {['Agendas', 'Pacientes', 'Vacinas', 'Alergias'].map((nome) => (
              <button key={nome} aria-current={pagina === nome ? 'page' : undefined} onClick={() => {
                setPagina(nome);
                if (nome === 'Agendas') setPacienteAgenda('');
              }}>{nome}</button>
            ))}
          </nav>
        </div>
      </header>
      <main>
        {pagina === 'Agendas' && <><h1>Agendas</h1>{pacienteAgenda && <p>Paciente selecionado: {pacienteAgenda}</p>}</>}
        {pagina === 'Pacientes' && <Pacientes verAgendas={verAgendas} />}
        {pagina === 'Vacinas' && <Vacinas />}
        {pagina === 'Alergias' && <Alergias />}
      </main>
    </>
  );
}
