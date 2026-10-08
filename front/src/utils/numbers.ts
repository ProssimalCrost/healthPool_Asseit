/**
 * Converte o que o usuário digitou em número. Aceita vírgula ou ponto ("7,4" ou "7.4").
 * Vazio vira null; texto que não é número vira NaN, para o formulário poder avisar.
 */
export function parseDecimal(text: string): number | null {
  const cleaned = text.trim().replace(',', '.');
  if (cleaned === '') return null;
  // Number('') é 0 e Number('1e3') é 1000: só aceita dígitos, com sinal e uma casa decimal opcional.
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** 7.4 vira "7,4"; no máximo 2 casas decimais. Sem Intl, que varia entre aparelhos. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace('.', ',');
}

export function formatValue(value: number, unit: string): string {
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

/** "7,2 a 7,8", "mín. 1", "máx. 3" ou null quando não há faixa. */
export function formatRange(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return `${formatNumber(min)} a ${formatNumber(max)}`;
  if (min !== null) return `mín. ${formatNumber(min)}`;
  if (max !== null) return `máx. ${formatNumber(max)}`;
  return null;
}

/** Volume em litros digitado como "30000" ou "30.000". Vazio = null, inválido = NaN. */
export function parseLiters(text: string): number | null {
  const cleaned = text.trim().replace(/[.\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+$/.test(cleaned)) return Number.NaN;
  const value = Number(cleaned);
  return value >= 1 ? value : Number.NaN;
}

export function formatLiters(liters: number): string {
  return `${String(liters).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} L`;
}
