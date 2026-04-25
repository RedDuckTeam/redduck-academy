export const calcProgress = (current: number, max: number): number =>
  max <= 0 ? 0 : Math.min((current / max) * 100, 100)
