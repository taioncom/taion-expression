import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';
import { toSpreadsheetNumber } from '../src/lib/spreadsheet-semantics.js';
import { ExpressionOptions } from '../src/lib/types.js';

const sheet: ExpressionOptions = { semantics: 'spreadsheet' };

const value = (
  expr: string,
  context: Record<string, unknown> = {},
  options: ExpressionOptions = sheet,
) => {
  const result = evaluateExpression(expr, context, options);
  expect(result.success).toBe(true);
  return result.success ? result.result : undefined;
};

describe("semantics: 'javascript' (default) is unchanged", () => {
  test.each([
    ['n + 1', { n: null }, 1],
    ['10 / 0', {}, Infinity],
    ['s + 1', { s: '5' }, '51'],
    ['s == 100', { s: '100' }, false],
    ['n > -1', { n: null }, true],
  ])('%s', (expr, context, expected) => {
    expect(value(expr, context, {})).toBe(expected);
    expect(value(expr, context, { semantics: 'javascript' })).toBe(expected);
  });
});

describe('spreadsheet: null propagates through arithmetic', () => {
  test.each([
    ['n + 1', null],
    ['1 - n', null],
    ['n * 2', null],
    ['n / 2', null],
    ['n % 2', null],
    ['n ^ 2', null],
    ['-n', null],
    ['+n', null],
    ['missing + 1', null],
    ["n + 'text'", null],
  ])('%s', (expr, expected) => {
    expect(value(expr, { n: null })).toBe(expected);
  });
});

describe('spreadsheet: division and modulo by zero', () => {
  test.each([
    ['10 / 0', null],
    ['10 % 0', null],
    ["10 / '0'", null],
    ['0 / 5', 0],
    ['7 % 4', 3],
  ])('%s', (expr, expected) => {
    expect(value(expr)).toBe(expected);
  });
});

describe('spreadsheet: numeric strings act as numbers', () => {
  const ctx = { total: '100', price: '-3.5', qty: '2' };
  test.each([
    ['total + 1', 101],
    ['price * qty', -7],
    ['total - qty', 98],
    ['total / qty', 50],
    ['qty ^ 3', 8],
    ['-price', 3.5],
    ['total == 100', true],
    ['total != 100', false],
    ["total == '100.0'", true],
    ['total > 99', true],
    ["qty < '10'", true],
    ['true + 1', 2],
  ])('%s', (expr, expected) => {
    expect(value(expr, ctx)).toBe(expected);
  });
});

describe('spreadsheet: + concatenates only with a non-numeric operand', () => {
  test.each([
    ["'a' + 'b'", 'ab'],
    ["'a' + 1", 'a1'],
    ["'5' + '5'", 10],
    ["'' + 1", '1'],
  ])('%s', (expr, expected) => {
    expect(value(expr)).toBe(expected);
  });

  test('concatenation keeps the string length cap', () => {
    const result = evaluateExpression(
      "s + 'x'",
      { s: 'a'.repeat(1_000_000) },
      sheet,
    );
    expect(result.success).toBe(false);
    expect(!result.success && result.errorCode).toBe(
      'MAX_STRING_LENGTH_EXCEEDED',
    );
  });
});

describe('spreadsheet: comparisons', () => {
  test.each([
    ["'10' < '9'", false],
    ["'apple' < 'banana'", true],
    ["'2026-01-02' >= '2026-01-01'", true],
    ['endDate >= startDate', true],
    ['n > -1', false],
    ['n < 1', false],
    ['n <= n', false],
    ["10 > 'abc'", false],
  ])('%s', (expr, expected) => {
    expect(
      value(expr, { n: null, startDate: '2026-01-01', endDate: '2026-02-01' }),
    ).toBe(expected);
  });

  test('dates compare by time', () => {
    const a = new Date('2026-01-01');
    const b = new Date('2026-01-01');
    expect(value('a == b', { a, b })).toBe(true);
    expect(value('a < c', { a, c: new Date('2026-02-01') })).toBe(true);
  });
});

describe('spreadsheet: equality is null-aware', () => {
  test.each([
    ['x == null', { x: null }, true],
    ['x == null', {}, true],
    ['x != null', { x: null }, false],
    ['x != null', { x: 0 }, true],
    ["x == ''", { x: null }, false],
    ['x == y', { x: null, y: undefined }, true],
    ["'a' == 'a'", {}, true],
  ])('%s with %j', (expr, context, expected) => {
    expect(value(expr, context)).toBe(expected);
  });
});

describe('spreadsheet: logic and other operators unchanged', () => {
  test('logical operators return operand values', () => {
    expect(value("a || 'default'", { a: null })).toBe('default');
    expect(value('a && b', { a: 1, b: 2 })).toBe(2);
    expect(value('!a', { a: 0 })).toBe(true);
  });

  test('conditionals and functions', () => {
    expect(value('if total > 50 then "high" else "low"', { total: '75' })).toBe(
      'high',
    );
    expect(value('round(total / 3, 2)', { total: '10' })).toBe(3.33);
  });
});

describe('toSpreadsheetNumber', () => {
  test.each([
    [5, 5],
    ['5', 5],
    [' 7 ', 7],
    ['', null],
    ['abc', null],
    [null, null],
    [undefined, null],
    [true, 1],
    [false, 0],
    [Infinity, null],
    [NaN, null],
  ])('%p -> %p', (input, expected) => {
    expect(toSpreadsheetNumber(input)).toBe(expected);
  });
});
