// Paleta tirada da própria piscina: azul-petróleo do fundo, azulejo claro, água.
// Verde e vermelho ficam reservados para o status das medições (dentro / fora da faixa).
// CommonJS de propósito: o tailwind.config.js precisa dar require neste arquivo.
module.exports = {
  ink: '#0E3B4A',
  'ink-muted': '#4F6F78',
  background: '#EEF5F6',
  surface: '#FFFFFF',
  border: '#C9DCDF',
  'on-accent': '#FFFFFF',
  water: { DEFAULT: '#1F7F94', pressed: '#17687A', soft: '#DDEFF2' },
  ok: { DEFAULT: '#2E7D4F', soft: '#E3F2E8' },
  alert: { DEFAULT: '#C2362B', soft: '#FBE7E5' },
  amber: { DEFAULT: '#8A5A12', soft: '#FBF0DC' },
};
