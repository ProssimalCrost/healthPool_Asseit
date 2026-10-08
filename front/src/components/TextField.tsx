import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { palette } from '../theme/palette';
import { Text } from './Text';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Texto de apoio abaixo do campo (some quando há erro). */
  hint?: string;
  /** Unidade mostrada à direita, como "mg/L". */
  suffix?: string;
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, suffix, containerClassName, ...inputProps },
  ref,
) {
  return (
    <View className={`gap-1.5 ${containerClassName ?? ''}`}>
      <Text variant="label">{label}</Text>
      <View
        className={`min-h-12 flex-row items-center rounded-md border-[1.5px] bg-surface px-3.5 ${
          error ? 'border-alert' : 'border-border'
        }`}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={palette.inkMuted}
          className="flex-1 py-2.5 text-base text-ink"
          {...inputProps}
        />
        {suffix ? (
          <Text variant="body" tone="muted" className="ml-2">
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="label" tone="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : null}
    </View>
  );
});
