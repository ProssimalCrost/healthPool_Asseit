import type { TextStyle } from 'react-native';

// Paleta tirada da própria piscina: azul-petróleo do fundo, azulejo claro, água.
// Verde e vermelho ficam reservados para status de medição (dentro / fora da faixa).
export const colors = {
  ink: '#0E3B4A',
  inkMuted: '#4F6F78',
  background: '#EEF5F6',
  surface: '#FFFFFF',
  border: '#C9DCDF',
  water: '#1F7F94',
  waterPressed: '#17687A',
  waterSoft: '#DDEFF2',
  ok: '#2E7D4F',
  okSoft: '#E3F2E8',
  alert: '#C2362B',
  alertSoft: '#FBE7E5',
  amber: '#8A5A12',
  amberSoft: '#FBF0DC',
  onAccent: '#FFFFFF',
} as const;

export const space = (n: number) => n * 4;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400', color: colors.ink },
  bodyMuted: { fontSize: 15, lineHeight: 21, fontWeight: '400', color: colors.inkMuted },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.ink },
  small: { fontSize: 13, lineHeight: 17, fontWeight: '500', color: colors.inkMuted },
} satisfies Record<string, TextStyle>;
