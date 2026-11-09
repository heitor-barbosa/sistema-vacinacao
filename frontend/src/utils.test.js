import { describe, expect, it } from 'vitest';
import { diasDoCalendario } from './utils.js';

describe('diasDoCalendario', () => {
  it('começa no dia da semana correto e respeita o tamanho do mês', () => {
    const novembro = diasDoCalendario(2026, 10);
    expect(novembro[0]).toBe(1);
    expect(novembro.length).toBe(30);
  });

  it('considera fevereiro de ano bissexto e as casas vazias', () => {
    const fevereiro = diasDoCalendario(2028, 1);
    expect(fevereiro.slice(0, 3)).toEqual([null, null, 1]);
    expect(fevereiro.at(-1)).toBe(29);
  });
});
