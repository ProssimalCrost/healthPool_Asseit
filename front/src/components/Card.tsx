import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`gap-3 rounded-lg border border-border bg-surface p-4 ${className ?? ''}`}>{children}</View>;
}
