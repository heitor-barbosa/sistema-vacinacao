import { useEffect, useRef } from 'react';

export default function Confirmacao({ mensagem, confirmar, cancelar, ocupado }) {
  const dialogoRef = useRef(null);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    dialogo.showModal();
    return () => dialogo.close();
  }, []);

  return (
    <dialog ref={dialogoRef} aria-labelledby="titulo-confirmacao" onCancel={(event) => {
      event.preventDefault();
      if (!ocupado) cancelar();
    }}>
      <h2 id="titulo-confirmacao">Confirmar operação</h2>
      <p>{mensagem}</p>
      <div className="acoes-formulario">
        <button className="primario" onClick={confirmar} disabled={ocupado}>{ocupado ? 'Aguarde...' : 'Confirmar'}</button>
        <button onClick={cancelar} disabled={ocupado}>Voltar</button>
      </div>
    </dialog>
  );
}
