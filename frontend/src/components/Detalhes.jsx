export default function Detalhes({ titulo, dados, fechar }) {
  return (
    <section className="painel" aria-label={titulo}>
      <div className="cabecalho-painel">
        <h2>{titulo}</h2>
        <button onClick={fechar}>Fechar detalhes</button>
      </div>
      <dl className="detalhes">
        {Object.entries(dados).map(([nome, valor]) => (
          <div key={nome}>
            <dt>{nome}</dt>
            <dd>{valor === null || valor === undefined || valor === '' ? '—' : valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
