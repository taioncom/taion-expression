/**
 * Utility, random, and general-purpose functions
 */
export const utilityFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns the first non-null/undefined argument */
  coalesce: (...args: readonly unknown[]): unknown => {
    for (const arg of args) {
      if (arg !== null && arg !== undefined) return arg;
    }
    return null;
  },

  /** Returns a random number between 0 and 1 */
  random: (): number => {
    return Math.random();
  },

  /** Returns a random integer between min and max (inclusive) */
  randomInt: (min: unknown, max: unknown): number => {
    const lo = Math.ceil(Number(min));
    const hi = Math.floor(Number(max));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },

  /** Inline conditional: returns thenVal if condition is truthy, elseVal otherwise */
  ifElse: (cond: unknown, thenVal: unknown, elseVal: unknown): unknown => {
    return cond ? thenVal : elseVal;
  },

  /** Returns value if it is not null/undefined/NaN, otherwise returns fallback */
  defaultTo: (value: unknown, fallback: unknown): unknown => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && isNaN(value)) return fallback;
    return value;
  },

  /** Serializes a value to a JSON string */
  jsonStringify: (value: unknown): string => {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  },

  /** Parses a JSON string into a value */
  jsonParse: (str: unknown): unknown => {
    if (typeof str !== 'string') return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },
};
