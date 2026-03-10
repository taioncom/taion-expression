/**
 * Regex operations (with ReDoS protection via length limits)
 */
export const regexFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Tests if a string matches a regex pattern */
  regexTest: (str: unknown, pattern: unknown): boolean => {
    if (typeof str !== 'string' || typeof pattern !== 'string') return false;
    if (pattern.length > 200 || str.length > 100000) return false;
    try {
      return new RegExp(pattern).test(str);
    } catch {
      return false;
    }
  },

  /** Returns the first match of a regex pattern in a string */
  regexMatch: (str: unknown, pattern: unknown): string | null => {
    if (typeof str !== 'string' || typeof pattern !== 'string') return null;
    if (pattern.length > 200 || str.length > 100000) return null;
    try {
      const match = str.match(new RegExp(pattern));
      return match ? match[0] : null;
    } catch {
      return null;
    }
  },

  /** Replaces all occurrences of a regex pattern in a string */
  regexReplace: (
    str: unknown,
    pattern: unknown,
    replacement: unknown,
  ): string => {
    if (typeof str !== 'string' || typeof pattern !== 'string') return '';
    if (pattern.length > 200 || str.length > 100000)
      return typeof str === 'string' ? str : '';
    try {
      return str.replace(new RegExp(pattern, 'g'), String(replacement));
    } catch {
      return typeof str === 'string' ? str : '';
    }
  },
};
