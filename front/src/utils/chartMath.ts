export interface Domain {
  lo: number;
  hi: number;
}

/**
 * Faixa vertical do gráfico: cobre os valores medidos E a faixa de referência
 * (para a zona verde sempre aparecer), com folga de 10% em cima e embaixo.
 */
export function computeDomain(values: number[], min: number | null, max: number | null): Domain {
  const all = [...values];
  if (min !== null) all.push(min);
  if (max !== null) all.push(max);
  if (all.length === 0) return { lo: 0, hi: 1 };

  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (lo === hi) {
    // um só valor e sem faixa: abre espaço para a linha não ficar colada na borda
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.1;
  return { lo: lo - pad, hi: hi + pad };
}

/** Mapeia um valor do domínio para uma posição em pixels (invertido: valor maior fica mais acima). */
export function scaleLinear(value: number, domain: Domain, rangeStart: number, rangeEnd: number): number {
  const ratio = (value - domain.lo) / (domain.hi - domain.lo);
  return rangeStart + ratio * (rangeEnd - rangeStart);
}

/**
 * Marcas do eixo vertical com valores redondos (7; 7,5; 8 em vez de 7,03; 7,26; 7,49).
 * `approxCount` é uma sugestão: o resultado pode ter uma marca a mais ou a menos.
 */
export function niceTicks(domain: Domain, approxCount: number): number[] {
  const span = domain.hi - domain.lo;
  const rough = span / Math.max(1, approxCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  // Arredonda para o passo "redondo" mais próximo (1, 2, 5 ou 10), com limiares em 1,5 / 3 / 7.
  const factor = residual < 1.5 ? 1 : residual < 3 ? 2 : residual < 7 ? 5 : 10;
  const step = factor * magnitude;

  const ticks: number[] = [];
  for (let i = Math.ceil(domain.lo / step); i <= Math.floor(domain.hi / step); i++) {
    ticks.push(Number((i * step).toFixed(10))); // evita 0.30000000000000004
  }
  // Nunca devolve menos de duas marcas: um eixo com uma só marca não orienta ninguém.
  return ticks.length >= 2 ? ticks : [domain.lo, domain.hi];
}
