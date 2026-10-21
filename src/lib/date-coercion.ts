/**
 * Date operands for comparison and equality.
 *
 * A `Date` compared with a string used to be compared with the string's
 * numeric value (always `NaN`, so every comparison was false) or, in the
 * spreadsheet semantics, with its long text form (`"Thu Oct 15 2026 ..."`).
 * When one side is a `Date` and the other a `Date` or an ISO 8601 date
 * string, both are compared by time instead.
 *
 * With a `timeZone` option, an exact time (a `Date`, or an ISO date-time
 * string with `Z` or an offset) against a date alone (`2026-10-01`) compares
 * by calendar day: the time becomes its date in that zone, so
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

/** An ISO date-time with `Z` or an offset: an exact time */
const INSTANT = /(?:Z|[+-]\d{2}:?\d{2})$/;

const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' && DATE_ONLY.test(value);

const isInstant = (value: unknown): boolean =>
  value instanceof Date ||
  (typeof value === 'string' &&
    !DATE_ONLY.test(value) &&
    ISO_DATE.test(value) &&
    INSTANT.test(value));

/** Whether `timeZone` is an IANA time zone name the runtime knows */
export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    createDayFormat(timeZone);
    return true;
  } catch {
    return false;
  }
};

/**
 * A formatter giving the calendar day in `timeZone`. Created once per
 * compiled expression; throws a RangeError for an unknown zone.
 */
export const createDayFormat = (timeZone: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

/** UTC midnight of a calendar day; years 0-99 are taken literally */
const utcDay = (year: number, month: number, day: number): number =>
  new Date(0).setUTCFullYear(year, month - 1, day);

/** Whether the date part of an ISO string is a real calendar day */
const isCalendarDate = (text: string): boolean => {
  const [year, month, day] = text.slice(0, 10).split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    new Date(utcDay(year, month, day)).getUTCDate() === day
  );
};

/** The calendar day of `time` in the formatter's zone, as UTC midnight */
const dayInZone = (time: number, dayFormat: Intl.DateTimeFormat): number => {
  const parts = dayFormat.formatToParts(time);
  const part = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value);
  return utcDay(part('year'), part('month'), part('day'));
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
  if (
    typeof value === 'string' &&
    ISO_DATE.test(value) &&
    isCalendarDate(value)
  ) {
    const time = Date.parse(value.replace(' ', 'T'));
    return Number.isNaN(time) ? null : time;
  }
  return null;
};

/**
 * Both operands as times when at least one is a `Date` and the other is a
 * `Date` or an ISO 8601 date string; null otherwise (the caller compares as
 * before). With a day formatter (the `timeZone` option), an exact time
 * against a date alone gives both as days in that zone.
 */
export const dateOperands = (
  left: unknown,
  right: unknown,
  dayFormat?: Intl.DateTimeFormat,
): readonly [number, number] | null => {
  if (dayFormat) {
    const days = zonedDays(left, right, dayFormat);
    if (days) return days;
  }
  if (!(left instanceof Date) && !(right instanceof Date)) return null;
  const a = toDateTime(left);
  const b = toDateTime(right);
  return a !== null && b !== null ? [a, b] : null;
};

/** An exact time and a date alone as days in the formatter's zone, else null */
const zonedDays = (
  left: unknown,
  right: unknown,
  dayFormat: Intl.DateTimeFormat,
): readonly [number, number] | null => {
  const [instant, date, flipped] =
    isInstant(left) && isDateOnly(right)
      ? [left, right, false]
      : isInstant(right) && isDateOnly(left)
        ? [right, left, true]
        : [null, null, false];
  if (instant === null) return null;
  const time = toDateTime(instant);
  const day = toDateTime(date);
  if (time === null || day === null) return null;
  const zoned = dayInZone(time, dayFormat);
  return flipped ? [day, zoned] : [zoned, day];
};
