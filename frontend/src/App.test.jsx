import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { requisicao } from './api.js';
import { dataHoje } from './utils.js';

vi.mock('./api.js', () => ({ requisicao: vi.fn() }));

let alergias;
let pacientes;
let vacinas;
let agendas;

// Respostas controladas do contrato da API. O cálculo das doses é testado no backend.
async function apiSimulada(caminho, { method = 'GET', dados } = {}) {
  const url = new URL(caminho, 'http://api.test');
  const partes = url.pathname.split('/').filter(Boolean);
  const recurso = partes[0];
  const id = Number(partes[1]);
  const listas = { alergias, usuarios: pacientes, vacinas, agendas };

  if (method === 'GET') {
    let lista = listas[recurso];
    if (recurso === 'agendas') {
      for (const campo of ['data', 'situacao', 'usuario']) {
        if (url.searchParams.get(campo)) lista = lista.filter((item) => String(item[campo]) === url.searchParams.get(campo));
      }
    }
    return structuredClone(lista);
  }
  if (method === 'DELETE') {
    const lista = listas[recurso];
    lista.splice(lista.findIndex((item) => item.id === id), 1);
    return null;
  }
  if (recurso === 'agendas' && partes[2] === 'baixa') {
    const agenda = agendas.find((item) => item.id === id);
    Object.assign(agenda, dados, { data_situacao: dataHoje() });
    return structuredClone(agenda);
  }
  if (recurso === 'agendas') {
    const criadas = ['2028-01-31', '2028-02-29', '2028-03-31'].map((data, indice) => ({
      ...dados, data, id: indice + 1, dose: indice + 1, situacao: 'Agendado',
      data_situacao: null, usuario_nome: 'Maria', vacina_titulo: 'Vacina mensal', hora: '09:30:00',
    }));
    agendas.push(...criadas);
    return structuredClone(criadas);
  }
  const registro = { ...dados, id: listas[recurso].length + 1 };
  if (recurso === 'usuarios') registro.alergias_detalhes = alergias.filter((item) => dados.alergias.includes(item.id));
  listas[recurso].push(registro);
  return structuredClone(registro);
}

beforeEach(() => {
  alergias = [{ id: 1, nome: 'Ovo' }, { id: 2, nome: 'Látex' }];
  pacientes = [{
    id: 1, nome: 'Maria', data_nascimento: '2000-05-20', sexo: 'F',
    logradouro: 'Rua A', numero: '10', setor: 'Centro', cidade: 'Goiânia', uf: 'GO',
    alergias: [], alergias_detalhes: [],
  }];
  vacinas = [{ id: 1, titulo: 'Vacina mensal', descricao: 'Descrição completa', doses: 3, periodicidade: 3, intervalo: 1 }];
  agendas = [];
  requisicao.mockReset();
  requisicao.mockImplementation(apiSimulada);
});

async function abrirPagina(user, nome) {
  await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: nome, exact: true }));
  await screen.findByRole('table');
}

async function preencherPaciente(user, nome) {
  await user.click(screen.getByRole('button', { name: 'Novo paciente', exact: true }));
  const formulario = within(screen.getByRole('region', { name: 'Cadastro de paciente' }));
  await user.type(formulario.getByRole('textbox', { name: 'Nome', exact: true }), nome);
  await user.type(formulario.getByLabelText('Data de nascimento'), '2000-01-01');
  await user.selectOptions(formulario.getByRole('combobox', { name: 'Sexo' }), 'F');
  await user.type(formulario.getByLabelText('Logradouro'), 'Rua de teste');
  await user.type(formulario.getByLabelText('Número'), '20');
  await user.type(formulario.getByLabelText('Setor'), 'Centro');
  await user.type(formulario.getByLabelText('Cidade'), 'Goiânia');
  await user.selectOptions(formulario.getByRole('combobox', { name: 'UF' }), 'GO');
  return formulario;
}

describe('telas essenciais', () => {
  it('cadastra alergia e exige confirmação antes de excluir', async () => {
    const user = userEvent.setup();
    render(<App />);
    await abrirPagina(user, 'Alergias');
    await user.click(screen.getByRole('button', { name: 'Nova alergia' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Poeira');
    await user.click(screen.getByRole('button', { name: 'Salvar alergia' }));
    const linha = await screen.findByRole('row', { name: /Poeira/ });
    expect(requisicao).toHaveBeenCalledWith('/alergias/', { method: 'POST', dados: { nome: 'Poeira' } });
    await user.click(within(linha).getByRole('button', { name: 'Excluir' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Voltar' }));
    expect(requisicao.mock.calls.some(([, opcoes]) => opcoes?.method === 'DELETE')).toBe(false);
    await user.click(within(linha).getByRole('button', { name: 'Excluir' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(screen.queryByText('Poeira', { exact: true })).toBeNull());
  });

  it('cadastra vacina de dose única e vacina com intervalo obrigatório', async () => {
    const user = userEvent.setup();
    render(<App />);
    await abrirPagina(user, 'Vacinas');
    await user.click(screen.getByRole('button', { name: 'Nova vacina', exact: true }));
    await user.type(screen.getByLabelText('Título'), 'Dose única');
    expect(screen.queryByRole('combobox', { name: 'Periodicidade' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Salvar vacina' }));
    await screen.findByRole('row', { name: /Dose única/ });
    expect(requisicao).toHaveBeenCalledWith('/vacinas/', { method: 'POST', dados: {
      titulo: 'Dose única', descricao: '', doses: 1, periodicidade: null, intervalo: null,
    } });
    await user.click(screen.getByRole('button', { name: 'Nova vacina', exact: true }));
    await user.type(screen.getByLabelText('Título'), 'Duas doses');
    await user.clear(screen.getByLabelText('Doses'));
    await user.type(screen.getByLabelText('Doses'), '2');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Periodicidade' }), '2');
    await user.type(screen.getByLabelText('Intervalo'), '3');
    await user.click(screen.getByRole('button', { name: 'Salvar vacina' }));
    await screen.findByRole('row', { name: /Duas doses/ });
    expect(requisicao).toHaveBeenCalledWith('/vacinas/', { method: 'POST', dados: {
      titulo: 'Duas doses', descricao: '', doses: 2, periodicidade: 2, intervalo: 3,
    } });
  });

  it('cadastra pacientes com zero ou várias alergias e consulta seus dados', async () => {
    const user = userEvent.setup();
    render(<App />);
    await abrirPagina(user, 'Pacientes');
    let formulario = await preencherPaciente(user, 'Sem alergias');
    await user.click(formulario.getByRole('button', { name: 'Salvar paciente' }));
    await screen.findByRole('row', { name: /Sem alergias/ });
    expect(pacientes[1].alergias).toEqual([]);
    formulario = await preencherPaciente(user, 'Com alergias');
    await user.click(formulario.getByRole('checkbox', { name: 'Ovo' }));
    await user.click(formulario.getByRole('checkbox', { name: 'Látex' }));
    await user.click(formulario.getByRole('button', { name: 'Salvar paciente' }));
    const linha = await screen.findByRole('row', { name: /Com alergias/ });
    expect(pacientes[2].alergias).toEqual([1, 2]);
    expect(pacientes[2].sexo).toBe('F');
    expect(pacientes[2].uf).toBe('GO');
    await user.click(within(linha).getByRole('button', { name: 'Consultar' }));
    const detalhes = screen.getByRole('region', { name: 'Dados do paciente' });
    expect(detalhes.textContent).toContain('Ovo, Látex');
    expect(detalhes.textContent).toContain('Rua de teste');
  });

  it('abre as agendas do paciente sem restringir ao dia corrente', async () => {
    const user = userEvent.setup();
    render(<App />);
    await abrirPagina(user, 'Pacientes');
    await user.click(screen.getByRole('button', { name: 'Ver agendamentos' }));
    await screen.findByRole('table');
    expect(requisicao).toHaveBeenCalledWith('/agendas/?usuario=1', expect.any(Object));
    const filtros = within(screen.getByRole('region', { name: 'Filtros de agendas' }));
    expect(filtros.getByLabelText('Data').value).toBe('');
    expect(filtros.getByRole('combobox', { name: 'Paciente' }).value).toBe('1');
  });

  it('cria as doses, aplica baixa, filtra e exclui somente a agenda escolhida', async () => {
    const user = userEvent.setup();
    render(<App />);
    await abrirPagina(user, 'Agendas');
    expect(requisicao).toHaveBeenCalledWith(`/agendas/?data=${dataHoje()}`, expect.any(Object));
    await user.click(screen.getByRole('button', { name: 'Novo agendamento', exact: true }));
    const formulario = within(screen.getByRole('region', { name: 'Cadastro de agendamento' }));
    await user.selectOptions(formulario.getByRole('combobox', { name: 'Paciente' }), '1');
    await user.selectOptions(formulario.getByRole('combobox', { name: 'Vacina' }), '1');
    await user.clear(formulario.getByLabelText('Data da primeira dose'));
    await user.type(formulario.getByLabelText('Data da primeira dose'), '2028-01-31');
    await user.type(formulario.getByLabelText('Horário'), '09:30');
    await user.click(formulario.getByRole('button', { name: 'Salvar agendamento' }));
    await screen.findByText('3 agendamento(s) criado(s). Todas as doses estão na lista abaixo.');
    expect(requisicao).toHaveBeenCalledWith('/agendas/', { method: 'POST', dados: {
      usuario: 1, vacina: 1, data: '2028-01-31', hora: '09:30', observacoes: '',
    } });
    const primeira = await screen.findByRole('row', { name: /31\/01\/2028/ });
    expect(screen.getByRole('row', { name: /29\/02\/2028/ })).toBeTruthy();
    expect(screen.getByRole('row', { name: /31\/03\/2028/ })).toBeTruthy();
    await user.click(within(primeira).getByRole('button', { name: 'Realizar' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Agenda marcada como Realizado.');
    expect(requisicao).toHaveBeenCalledWith('/agendas/1/baixa/', { method: 'POST', dados: { situacao: 'Realizado' } });
    const segunda = await screen.findByRole('row', { name: /29\/02\/2028/ });
    await user.click(within(segunda).getByRole('button', { name: 'Cancelar agenda' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Agenda marcada como Cancelado.');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'Cancelado');
    await waitFor(() => expect(screen.queryByRole('row', { name: /31\/01\/2028/ })).toBeNull());
    const cancelada = await screen.findByRole('row', { name: /29\/02\/2028/ });
    await user.click(within(cancelada).getByRole('button', { name: 'Consultar' }));
    expect(screen.getByRole('region', { name: 'Dados da agenda' }).textContent).toContain(dataHoje().split('-').reverse().join('/'));
    await user.click(within(cancelada).getByRole('button', { name: 'Excluir' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Agenda excluída.');
    expect(agendas.map((item) => item.id)).toEqual([1, 3]);
    expect(requisicao).toHaveBeenCalledWith('/agendas/2/', { method: 'DELETE' });
  });

  it('fecha a confirmação e mostra o erro quando uma exclusão falha', async () => {
    const user = userEvent.setup();
    requisicao.mockImplementation((caminho, opcoes = {}) => {
      if (opcoes.method === 'DELETE') return Promise.reject(new Error('Não foi possível excluir.'));
      return apiSimulada(caminho, opcoes);
    });
    render(<App />);
    await abrirPagina(user, 'Alergias');
    const linha = screen.getByRole('row', { name: /Ovo/ });
    await user.click(within(linha).getByRole('button', { name: 'Excluir' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível excluir.');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('row', { name: /Ovo/ })).toBeTruthy();
  });

  it('mostra falha de conexão e permite tentar novamente', async () => {
    const user = userEvent.setup();
    requisicao.mockRejectedValue(new Error('Servidor indisponível.'));
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toContain('Servidor indisponível.');
    requisicao.mockImplementation(apiSimulada);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('region', { name: 'Calendário de agendamentos' });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('abre a visão do dia por horário, dá baixa e abre as agendas desse dia', async () => {
    const user = userEvent.setup();
    const hoje = dataHoje();
    const dia = Number(hoje.split('-')[2]);
    const base = {
      usuario: 1, usuario_nome: 'Maria', vacina: 1, vacina_titulo: 'Vacina mensal',
      data: hoje, dose: 1, observacoes: '',
    };
    agendas = [
      { ...base, id: 1, hora: '09:30:00', situacao: 'Agendado', data_situacao: null, observacoes: 'Trazer cartão' },
      { ...base, id: 2, hora: '21:00:00', situacao: 'Realizado', data_situacao: hoje },
    ];
    render(<App />);
    const calendario = await screen.findByRole('region', { name: 'Calendário de agendamentos' });
    expect(requisicao).toHaveBeenCalledWith('/agendas/', expect.any(Object));
    expect(screen.queryByRole('region', { name: 'Agendamentos do dia' })).toBeNull();
    const celula = within(calendario).getByRole('button', { name: new RegExp(`^${dia} de .*: 2 agendamento`) });
    expect(celula.getAttribute('aria-current')).toBe('date');
    expect(screen.getByRole('region', { name: 'Resumo das agendas' }).textContent).toContain('2Agendas de hoje');

    await user.click(celula);
    expect(calendario.className).toContain('compacto');
    const visaoDoDia = screen.getByRole('region', { name: 'Agendamentos do dia' });
    const faixa09 = within(visaoDoDia).getByRole('listitem', { name: '09:00: 1 agendamento(s)' });
    expect(faixa09.textContent).toContain('09:30 · Maria');
    expect(faixa09.textContent).toContain('Vacina mensal · dose 1');
    expect(faixa09.textContent).toContain('Obs.: Trazer cartão');
    expect(within(visaoDoDia).getByRole('listitem', { name: '21:00: 1 agendamento(s)' }).textContent).toContain('Realizado em');
    expect(within(visaoDoDia).getByRole('listitem', { name: '07:00: 0 agendamento(s)' })).toBeTruthy();

    await user.click(within(faixa09).getByRole('button', { name: 'Realizar' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Agenda de Maria marcada como Realizado.');
    expect(requisicao).toHaveBeenCalledWith('/agendas/1/baixa/', { method: 'POST', dados: { situacao: 'Realizado' } });
    expect(within(faixa09).queryByRole('button', { name: 'Realizar' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Próximo dia' }));
    expect(visaoDoDia.textContent).toContain('0 agendamento(s)');
    await user.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(visaoDoDia.textContent).toContain('09:30 · Maria');

    await user.click(screen.getByRole('button', { name: 'Voltar ao mês' }));
    expect(screen.queryByRole('region', { name: 'Agendamentos do dia' })).toBeNull();
    expect(calendario.className).not.toContain('compacto');

    await user.click(celula);
    await user.click(screen.getByRole('button', { name: 'Gerenciar este dia' }));
    await screen.findByRole('table');
    expect(requisicao).toHaveBeenCalledWith(`/agendas/?data=${hoje}`, expect.any(Object));
    expect(within(screen.getByRole('region', { name: 'Filtros de agendas' })).getByLabelText('Data').value).toBe(hoje);
  });
});
