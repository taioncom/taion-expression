/**
 * Coerce a value to a Date. Accepts Date, number (timestamp), or string (ISO/date).
 * Returns null if the result is an invalid date.
 */
export const toDateValue = (value: unknown): Date | null => {
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

/**
 * Date creation, extraction, formatting, and arithmetic functions
 */
export const dateFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
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

  /** Add an amount to a date. Units: years, months, weeks, days, hours, minutes, seconds, milliseconds */
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
        if (result.getDate() !== origDay) {
          result.setDate(0);
        }
        break;
      }
      case 'months':
      case 'month': {
        const origDay = result.getDate();
        result.setMonth(result.getMonth() + n);
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

  /** Convert a value to a Date (flexible coercion) */
  toDate: (value: unknown): Date | null => {
    return toDateValue(value);
  },
};
