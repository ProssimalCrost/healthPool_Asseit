import { Text as RNText, type TextProps } from 'react-native';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'small';
export type TextTone = 'default' | 'muted' | 'alert' | 'ok' | 'accent' | 'onAccent';

// Classes completas em objetos: o Tailwind só gera o que aparece escrito por inteiro.
const VARIANT: Record<TextVariant, string> = {
  display: 'text-3xl font-extrabold leading-9',
  title: 'text-[22px] font-bold leading-7',
  heading: 'text-[17px] font-bold leading-[22px]',
  body: 'text-base leading-6',
  label: 'text-sm font-semibold leading-[18px]',
  small: 'text-[13px] font-medium leading-[17px]',
};

const TONE: Record<TextTone, string> = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  alert: 'text-alert',
  ok: 'text-ok',
  accent: 'text-water',
  onAccent: 'text-on-accent',
};

interface Props extends TextProps {
  variant?: TextVariant;
  /** Se omitido: "small" usa muted, o resto usa default. */
  tone?: TextTone;
}

/** Texto do app. Tamanho e peso vêm de `variant`, cor de `tone`; `className` só para layout (margem, alinhamento). */
export function Text({ variant = 'body', tone, className, ...props }: Props) {
  const resolvedTone = tone ?? (variant === 'small' ? 'muted' : 'default');
  return <RNText className={`${VARIANT[variant]} ${TONE[resolvedTone]} ${className ?? ''}`} {...props} />;
}
