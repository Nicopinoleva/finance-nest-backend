export function removeAccents(str: string): string {
  // Excludes \u0303 (combining tilde) to preserve ñ
  return str.normalize('NFD').replaceAll(/[\u0300-\u0302\u0304-\u036f]/g, '');
}

/**
 * Normalizes a date string by converting slashes ("/") to hyphens ("-").
 *
 * Accepts formats like `dd/MM/yyyy` or `dd-MM-yyyy` and converts them to a
 * consistent hyphen-separated format (`dd-MM-yyyy`), making them easier to parse.
 *
 * @param {string} dateStr - The date string to normalize.
 * @returns {string} The normalized date string with hyphens.
 */
export function normalizeDateString(dateStr: string): string {
  return dateStr.replaceAll('/', '-');
}

/**
 * Removes all whitespace characters from a string.
 *
 * @param {string} str - The string to remove spaces from.
 * @returns {string} The string with all whitespace removed.
 */
export function removeSpaces(str: string): string {
  return str.replaceAll(/\s/g, '');
}
