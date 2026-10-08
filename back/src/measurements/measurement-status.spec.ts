import { evaluateStatus } from './measurement-status.js';

describe('evaluateStatus', () => {
  describe('faixa fechada (pH 7,2 a 7,8)', () => {
    const min = 7.2;
    const max = 7.8;

    it('valor no meio da faixa está dentro', () => {
      expect(evaluateStatus(7.5, min, max)).toBe('IN_RANGE');
    });

    it('os limites são inclusivos', () => {
      expect(evaluateStatus(7.2, min, max)).toBe('IN_RANGE');
      expect(evaluateStatus(7.8, min, max)).toBe('IN_RANGE');
    });

    it('logo abaixo e logo acima ficam fora', () => {
      expect(evaluateStatus(7.19, min, max)).toBe('BELOW');
      expect(evaluateStatus(7.81, min, max)).toBe('ABOVE');
    });

    it('valores extremos', () => {
      expect(evaluateStatus(0, min, max)).toBe('BELOW');
      expect(evaluateStatus(14, min, max)).toBe('ABOVE');
    });
  });

  describe('faixa aberta', () => {
    it('só mínimo: nunca fica acima', () => {
      expect(evaluateStatus(1000, 1, null)).toBe('IN_RANGE');
      expect(evaluateStatus(0.9, 1, null)).toBe('BELOW');
    });

    it('só máximo: nunca fica abaixo', () => {
      expect(evaluateStatus(-5, null, 3)).toBe('IN_RANGE');
      expect(evaluateStatus(3.1, null, 3)).toBe('ABOVE');
    });
  });

  it('sem limites não há como julgar', () => {
    expect(evaluateStatus(42, null, null)).toBe('NO_REFERENCE');
  });

  it('faixa de um ponto só (min igual a max)', () => {
    expect(evaluateStatus(5, 5, 5)).toBe('IN_RANGE');
    expect(evaluateStatus(5.01, 5, 5)).toBe('ABOVE');
    expect(evaluateStatus(4.99, 5, 5)).toBe('BELOW');
  });

  it('zero é um limite válido, não "sem limite"', () => {
    expect(evaluateStatus(-0.1, 0, 10)).toBe('BELOW');
    expect(evaluateStatus(0, 0, 10)).toBe('IN_RANGE');
  });
});
