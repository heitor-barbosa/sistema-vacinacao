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

export function formatarData(data) {
  return data ? data.split('-').reverse().join('/') : '—';
}
