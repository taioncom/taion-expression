/** One regex atom: a character class, an escaped character, or any non-group character */
const ATOM = String.raw`(?:\[(?:[^\]\\]|\\.)*\]|\\.|[^()\\[])`;

/** Matches a group containing a quantifier that is itself quantified, e.g. `(a+)+` */
const NESTED_QUANTIFIER = new RegExp(
  String.raw`\(${ATOM}*[*+}]${ATOM}*\)[*+{]`,
);

/** Matches a backreference such as `\1` */
const BACKREFERENCE = /\\[1-9]|\\k</;

/**
 * Check whether a pattern can be used safely: within the length limit and free of
 * nested quantifiers and backreferences, the usual causes of catastrophic backtracking.
 * This blocks common ReDoS shapes but is a heuristic, not a guarantee.
 */
const isSafePattern = (pattern: string): boolean =>
  pattern.length <= 200 &&
  !NESTED_QUANTIFIER.test(pattern) &&
  !BACKREFERENCE.test(pattern);

/**
 * Regex operations (with ReDoS protection via length limits and pattern checks)
 */
export const regexFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Tests if a string matches a regex pattern */
  regexTest: (str: unknown, pattern: unknown): boolean => {
    if (typeof str !== 'string' || typeof pattern !== 'string') return false;
    if (!isSafePattern(pattern) || str.length > 100000) return false;
    try {
      return new RegExp(pattern).test(str);
    } catch {
      return false;
    }
  },

  /** Returns the first match of a regex pattern in a string */
  regexMatch: (str: unknown, pattern: unknown): string | null => {
    if (typeof str !== 'string' || typeof pattern !== 'string') return null;
    if (!isSafePattern(pattern) || str.length > 100000) return null;
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
    if (!isSafePattern(pattern) || str.length > 100000)
      return typeof str === 'string' ? str : '';
    try {
      return str.replace(new RegExp(pattern, 'g'), String(replacement));
    } catch {
      return typeof str === 'string' ? str : '';
    }
  },
};
