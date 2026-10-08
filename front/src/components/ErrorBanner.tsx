import { Pressable, View } from 'react-native';
import { Text } from './Text';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View accessibilityRole="alert" className="gap-2 rounded-md border-l-4 border-alert bg-alert-soft p-3.5">
      <Text variant="body">{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text variant="body" tone="alert" className="font-bold">
            Tentar de novo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
