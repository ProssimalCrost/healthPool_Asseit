import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  message: string;
  children?: ReactNode;
}

/** Tela vazia é um convite para agir: diz o que falta e oferece o próximo passo. */
export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <View className="gap-3 rounded-lg border border-dashed border-border bg-surface p-6">
      <Text variant="heading">{title}</Text>
      <Text tone="muted">{message}</Text>
      {children}
    </View>
  );
}
