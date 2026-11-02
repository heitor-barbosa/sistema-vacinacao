import { useState } from 'react';

export default function App() {
  const [pagina, setPagina] = useState('Agendas');

  return (
    <>
      <header>
        <strong>Sistema de Vacinação</strong>
        <nav aria-label="Menu principal">
          {['Agendas', 'Pacientes', 'Vacinas', 'Alergias'].map((nome) => (
            <button key={nome} onClick={() => setPagina(nome)}>{nome}</button>
          ))}
        </nav>
      </header>
      <main><h1>{pagina}</h1></main>
    </>
  );
}
