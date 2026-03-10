/**
 * String manipulation functions
 */
export const stringFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns the length of a string or array */
  length: (str: unknown): number => {
    return typeof str === 'string' || Array.isArray(str) ? str.length : 0;
  },

  /** Returns true if the string contains the substring */
  contains: (str: unknown, substring: unknown): boolean => {
    return typeof str === 'string' && typeof substring === 'string'
      ? str.includes(substring)
      : false;
  },

  /** Returns true if the string starts with the prefix */
  startsWith: (str: unknown, prefix: unknown): boolean => {
    return typeof str === 'string' && typeof prefix === 'string'
      ? str.startsWith(prefix)
      : false;
  },

  /** Returns true if the string ends with the suffix */
  endsWith: (str: unknown, suffix: unknown): boolean => {
    return typeof str === 'string' && typeof suffix === 'string'
      ? str.endsWith(suffix)
      : false;
  },

  /** Converts a string to lower case */
  toLowerCase: (str: unknown): string => {
    return typeof str === 'string' ? str.toLowerCase() : String(str);
  },

  /** Converts a string to upper case */
  toUpperCase: (str: unknown): string => {
    return typeof str === 'string' ? str.toUpperCase() : String(str);
  },

  /** Returns a substring between start and end indices */
  substring: (str: unknown, start: unknown, end?: unknown): string => {
    if (typeof str !== 'string') return '';
    const s = start !== undefined && start !== null ? Number(start) : 0;
    const e = end !== undefined && end !== null ? Number(end) : str.length;
    return str.substring(isNaN(s) ? 0 : s, isNaN(e) ? str.length : e);
  },

  /** Trims whitespace from both ends of a string */
  trim: (str: unknown): string => {
    return typeof str === 'string' ? str.trim() : String(str);
  },

  /** Trims whitespace from the start of a string */
  trimStart: (str: unknown): string => {
    return typeof str === 'string' ? str.replace(/^\s+/, '') : String(str);
  },

  /** Trims whitespace from the end of a string */
  trimEnd: (str: unknown): string => {
    return typeof str === 'string' ? str.replace(/\s+$/, '') : String(str);
  },

  /** Replaces all occurrences of search with replacement */
  replace: (str: unknown, search: unknown, replacement: unknown): string => {
    if (typeof str !== 'string') return '';
    return str.split(String(search)).join(String(replacement));
  },

  /** Splits a string by a separator */
  split: (str: unknown, separator: unknown): readonly string[] => {
    if (typeof str !== 'string') return [];
    return str.split(String(separator), 10000);
  },

  /** Returns the index of the first occurrence of search in str */
  indexOf: (str: unknown, search: unknown): number => {
    if (typeof str !== 'string' || typeof search !== 'string') return -1;
    return str.indexOf(search);
  },

  /** Returns the index of the last occurrence of search in str */
  lastIndexOf: (str: unknown, search: unknown): number => {
    if (typeof str !== 'string' || typeof search !== 'string') return -1;
    return str.lastIndexOf(search);
  },

  /** Capitalizes the first letter of a string, or all words */
  capitalize: (str: unknown, allWords?: unknown): string => {
    if (typeof str !== 'string' || str.length === 0) return '';
    if (allWords === true) {
      return str
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /** Pads a string on the left to reach the specified length */
  padLeft: (value: unknown, len: unknown, pad?: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    const n = Number(len) || 0;
    const p = typeof pad === 'string' ? pad : ' ';
    return s.padStart(n, p);
  },

  /** Pads a string on the right to reach the specified length */
  padRight: (value: unknown, len: unknown, pad?: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    const n = Number(len) || 0;
    const p = typeof pad === 'string' ? pad : ' ';
    return s.padEnd(n, p);
  },

  /** Repeats a string n times */
  repeat: (str: unknown, count: unknown): string => {
    if (typeof str !== 'string') return '';
    const n = Number(count);
    if (!Number.isInteger(n) || n < 0 || n > 10000) return '';
    return str.repeat(n);
  },

  /** Returns the character at the given index */
  charAt: (str: unknown, index: unknown): string => {
    if (typeof str !== 'string') return '';
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= str.length) return '';
    return str.charAt(i);
  },

  /** Alias for contains - checks if str includes search */
  includes: (strOrArray: unknown, search: unknown): boolean => {
    if (typeof strOrArray === 'string' && typeof search === 'string') {
      return strOrArray.includes(search);
    }
    if (Array.isArray(strOrArray)) {
      return strOrArray.includes(search);
    }
    return false;
  },

  /** Concatenates all arguments into a single string (null-safe) */
  concat: (...args: readonly unknown[]): string => {
    return args
      .map((a) => (a === null || a === undefined ? '' : String(a)))
      .join('');
  },
};
