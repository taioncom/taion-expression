import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';
import { dateOperands, toDateTime } from '../src/lib/date-coercion.js';
import { ExpressionOptions } from '../src/lib/types.js';

const d = new Date('2026-10-15T12:00:00Z');
const context = {
  d,
  same: new Date('2026-10-15T12:00:00Z'),
  invalid: new Date('not a date'),
  iso: '2026-10-01',
  n: null,
};

const modes: ReadonlyArray<readonly [string, ExpressionOptions]> = [
  ['javascript', {}],
  ['spreadsheet', { semantics: 'spreadsheet' }],
];

const value = (expr: string, options: ExpressionOptions) => {
  const result = evaluateExpression(expr, context, options);
  expect(result.success).toBe(true);
  return result.success ? result.result : undefined;
};

describe.each(modes)('Date vs ISO string (%s)', (_name, options) => {
  test.each([
    ["d >= '2026-10-01'", true],
    ["d > '2026-10-01'", true],
    ["d < '2026-10-01'", false],
    ["d <= '2026-10-15T12:00:00Z'", true],
    ["d > '2026-10-20'", false],
    ["d < '2026-10-20'", true],
    ["'2026-10-01' < d", true],
    ["'2026-10-20' > d", true],
    ['d >= iso', true],
    ["d == '2026-10-15T12:00:00Z'", true],
    ["d == '2026-10-15T12:00:00.000Z'", true],
    ["d == '2026-10-15T15:00:00+03:00'", true],
    ["d == '2026-10-15T15:00:00+0300'", true],
    ["'2026-10-15T12:00:00Z' == d", true],
    ["d != '2026-10-15T12:00:00Z'", false],
    ["d == '2026-10-16'", false],
    ["d != '2026-10-16'", true],
    ['d == same', true],
    ['d != same', false],
  ])('%s is %s', (expr, expected) => {
    expect(value(expr, options)).toBe(expected);
  });

  test.each([
    ["d >= 'banana'", false],
    ["d == 'banana'", false],
    ["d != 'banana'", true],
    ["d >= '2026-13-45'", false],
    ["d <= '2026-13-45'", false],
    ["d < 'zzz'", false],
    ["invalid == '2026-10-15'", false],
  ])('a non-date string or invalid date is not a date: %s', (expr, expected) => {
    expect(value(expr, options)).toBe(expected);
  });

  test('two ISO strings still compare as text', () => {
    expect(value("'2026-10-02' > '2026-10-01'", options)).toBe(true);
    expect(value("'2026-10-01' == '2026-10-01T00:00:00Z'", options)).toBe(
      false,
    );
  });
});

describe('null with a date keeps each semantics', () => {
  test('javascript: strict equality, numeric comparison', () => {
    expect(value('d == n', {})).toBe(false);
    expect(value('d > n', {})).toBe(true);
  });

  test('spreadsheet: a comparison with null is false', () => {
    expect(value('d == n', { semantics: 'spreadsheet' })).toBe(false);
    expect(value('d > n', { semantics: 'spreadsheet' })).toBe(false);
  });
});

describe('toDateTime / dateOperands', () => {
  test.each([
    ['2026-10-15', Date.UTC(2026, 9, 15)],
    ['2026-10-15T12:00:00Z', Date.UTC(2026, 9, 15, 12)],
    ['2026-10-15 12:00:00Z', Date.UTC(2026, 9, 15, 12)],
    ['2026-10-15T12:00:00.5Z', Date.UTC(2026, 9, 15, 12, 0, 0, 500)],
    ['2026-10-15T15:00+03:00', Date.UTC(2026, 9, 15, 12)],
  ])('%s parses', (text, time) => {
    expect(toDateTime(text)).toBe(time);
  });

  test.each(['banana', '2026', '15.10.2026', '2026-10-15x', '', 42, null])(
    '%p is not a date',
    (input) => {
      expect(toDateTime(input)).toBeNull();
    },
  );

  test('needs a Date on at least one side', () => {
    expect(dateOperands('2026-10-15', '2026-10-16')).toBeNull();
    expect(dateOperands(d, 'banana')).toBeNull();
    expect(dateOperands(d, 5)).toBeNull();
    expect(dateOperands(d, '2026-10-15T12:00:00Z')).toEqual([
      d.getTime(),
      d.getTime(),
    ]);
  });
});
