const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export async function requisicao(caminho, { method = 'GET', dados, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (dados !== undefined) headers['Content-Type'] = 'application/json';

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: dados === undefined ? undefined : JSON.stringify(dados),
      signal,
    });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
  }

  if (resposta.status === 204) return null;
  const conteudo = await resposta.json().catch((erro) => {
    if (erro.name === 'AbortError') throw erro;
    return null;
  });

  if (!resposta.ok) {
    if (conteudo && typeof conteudo === 'object') {
      const mensagens = Object.entries(conteudo).map(([campo, erros]) => {
        const mensagem = Array.isArray(erros) ? erros.join(' ') : String(erros);
        return campo === 'detail' ? mensagem : `${campo}: ${mensagem}`;
      });
      throw new Error(mensagens.join('\n'));
    }
    throw new Error('Não foi possível concluir a operação. Tente novamente.');
  }

  if (conteudo === null) throw new Error('O servidor retornou uma resposta inesperada.');
  return conteudo;
}
