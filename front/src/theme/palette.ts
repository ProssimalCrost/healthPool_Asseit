import colors from './colors';

/**
 * Cores em hexadecimal para o que não aceita className:
 * ActivityIndicator, RefreshControl, placeholder, opções do React Navigation e gráficos SVG.
 */
export const palette = {
  ink: colors.ink,
  inkMuted: colors['ink-muted'],
  background: colors.background,
  surface: colors.surface,
  border: colors.border,
  onAccent: colors['on-accent'],
  water: colors.water.DEFAULT,
  waterPressed: colors.water.pressed,
  waterSoft: colors.water.soft,
  ok: colors.ok.DEFAULT,
  okSoft: colors.ok.soft,
  alert: colors.alert.DEFAULT,
  alertSoft: colors.alert.soft,
  amber: colors.amber.DEFAULT,
  amberSoft: colors.amber.soft,
} as const;
