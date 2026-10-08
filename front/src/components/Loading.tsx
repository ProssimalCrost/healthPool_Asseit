import { ActivityIndicator, View } from 'react-native';
import { palette } from '../theme/palette';

export function Loading({ label }: { label: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color={palette.water} accessibilityLabel={label} />
    </View>
  );
}
