import { afterEach, expect, it, vi } from 'vitest';
import { requisicao } from './api.js';

afterEach(() => vi.unstubAllGlobals());

it('envia JSON e preserva a lista retornada na criação de agendas', async () => {
  const resposta = [{ id: 1, dose: 1 }, { id: 2, dose: 2 }];
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(resposta), { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  expect(await requisicao('/agendas/', { method: 'POST', dados: { usuario: 1 } })).toEqual(resposta);
  expect(fetchMock.mock.calls[0][1].body).toBe('{"usuario":1}');
  expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
});

it('aceita exclusão HTTP 204 sem tentar ler JSON', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  expect(await requisicao('/vacinas/1/', { method: 'DELETE' })).toBeNull();
});

it('apresenta as mensagens de validação devolvidas pela API', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ doses: ['Informe um número maior que zero.'] }), { status: 400 })));
  await expect(requisicao('/vacinas/', { method: 'POST', dados: {} })).rejects.toThrow('doses: Informe um número maior que zero.');
});

it('diferencia uma falha de conexão de uma requisição cancelada', async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));
  fetchMock.mockRejectedValueOnce(new DOMException('Cancelada', 'AbortError'));
  vi.stubGlobal('fetch', fetchMock);
  await expect(requisicao('/agendas/')).rejects.toThrow('Não foi possível conectar ao servidor.');
  await expect(requisicao('/agendas/')).rejects.toHaveProperty('name', 'AbortError');
});
