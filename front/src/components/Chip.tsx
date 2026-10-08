import { Pressable } from 'react-native';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Opção de escolha única (período, parâmetro). */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      className={`min-h-10 justify-center rounded-full border px-4 ${
        selected ? 'border-water bg-water' : 'border-border bg-surface active:bg-water-soft'
      }`}
    >
      <Text variant="label" tone={selected ? 'onAccent' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}
