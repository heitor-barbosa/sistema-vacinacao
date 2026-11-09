export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const PERIODICIDADES = { 1: 'Dias', 2: 'Semanas', 3: 'Meses', 4: 'Anos' };

export function dataHoje() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const ano = partes.find((parte) => parte.type === 'year').value;
  const mes = partes.find((parte) => parte.type === 'month').value;
  const dia = partes.find((parte) => parte.type === 'day').value;
  return `${ano}-${mes}-${dia}`;
}

// Retorna os dias do mês (0 a 11), com null nas casas antes do primeiro dia da semana.
export function diasDoCalendario(ano, mes) {
  const casasVazias = new Date(ano, mes, 1).getDay();
  const totalDeDias = new Date(ano, mes + 1, 0).getDate();
  const vazios = Array(casasVazias).fill(null);
  const dias = Array.from({ length: totalDeDias }, (_, indice) => indice + 1);
  return [...vazios, ...dias];
}

export function formatarData(data) {
  return data ? data.split('-').reverse().join('/') : '—';
}
