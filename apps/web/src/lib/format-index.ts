export const padIndex = (index: number, padTo: number = 2): string =>
  String(index + 1).padStart(padTo, '0')
