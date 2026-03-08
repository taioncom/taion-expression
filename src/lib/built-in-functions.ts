import { checkSecurityLimits, EvaluatorContext } from './security.js';

/**
 * Coerce a value to a Date. Accepts Date, number (timestamp), or string (ISO/date).
 * Returns null if the result is an invalid date.
 */
const toDateValue = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// Define allowed built-in functions with their implementations
export const builtInFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  // String functions
  length: (str: unknown): number => {
    return typeof str === 'string' || Array.isArray(str) ? str.length : 0;
  },
  contains: (str: unknown, substring: unknown): boolean => {
    return typeof str === 'string' && typeof substring === 'string'
      ? str.includes(substring)
      : false;
  },
  startsWith: (str: unknown, prefix: unknown): boolean => {
    return typeof str === 'string' && typeof prefix === 'string'
      ? str.startsWith(prefix)
      : false;
  },
  endsWith: (str: unknown, suffix: unknown): boolean => {
    return typeof str === 'string' && typeof suffix === 'string'
      ? str.endsWith(suffix)
      : false;
  },
  toLowerCase: (str: unknown): string => {
    return typeof str === 'string' ? str.toLowerCase() : String(str);
  },
  toUpperCase: (str: unknown): string => {
    return typeof str === 'string' ? str.toUpperCase() : String(str);
  },
  substring: (str: unknown, start: unknown, end?: unknown): string => {
    if (typeof str !== 'string') return '';
    const s = start !== undefined && start !== null ? Number(start) : 0;
    const e = end !== undefined && end !== null ? Number(end) : str.length;
    return str.substring(isNaN(s) ? 0 : s, isNaN(e) ? str.length : e);
  },
  trim: (str: unknown): string => {
    return typeof str === 'string' ? str.trim() : String(str);
  },
  replace: (str: unknown, search: unknown, replacement: unknown): string => {
    if (typeof str !== 'string') return '';
    return str.split(String(search)).join(String(replacement));
  },
  split: (str: unknown, separator: unknown): readonly string[] => {
    if (typeof str !== 'string') return [];
    return str.split(String(separator), 10000);
  },
  indexOf: (str: unknown, search: unknown): number => {
    if (typeof str !== 'string' || typeof search !== 'string') return -1;
    return str.indexOf(search);
  },
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
  padLeft: (value: unknown, len: unknown, pad?: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    const n = Number(len) || 0;
    const p = typeof pad === 'string' ? pad : ' ';
    return s.padStart(n, p);
  },
  padRight: (value: unknown, len: unknown, pad?: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    const n = Number(len) || 0;
    const p = typeof pad === 'string' ? pad : ' ';
    return s.padEnd(n, p);
  },

  // Math functions
  min: (...args: readonly unknown[]): number => {
    return Math.min(...args.map(Number));
  },
  max: (...args: readonly unknown[]): number => {
    return Math.max(...args.map(Number));
  },
  round: (num: unknown, decimals?: unknown): number => {
    const n = Number(num);
    const d =
      decimals !== undefined && decimals !== null ? Number(decimals) : 0;
    if (d === 0) return Math.round(n);
    const factor = Math.pow(10, d);
    return Math.round(n * factor) / factor;
  },
  floor: (num: unknown): number => {
    return Math.floor(Number(num));
  },
  ceil: (num: unknown): number => {
    return Math.ceil(Number(num));
  },
  abs: (num: unknown): number => {
    return Math.abs(Number(num));
  },

  // Array functions
  sum: (array: unknown): number => {
    if (!Array.isArray(array)) return 0;
    return array.reduce((acc: number, val) => acc + Number(val || 0), 0);
  },
  avg: (array: unknown): number => {
    if (!Array.isArray(array) || array.length === 0) return 0;
    const sum = array.reduce((acc: number, val) => acc + Number(val || 0), 0);
    return sum / array.length;
  },
  arrayContains: (array: unknown, value: unknown): boolean => {
    return Array.isArray(array) ? array.includes(value) : false;
  },
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

  // Enhanced array functions
  map: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];
    if (typeof fn !== 'function') return array;

    try {
      const mapFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.map((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return mapFn(val, i, arr);
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return [];
    }
  },

  filter: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];
    if (typeof fn !== 'function') return array;

    try {
      const filterFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.filter((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(filterFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return [];
    }
  },

  find: (contextObj: unknown, array: unknown, fn: unknown): unknown => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return null;
    if (typeof fn !== 'function') return null;

    try {
      const findFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      const result = array.find((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(findFn(val, i, arr));
      });
      return result === undefined ? null : result;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  },

  reduce: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
    initialValue?: unknown,
  ): unknown => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return null;
    if (typeof fn !== 'function') return array;

    try {
      const reduceFn = fn as (
        acc: unknown,
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      const reducer = (
        acc: unknown,
        val: unknown,
        i: number,
        arr: unknown[],
      ) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return reduceFn(acc, val, i, arr);
      };

      return initialValue !== undefined
        ? array.reduce(reducer, initialValue)
        : array.reduce(reducer);
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  },

  every: (contextObj: unknown, array: unknown, fn: unknown): boolean => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return false;
    if (typeof fn !== 'function') return false;

    try {
      const everyFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.every((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(everyFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return false;
    }
  },

  some: (contextObj: unknown, array: unknown, fn: unknown): boolean => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return false;
    if (typeof fn !== 'function') return false;

    try {
      const someFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.some((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(someFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return false;
    }
  },

  join: (array: unknown, separator: unknown): string => {
    if (!Array.isArray(array)) return '';
    return array.join(separator !== undefined ? String(separator) : ',');
  },

  sort: (contextObj: unknown, array: unknown): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];

    // Check iteration limit (sort is O(n log n))
    context.securityContext.loopIterations.value += array.length;
    const limitError = checkSecurityLimits(
      context.securityContext,
      context.options,
    );
    if (limitError) throw limitError;

    // Create a copy to avoid mutating the original
    const copy = [...array];

    // Default sort converts to strings, which isn't great for numbers
    // Let's do a smarter default sort
    return copy.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      const strA = String(a);
      const strB = String(b);
      return strA.localeCompare(strB);
    });
  },

  reverse: (contextObj: unknown, array: unknown): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];

    // Check iteration limit
    context.securityContext.loopIterations.value += array.length;
    const limitError = checkSecurityLimits(
      context.securityContext,
      context.options,
    );
    if (limitError) throw limitError;

    // Create a copy to avoid mutating the original
    const copy = [...array];
    return copy.reverse();
  },

  // Object functions
  keys: (obj: unknown): readonly string[] => {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.keys(obj);
  },

  values: (obj: unknown): readonly unknown[] => {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.values(obj);
  },

  // Type checking
  type: (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  },

  // Type checking
  isNull: (value: unknown): boolean => value === null,
  isUndefined: (value: unknown): boolean => value === undefined,
  isDefined: (value: unknown): boolean => value !== null && value !== undefined,
  isNumber: (value: unknown): boolean =>
    typeof value === 'number' && !isNaN(value),
  isString: (value: unknown): boolean => typeof value === 'string',
  isBoolean: (value: unknown): boolean => typeof value === 'boolean',
  isObject: (value: unknown): boolean =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date),
  isArray: (value: unknown): boolean => Array.isArray(value),
  isEmpty: (value: unknown): boolean =>
    value === null || value === undefined || value === '',

  // Conversion functions
  toString: (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  },
  toNumber: (value: unknown): number | null => {
    if (typeof value === 'number') return value;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  // Utility functions
  coalesce: (...args: readonly unknown[]): unknown => {
    for (const arg of args) {
      if (arg !== null && arg !== undefined) return arg;
    }
    return null;
  },

  // Random functions
  random: (): number => {
    return Math.random();
  },
  randomInt: (min: unknown, max: unknown): number => {
    const lo = Math.ceil(Number(min));
    const hi = Math.floor(Number(max));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },

  // Regex functions (with ReDoS protection via length limits)
  regexTest: (str: unknown, pattern: unknown): boolean => {
    if (typeof str !== 'string' || typeof pattern !== 'string') return false;
    if (pattern.length > 200 || str.length > 100000) return false;
    try {
      return new RegExp(pattern).test(str);
    } catch {
      return false;
    }
  },
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

  // Date functions

  /** Returns the current date/time */
  now: (): Date => new Date(),

  /** Create a Date from components (month is 1-based) */
  date: (
    y: unknown,
    m: unknown,
    d: unknown,
    h?: unknown,
    min?: unknown,
    s?: unknown,
    ms?: unknown,
  ): Date | null => {
    const yr = Number(y);
    const mo = Number(m);
    const dy = Number(d);
    if (isNaN(yr) || isNaN(mo) || isNaN(dy)) return null;
    const result = new Date(
      yr,
      mo - 1,
      dy,
      Number(h) || 0,
      Number(min) || 0,
      Number(s) || 0,
      Number(ms) || 0,
    );
    if (yr >= 0 && yr < 100) result.setFullYear(yr);
    return isNaN(result.getTime()) ? null : result;
  },

  /** Parse an ISO/date string into a Date */
  parseDate: (str: unknown): Date | null => {
    if (typeof str !== 'string') return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  },

  /** Returns true if the value is a valid Date instance */
  isDate: (value: unknown): boolean =>
    value instanceof Date && !isNaN(value.getTime()),

  /** Returns the full year (local time) */
  year: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getFullYear() : null;
  },

  /** Returns the month 1-12 (local time) */
  month: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getMonth() + 1 : null;
  },

  /** Returns the day of the month (local time) */
  day: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getDate() : null;
  },

  /** Returns the hour 0-23 (local time) */
  hour: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getHours() : null;
  },

  /** Returns the minute 0-59 (local time) */
  minute: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getMinutes() : null;
  },

  /** Returns the second 0-59 (local time) */
  second: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getSeconds() : null;
  },

  /** Returns the day of the week 0=Sunday, 6=Saturday (local time) */
  dayOfWeek: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getDay() : null;
  },

  /** Returns milliseconds since epoch */
  timestamp: (value: unknown): number | null => {
    const d = toDateValue(value);
    return d ? d.getTime() : null;
  },

  /** Format a date using a simple token pattern. Default: yyyy-MM-dd */
  formatDate: (value: unknown, pattern?: unknown): string | null => {
    const d = toDateValue(value);
    if (!d) return null;
    const fmt = typeof pattern === 'string' ? pattern : 'yyyy-MM-dd';
    const tokens: ReadonlyArray<readonly [string, string]> = [
      ['yyyy', String(d.getFullYear()).padStart(4, '0')],
      ['yy', String(d.getFullYear()).slice(-2)],
      ['SSS', String(d.getMilliseconds()).padStart(3, '0')],
      ['MM', String(d.getMonth() + 1).padStart(2, '0')],
      ['dd', String(d.getDate()).padStart(2, '0')],
      ['HH', String(d.getHours()).padStart(2, '0')],
      ['mm', String(d.getMinutes()).padStart(2, '0')],
      ['ss', String(d.getSeconds()).padStart(2, '0')],
    ];
    let result = fmt;
    for (const [token, replacement] of tokens) {
      result = result.split(token).join(replacement);
    }
    return result;
  },

  /** Returns an ISO 8601 string (UTC) */
  toISOString: (value: unknown): string | null => {
    const d = toDateValue(value);
    return d ? d.toISOString() : null;
  },

  /** Add an amount to a date. Units: years, months, days, hours, minutes, seconds, milliseconds */
  dateAdd: (value: unknown, amount: unknown, unit: unknown): Date | null => {
    const d = toDateValue(value);
    if (!d) return null;
    const n = Number(amount);
    if (isNaN(n)) return null;
    const u = typeof unit === 'string' ? unit.toLowerCase() : '';
    const result = new Date(d.getTime());
    switch (u) {
      case 'years':
      case 'year': {
        const origDay = result.getDate();
        result.setFullYear(result.getFullYear() + n);
        // Clamp: if the day overflowed into the next month, snap to last day
        if (result.getDate() !== origDay) {
          result.setDate(0);
        }
        break;
      }
      case 'months':
      case 'month': {
        const origDay = result.getDate();
        result.setMonth(result.getMonth() + n);
        // Clamp overflow
        if (result.getDate() !== origDay) {
          result.setDate(0);
        }
        break;
      }
      case 'weeks':
      case 'week':
        result.setDate(result.getDate() + n * 7);
        break;
      case 'days':
      case 'day':
        result.setDate(result.getDate() + n);
        break;
      case 'hours':
      case 'hour':
        result.setTime(result.getTime() + n * 3600000);
        break;
      case 'minutes':
      case 'minute':
        result.setTime(result.getTime() + n * 60000);
        break;
      case 'seconds':
      case 'second':
        result.setTime(result.getTime() + n * 1000);
        break;
      case 'milliseconds':
      case 'millisecond':
        result.setTime(result.getTime() + n);
        break;
      default:
        return null;
    }
    return result;
  },

  /** Difference between two dates in the given unit. Positive if d1 > d2. Truncates partial units. */
  dateDiff: (
    value1: unknown,
    value2: unknown,
    unit: unknown,
  ): number | null => {
    const d1 = toDateValue(value1);
    const d2 = toDateValue(value2);
    if (!d1 || !d2) return null;
    const u = typeof unit === 'string' ? unit.toLowerCase() : '';
    const diffMs = d1.getTime() - d2.getTime();
    switch (u) {
      case 'years':
      case 'year': {
        let months =
          (d1.getFullYear() - d2.getFullYear()) * 12 +
          (d1.getMonth() - d2.getMonth());
        if (d1.getDate() < d2.getDate()) months -= Math.sign(months);
        return Math.trunc(months / 12);
      }
      case 'months':
      case 'month': {
        let months =
          (d1.getFullYear() - d2.getFullYear()) * 12 +
          (d1.getMonth() - d2.getMonth());
        if (d1.getDate() < d2.getDate()) months -= Math.sign(months);
        return months;
      }
      case 'weeks':
      case 'week':
        return Math.trunc(diffMs / (7 * 86400000));
      case 'days':
      case 'day':
        return Math.trunc(diffMs / 86400000);
      case 'hours':
      case 'hour':
        return Math.trunc(diffMs / 3600000);
      case 'minutes':
      case 'minute':
        return Math.trunc(diffMs / 60000);
      case 'seconds':
      case 'second':
        return Math.trunc(diffMs / 1000);
      case 'milliseconds':
      case 'millisecond':
        return diffMs;
      default:
        return null;
    }
  },

  /** Truncate a date to midnight (00:00:00.000) */
  startOfDay: (value: unknown): Date | null => {
    const d = toDateValue(value);
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  /** Set a date to end of day (23:59:59.999) */
  endOfDay: (value: unknown): Date | null => {
    const d = toDateValue(value);
    if (!d) return null;
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999,
    );
  },

  /** First day of month at midnight */
  startOfMonth: (value: unknown): Date | null => {
    const d = toDateValue(value);
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },

  /** Last day of month at 23:59:59.999 */
  endOfMonth: (value: unknown): Date | null => {
    const d = toDateValue(value);
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  },

  /** Inclusive range check: start <= date <= end */
  dateBetween: (value: unknown, start: unknown, end: unknown): boolean => {
    const d = toDateValue(value);
    const s = toDateValue(start);
    const e = toDateValue(end);
    if (!d || !s || !e) return false;
    return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
  },
};
