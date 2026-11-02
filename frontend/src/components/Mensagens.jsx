export default function Mensagens({ erro, sucesso, carregando, tentarNovamente }) {
  return (
    <>
      {erro && <div className="mensagem erro" role="alert">
        <p>{erro}</p>
        {tentarNovamente && <button onClick={tentarNovamente}>Tentar novamente</button>}
      </div>}
      {sucesso && <p className="mensagem sucesso" role="status">{sucesso}</p>}
      {carregando && <p role="status">Carregando...</p>}
    </>
  );
}
