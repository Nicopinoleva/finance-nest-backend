export function removeAccents(str: string): string {
  // Excludes \u0303 (combining tilde) to preserve ñ
  return str.normalize('NFD').replaceAll(/[\u0300-\u0302\u0304-\u036f]/g, '');
};