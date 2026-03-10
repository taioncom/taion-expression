/**
 * Type checking and conversion functions
 */
export const typeFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns the type of a value as a string */
  type: (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  },

  /** Returns true if the value is null */
  isNull: (value: unknown): boolean => value === null,

  /** Returns true if the value is undefined */
  isUndefined: (value: unknown): boolean => value === undefined,

  /** Returns true if the value is not null and not undefined */
  isDefined: (value: unknown): boolean => value !== null && value !== undefined,

  /** Returns true if the value is a finite number (not NaN) */
  isNumber: (value: unknown): boolean =>
    typeof value === 'number' && !isNaN(value),

  /** Returns true if the value is a string */
  isString: (value: unknown): boolean => typeof value === 'string',

  /** Returns true if the value is a boolean */
  isBoolean: (value: unknown): boolean => typeof value === 'boolean',

  /** Returns true if the value is a plain object (not array, not Date) */
  isObject: (value: unknown): boolean =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date),

  /** Returns true if the value is an array */
  isArray: (value: unknown): boolean => Array.isArray(value),

  /** Returns true if the value is null, undefined, or empty string */
  isEmpty: (value: unknown): boolean =>
    value === null || value === undefined || value === '',

  // Conversion functions

  /** Converts a value to a string (null/undefined become empty string) */
  toString: (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  },

  /** Converts a value to a number, or null if not convertible */
  toNumber: (value: unknown): number | null => {
    if (typeof value === 'number') return value;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  /** Converts a value to boolean using JavaScript truthiness */
  toBoolean: (value: unknown): boolean => {
    return Boolean(value);
  },

  /** Converts a value to an integer, or null if not convertible */
  toInteger: (value: unknown): number | null => {
    const num = Number(value);
    if (isNaN(num)) return null;
    return Math.trunc(num);
  },

  /** Formats a number to a fixed number of decimal places */
  toFixed: (num: unknown, digits: unknown): string => {
    const n = Number(num);
    const d = Number(digits);
    if (isNaN(n)) return 'NaN';
    const dec = Number.isInteger(d) && d >= 0 && d <= 100 ? d : 0;
    return n.toFixed(dec);
  },

  /** Parses an integer from a string with optional radix */
  parseInt: (str: unknown, radix?: unknown): number | null => {
    const s = typeof str === 'string' ? str : String(str);
    const r = radix !== undefined && radix !== null ? Number(radix) : 10;
    const result = Number.parseInt(s, r);
    return isNaN(result) ? null : result;
  },

  /** Parses a floating-point number from a string */
  parseFloat: (str: unknown): number | null => {
    const s = typeof str === 'string' ? str : String(str);
    const result = Number.parseFloat(s);
    return isNaN(result) ? null : result;
  },
};
