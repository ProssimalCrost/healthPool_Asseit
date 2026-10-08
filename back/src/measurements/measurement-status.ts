/**
 * Resultado da comparação de uma medição com a faixa de referência.
 * O app mostra verde para IN_RANGE e vermelho para BELOW/ABOVE.
 * BELOW e ABOVE ficam separados para o texto dizer "abaixo" ou "acima",
 * porque cor sozinha não basta para quem tem daltonismo.
 */
export type MeasurementStatus = 'IN_RANGE' | 'BELOW' | 'ABOVE' | 'NO_REFERENCE';

/**
 * Os limites são inclusivos: pH 7,2 e pH 7,8 estão dentro da faixa 7,2 a 7,8.
 * Qualquer limite pode ser nulo (faixa aberta). Sem nenhum limite não há
 * como julgar, e o resultado é NO_REFERENCE (o app mostra cinza).
 */
export function evaluateStatus(value: number, min: number | null, max: number | null): MeasurementStatus {
  if (min === null && max === null) return 'NO_REFERENCE';
  if (min !== null && value < min) return 'BELOW';
  if (max !== null && value > max) return 'ABOVE';
  return 'IN_RANGE';
}
