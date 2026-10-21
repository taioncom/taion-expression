/**
 * Date operands for comparison and equality.
 *
 * A `Date` compared with a string used to be compared with the string's
 * numeric value (always `NaN`, so every comparison was false) or, in the
 * spreadsheet semantics, with its long text form (`"Thu Oct 15 2026 ..."`).
 * When one side is a `Date` and the other a `Date` or an ISO 8601 date
 * string, both are compared by time instead.
 *
 * With a `timeZone` option, a `Date` against a date alone (`2026-10-01`)
 * compares by calendar day: the `Date` becomes its date in that zone, so
 * `createdAt >= '2026-10-01'` means "on or after October 1 there" and
 * `createdAt <= '2026-10-19'` includes the whole 19th.
 */

/**
 * ISO 8601 date (`2026-10-15`) or date-time (`2026-10-15T12:00`,
 * `2026-10-15 12:00:00.123+03:00`, `...Z`)
 */
const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** A date alone, without a time */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dayFormats = new Map<string, Intl.DateTimeFormat>();

/** Whether `timeZone` is an IANA time zone name the runtime knows */
export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
};

/** The calendar day of `time` in `timeZone`, as UTC midnight of that day */
const dayInZone = (time: number, timeZone: string): number => {
  let format = dayFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    dayFormats.set(timeZone, format);
  }
  const part = (type: string): number =>
    Number(format.formatToParts(time).find((p) => p.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day'));
};

/**
 * The time of a valid `Date` or an ISO 8601 date string, else null.
 * Strings follow `Date.parse`: a date alone is UTC midnight, a date-time
 * without an offset is local time.
 */
export const toDateTime = (value: unknown): number | null => {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === 'string' && ISO_DATE.test(value)) {
    const time = Date.parse(value.replace(' ', 'T'));
    return Number.isNaN(time) ? null : time;
  }
  return null;
};

/**
 * Both operands as times when at least one is a `Date` and the other is a
 * `Date` or an ISO 8601 date string; null otherwise (the caller compares as
 * before). With `timeZone`, a `Date` against a date alone gives both as days.
 */
export const dateOperands = (
  left: unknown,
  right: unknown,
  timeZone?: string,
): readonly [number, number] | null => {
  if (!(left instanceof Date) && !(right instanceof Date)) return null;
  const a = toDateTime(left);
  const b = toDateTime(right);
  if (a === null || b === null) return null;
  if (timeZone) {
    if (typeof right === 'string' && DATE_ONLY.test(right)) {
      return [dayInZone(a, timeZone), b];
    }
    if (typeof left === 'string' && DATE_ONLY.test(left)) {
      return [a, dayInZone(b, timeZone)];
    }
  }
  return [a, b];
};
