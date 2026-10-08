import { Pressable } from 'react-native';
import { Text } from './Text';

/** Botão de texto para o cabeçalho de navegação. */
export function HeaderButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10} className="min-h-10 justify-center px-2">
      <Text variant="body" tone="accent" className="font-bold">
        {title}
      </Text>
    </Pressable>
  );
}
