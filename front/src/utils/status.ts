import type { MeasurementStatus, Parameter } from '../api/types';
import { formatNumber, formatRange } from './numbers';

/**
 * Espelha a regra do servidor, só para dar retorno enquanto a pessoa digita.
 * O que vale é o status que o servidor devolve ao salvar. Limites inclusivos.
 */
export function evaluateStatus(value: number, min: number | null, max: number | null): MeasurementStatus {
  if (min === null && max === null) return 'NO_REFERENCE';
  if (min !== null && value < min) return 'BELOW';
  if (max !== null && value > max) return 'ABOVE';
  return 'IN_RANGE';
}

export const STATUS_LABEL: Record<MeasurementStatus, string> = {
  IN_RANGE: 'Dentro da faixa',
  BELOW: 'Abaixo da faixa',
  ABOVE: 'Acima da faixa',
  NO_REFERENCE: 'Sem faixa',
};

/** Símbolo junto da cor: quem não distingue verde de vermelho ainda entende o status. */
export const STATUS_SYMBOL: Record<MeasurementStatus, string> = {
  IN_RANGE: '✓',
  BELOW: '↓',
  ABOVE: '↑',
  NO_REFERENCE: '–',
};

/** Classes completas (o Tailwind só gera o que aparece escrito por inteiro no código). */
export const STATUS_CLASSES: Record<MeasurementStatus, { chip: string; text: string; band: string }> = {
  IN_RANGE: { chip: 'bg-ok-soft', text: 'text-ok', band: 'bg-ok' },
  BELOW: { chip: 'bg-alert-soft', text: 'text-alert', band: 'bg-alert' },
  ABOVE: { chip: 'bg-alert-soft', text: 'text-alert', band: 'bg-alert' },
  NO_REFERENCE: { chip: 'bg-water-soft', text: 'text-ink-muted', band: 'bg-border' },
};

export const isOutOfRange = (status: MeasurementStatus) => status === 'BELOW' || status === 'ABOVE';

/** Frase de orientação: "Ideal: 7,2 a 7,8 mg/L". */
export function describeRange(parameter: Pick<Parameter, 'min' | 'max' | 'unit'>): string {
  const range = formatRange(parameter.min, parameter.max);
  if (!range) return 'Sem faixa de referência';
  return parameter.unit ? `Ideal: ${range} ${parameter.unit}` : `Ideal: ${range}`;
}

/** Frase específica do status: "Acima do máximo de 7,8". */
export function describeStatus(status: MeasurementStatus, parameter: Pick<Parameter, 'min' | 'max'>): string {
  switch (status) {
    case 'IN_RANGE':
      return 'Dentro da faixa';
    case 'BELOW':
      return parameter.min !== null ? `Abaixo do mínimo de ${formatNumber(parameter.min)}` : 'Abaixo da faixa';
    case 'ABOVE':
      return parameter.max !== null ? `Acima do máximo de ${formatNumber(parameter.max)}` : 'Acima da faixa';
    case 'NO_REFERENCE':
      return 'Sem faixa de referência';
  }
}
