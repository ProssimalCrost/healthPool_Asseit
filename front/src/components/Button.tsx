import { ActivityIndicator, Pressable } from 'react-native';
import { palette } from '../theme/palette';
import { Text, type TextTone } from './Text';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  className?: string;
}

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-water border-water active:bg-water-pressed',
  secondary: 'bg-surface border-border active:bg-water-soft',
  danger: 'bg-surface border-alert active:bg-alert-soft',
};

const LABEL_TONE: Record<Variant, TextTone> = { primary: 'onAccent', secondary: 'default', danger: 'alert' };
const SPINNER: Record<Variant, string> = { primary: palette.onAccent, secondary: palette.ink, danger: palette.alert };

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityHint,
  className,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`min-h-12 items-center justify-center rounded-md border-[1.5px] px-5 ${CONTAINER[variant]} ${
        inactive ? 'opacity-50' : ''
      } ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER[variant]} />
      ) : (
        <Text variant="body" tone={LABEL_TONE[variant]} className="font-bold">
          {title}
        </Text>
      )}
    </Pressable>
  );
}
