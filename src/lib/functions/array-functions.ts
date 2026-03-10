/**
 * Array operations (non-higher-order)
 */
export const arrayFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns the sum of all elements in an array */
  sum: (array: unknown): number => {
    if (!Array.isArray(array)) return 0;
    return array.reduce((acc: number, val) => acc + Number(val || 0), 0);
  },

  /** Returns the average of all elements in an array */
  avg: (array: unknown): number => {
    if (!Array.isArray(array) || array.length === 0) return 0;
    const total = array.reduce((acc: number, val) => acc + Number(val || 0), 0);
    return total / array.length;
  },

  /** Returns true if the array contains the value */
  arrayContains: (array: unknown, value: unknown): boolean => {
    return Array.isArray(array) ? array.includes(value) : false;
  },

  /** Returns a sub-array from start to end */
  slice: (
    array: unknown,
    start: unknown,
    end?: unknown,
  ): readonly unknown[] => {
    if (!Array.isArray(array)) return [];
    const s = Number(start) || 0;
    return end !== undefined && end !== null
      ? array.slice(s, Number(end))
      : array.slice(s);
  },

  /** Joins array elements with a separator */
  join: (array: unknown, separator: unknown): string => {
    if (!Array.isArray(array)) return '';
    return array.join(separator !== undefined ? String(separator) : ',');
  },

  /** Returns the median value of a numeric array */
  median: (array: unknown): number | null => {
    if (!Array.isArray(array) || array.length === 0) return null;
    const sorted = array.map(Number).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  /** Returns the standard deviation of a numeric array */
  stddev: (array: unknown): number | null => {
    if (!Array.isArray(array) || array.length === 0) return null;
    const nums = array.map(Number);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance =
      nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length;
    return Math.sqrt(variance);
  },

  /** Returns the variance of a numeric array */
  variance: (array: unknown): number | null => {
    if (!Array.isArray(array) || array.length === 0) return null;
    const nums = array.map(Number);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return (
      nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length
    );
  },

  /** Returns the value at the given percentile (0-100) */
  percentile: (array: unknown, p: unknown): number | null => {
    if (!Array.isArray(array) || array.length === 0) return null;
    const pct = Number(p);
    if (isNaN(pct) || pct < 0 || pct > 100) return null;
    const sorted = array.map(Number).sort((a, b) => a - b);
    const index = (pct / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  },

  /** Returns a new array with duplicate values removed */
  unique: (array: unknown): readonly unknown[] => {
    if (!Array.isArray(array)) return [];
    return [...new Set(array)];
  },

  /** Returns a new array with null, undefined, and empty string values removed */
  compact: (array: unknown): readonly unknown[] => {
    if (!Array.isArray(array)) return [];
    return array.filter((v) => v !== null && v !== undefined && v !== '');
  },

  /** Returns the first element of an array */
  first: (array: unknown): unknown => {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[0];
  },

  /** Returns the last element of an array */
  last: (array: unknown): unknown => {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[array.length - 1];
  },

  /** Flattens a nested array by the given depth (default 1) */
  flat: (array: unknown, depth?: unknown): readonly unknown[] => {
    if (!Array.isArray(array)) return [];
    const d = depth !== undefined && depth !== null ? Number(depth) : 1;
    const maxDepth = Number.isInteger(d) && d >= 0 ? d : 1;

    const flatten = (arr: unknown[], currentDepth: number): unknown[] => {
      const result: unknown[] = [];
      for (const item of arr) {
        if (Array.isArray(item) && currentDepth < maxDepth) {
          result.push(...flatten(item, currentDepth + 1));
        } else {
          result.push(item);
        }
      }
      return result;
    };

    return flatten(array, 0);
  },

  /** Generates an array of numbers from start to end (exclusive) with optional step */
  range: (start: unknown, end: unknown, step?: unknown): readonly number[] => {
    const s = Number(start);
    const e = Number(end);
    const st =
      step !== undefined && step !== null ? Number(step) : e >= s ? 1 : -1;
    if (isNaN(s) || isNaN(e) || isNaN(st) || st === 0) return [];
    if ((st > 0 && s >= e) || (st < 0 && s <= e)) return [];
    const maxLen = 10000;
    const result: number[] = [];
    let i = s;
    while (st > 0 ? i < e : i > e) {
      if (result.length >= maxLen) break;
      result.push(i);
      i += st;
    }
    return result;
  },

  /** Splits an array into chunks of the given size */
  chunk: (array: unknown, size: unknown): readonly unknown[] => {
    if (!Array.isArray(array)) return [];
    const n = Number(size);
    if (!Number.isInteger(n) || n <= 0) return [];
    const result: unknown[][] = [];
    for (let i = 0; i < array.length; i += n) {
      result.push(array.slice(i, i + n));
    }
    return result;
  },

  /** Pairs elements from two arrays */
  zip: (arr1: unknown, arr2: unknown): readonly unknown[] => {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];
    const len = Math.min(arr1.length, arr2.length);
    const result: unknown[][] = [];
    for (let i = 0; i < len; i++) {
      result.push([arr1[i], arr2[i]]);
    }
    return result;
  },

  /** Returns the count of elements, optionally matching a predicate (non-HOF: counts all) */
  count: (array: unknown): number => {
    if (!Array.isArray(array)) return 0;
    return array.length;
  },
};
