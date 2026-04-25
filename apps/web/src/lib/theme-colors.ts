export const CARD_COLORS = [
  'bg-primary',
  'bg-accent-purple',
  'bg-accent-blue',
  'bg-accent-peach',
  'bg-accent-cyan',
] as const

export const pickCardColor = (index: number): string =>
  CARD_COLORS[index % CARD_COLORS.length]
