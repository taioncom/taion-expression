/**
 * Date operands for comparison and equality.
 *
 * A `Date` compared with a string used to be compared with the string's
 * numeric value (always `NaN`, so every comparison was false) or, in the
 * spreadsheet semantics, with its long text form (`"Thu Oct 15 2026 ..."`).
 * When one side is a `Date` and the other a `Date` or an ISO 8601 date
 * string, both are compared by time instead.
 */

/**
 * ISO 8601 date (`2026-10-15`) or date-time (`2026-10-15T12:00`,
 * `2026-10-15 12:00:00.123+03:00`, `...Z`)
 */
const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

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
 * before)
 */
export const dateOperands = (
  left: unknown,
  right: unknown,
): readonly [number, number] | null => {
  if (!(left instanceof Date) && !(right instanceof Date)) return null;
  const a = toDateTime(left);
  const b = toDateTime(right);
  return a !== null && b !== null ? [a, b] : null;
};
