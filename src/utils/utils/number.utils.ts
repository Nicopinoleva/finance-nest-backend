export function parseAmount(amountStr: string): number {
  // Remove currency symbols, spaces, thousand separators, and convert Chilean decimal format
  // Chilean format: 1.234.567,89 or -1.234.567,89
  return Number.parseFloat(amountStr.replaceAll(/[$\s.,]/g, (match) => (match === ',' ? '.' : '')));
}
