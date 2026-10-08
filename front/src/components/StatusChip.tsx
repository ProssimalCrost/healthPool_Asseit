import { View } from 'react-native';
import type { MeasurementStatus } from '../api/types';
import { STATUS_CLASSES, STATUS_LABEL, STATUS_SYMBOL } from '../utils/status';
import { Text } from './Text';

interface StatusChipProps {
  status: MeasurementStatus;
  /** Texto mais específico que o padrão, como "Acima do máximo de 7,8". */
  label?: string;
}

/** Verde para dentro da faixa, vermelho para fora. O símbolo garante o entendimento sem depender da cor. */
export function StatusChip({ status, label }: StatusChipProps) {
  const classes = STATUS_CLASSES[status];
  const text = label ?? STATUS_LABEL[status];
  return (
    <View
      accessible
      accessibilityLabel={text}
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${classes.chip}`}
    >
      <Text variant="label" className={`${classes.text} font-extrabold`} importantForAccessibility="no">
        {STATUS_SYMBOL[status]}
      </Text>
      <Text variant="label" className={classes.text} importantForAccessibility="no">
        {text}
      </Text>
    </View>
  );
}
