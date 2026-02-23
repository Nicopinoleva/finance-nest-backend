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

/**
 * Removes all whitespace characters from a string.
 *
 * @param {string[]} texts - The array of strings to search for a pattern match.
 * @param {RegExp} pattern - The regular expression pattern to match against the texts.
 * @returns {RegExpExecArray | null} The first match found or null if no match is found.
 */
export function matchTextWithPattern(texts: string[], pattern: RegExp): RegExpExecArray | null {
  for (const text of texts) {
    const match = pattern.exec(text);
    if (match) {
      return match;
    }
  }
  return null;
}
/**
 * Searches for all matches of a given pattern in an array of strings.
 *
 * @param {string[]} texts - The array of strings to search for pattern matches.
 * @param {RegExp} pattern - The regular expression pattern to match against the texts.
 * @returns {string[]} An array of all matched strings.
 */
export function matchMultipleTextWithPattern(texts: string[], pattern: RegExp): string[] {
  const matches: string[] = [];
  for (const text of texts) {
    const match = text.match(pattern);
    if (match) {
      matches.push(...match);
    }
  }
  return matches;
}
