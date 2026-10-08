import { Pressable, View } from 'react-native';
import type { Pool } from '../api/types';
import { formatLiters, formatNumber } from '../utils/numbers';
import { STATUS_CLASSES, STATUS_SYMBOL, isOutOfRange } from '../utils/status';
import { Text } from './Text';

/** Resume a piscina pela pior situação: fora da faixa > tudo certo > sem medições. */
function summarize(pool: Pool): { text: string; band: string } {
  const measured = pool.parameters.filter((p) => p.latest !== null);
  const outOfRange = measured.filter((p) => p.latest && isOutOfRange(p.latest.status));
  if (outOfRange.length > 0) {
    const text = outOfRange.length === 1 ? '1 parâmetro fora da faixa' : `${outOfRange.length} parâmetros fora da faixa`;
    return { text, band: STATUS_CLASSES.ABOVE.band };
  }
  if (measured.length > 0) return { text: 'Tudo dentro da faixa', band: STATUS_CLASSES.IN_RANGE.band };
  return { text: 'Sem medições ainda', band: STATUS_CLASSES.NO_REFERENCE.band };
}

export function PoolCard({ pool, onPress }: { pool: Pool; onPress: () => void }) {
  const summary = summarize(pool);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pool.name}. ${summary.text}`}
      accessibilityHint="Abre os detalhes da piscina"
      className="flex-row overflow-hidden rounded-lg border border-border bg-surface active:bg-water-soft"
    >
      <View className={`w-2 ${summary.band}`} />
      <View className="flex-1 gap-3 p-4">
        <View className="gap-0.5">
          <Text variant="heading">{pool.name}</Text>
          <Text variant="small">
            {pool.volumeLiters !== null ? `${formatLiters(pool.volumeLiters)}, ` : ''}
            {summary.text}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {pool.parameters.map((parameter) => {
            const status = parameter.latest?.status ?? 'NO_REFERENCE';
            const classes = STATUS_CLASSES[status];
            return (
              <View key={parameter.id} className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${classes.chip}`}>
                <Text variant="small" className={`font-bold ${classes.text}`}>
                  {parameter.name}
                </Text>
                <Text variant="small" className={classes.text}>
                  {parameter.latest ? `${formatNumber(parameter.latest.value)} ${STATUS_SYMBOL[status]}` : '–'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}
