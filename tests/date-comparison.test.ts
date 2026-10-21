import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';
import {
  createDayFormat,
  dateOperands,
  toDateTime,
} from '../src/lib/date-coercion.js';
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
  ])(
    'a non-date string or invalid date is not a date: %s',
    (expr, expected) => {
      expect(value(expr, options)).toBe(expected);
    },
  );

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

  test.each([
    'banana',
    '2026',
    '15.10.2026',
    '2026-10-15x',
    '',
    42,
    null,
    '2026-02-30',
    '2026-02-29',
    '2026-04-31',
    '2026-00-10',
    '2026-10-00',
    '2026-02-30T12:00:00Z',
  ])('%p is not a date', (input) => {
    expect(toDateTime(input)).toBeNull();
  });

  test('leap days and years 0-99 parse', () => {
    expect(toDateTime('2028-02-29')).toBe(Date.UTC(2028, 1, 29));
    expect(toDateTime('0050-12-31')).toBe(
      new Date(0).setUTCFullYear(50, 11, 31),
    );
  });

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

describe.each(modes)(
  'timeZone: Date against a date alone (%s)',
  (_name, base) => {
    // 2026-10-01 01:00 in Helsinki (UTC+3) is 2026-09-30 22:00 UTC
    const ctx = {
      early: new Date('2026-09-30T22:00:00Z'),
      late: new Date('2026-10-19T20:59:00Z'),
    };
    const helsinki = { ...base, timeZone: 'Europe/Helsinki' };
    const run = (expr: string, options: ExpressionOptions) => {
      const result = evaluateExpression(expr, ctx, options);
      expect(result.success).toBe(true);
      return result.success ? result.result : undefined;
    };

    test.each([
      ["early >= '2026-10-01'", true],
      ["early < '2026-10-01'", false],
      ["early == '2026-10-01'", true],
      ["early != '2026-09-30'", true],
      ["'2026-10-01' <= early", true],
      ["late <= '2026-10-19'", true],
      ["late < '2026-10-20'", true],
      ["late > '2026-10-19'", false],
    ])('Helsinki: %s is %s', (expr, expected) => {
      expect(run(expr, helsinki)).toBe(expected);
    });

    test('without timeZone the date alone is UTC midnight', () => {
      expect(run("early >= '2026-10-01'", base)).toBe(false);
      expect(run("late <= '2026-10-19'", base)).toBe(false);
    });

    test('an ISO date-time string with Z or an offset is an exact time too', () => {
      const text = {
        at: '2026-09-30T22:00:00.000Z',
        off: '2026-10-01T01:00+03:00',
      };
      const go = (expr: string) => {
        const result = evaluateExpression(expr, text, helsinki);
        return result.success ? result.result : undefined;
      };
      expect(go("at >= '2026-10-01'")).toBe(true);
      expect(go("at == '2026-10-01'")).toBe(true);
      expect(go("'2026-10-01' == at")).toBe(true);
      expect(go("off <= '2026-10-01'")).toBe(true);
      // without an offset it is not an exact time: compares as text
      expect(go("'2026-10-01T01:00' > '2026-10-01'")).toBe(true);
      expect(go("'2026-10-01T01:00' == '2026-10-01'")).toBe(false);
      // two exact times still compare as text
      expect(go("at < '2026-10-01T00:00:00.000Z'")).toBe(true);
      // without timeZone: text as before
      const plain = evaluateExpression("at >= '2026-10-01'", text, base);
      expect(plain.success && plain.result).toBe(false);
    });

    test('a date-time string still compares as an exact time', () => {
      expect(run("early < '2026-10-01T00:00:00Z'", helsinki)).toBe(true);
      expect(run("early == '2026-10-01T01:00:00+03:00'", helsinki)).toBe(true);
    });

    test('UTC zone matches the default', () => {
      expect(run("early >= '2026-10-01'", { ...base, timeZone: 'UTC' })).toBe(
        false,
      );
    });

    test('an unknown zone fails compilation', () => {
      const result = evaluateExpression("early >= '2026-10-01'", ctx, {
        ...base,
        timeZone: 'Mars/Olympus',
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errorCode).toBe('INVALID_TIME_ZONE');
    });
  },
);

describe('dateOperands with timeZone', () => {
  test('only a date alone becomes a day', () => {
    const t = new Date('2026-09-30T22:00:00Z');
    const helsinki = createDayFormat('Europe/Helsinki');
    expect(dateOperands(t, '2026-10-01', helsinki)).toEqual([
      Date.UTC(2026, 9, 1),
      Date.UTC(2026, 9, 1),
    ]);
    expect(dateOperands(t, t, helsinki)).toEqual([t.getTime(), t.getTime()]);
  });
});

describe('calendar edge cases', () => {
  test.each([
    ['javascript', {}],
    ['spreadsheet', { semantics: 'spreadsheet' }],
  ] as const)('an impossible day is not a date (%s)', (_name, options) => {
    const march2 = { d: new Date('2026-03-02T00:00:00Z') };
    const run = (expr: string, extra: ExpressionOptions = {}) => {
      const result = evaluateExpression(expr, march2, { ...options, ...extra });
      return result.success ? result.result : undefined;
    };
    expect(run("d == '2026-02-30'")).toBe(false);
    expect(run("d == '2026-02-30'", { timeZone: 'UTC' })).toBe(false);
    expect(run("d > '2026-02-30'", { timeZone: 'UTC' })).toBe(false);
  });

  test('years 0-99 with timeZone', () => {
    const ctx = { d: new Date(new Date(0).setUTCFullYear(50, 5, 1)) };
    const run = (expr: string) => {
      const result = evaluateExpression(expr, ctx, { timeZone: 'UTC' });
      return result.success ? result.result : undefined;
    };
    expect(run("d <= '0050-12-31'")).toBe(true);
    expect(run("d >= '0050-01-01'")).toBe(true);
    expect(run("d == '0050-06-01'")).toBe(true);
  });
});
