import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';
import { ExpressionOptions } from '../src/lib/types.js';

const ci: ExpressionOptions = { caseInsensitiveNames: true };

const run = (
  expr: string,
  context: Record<string, unknown> = {},
  options: ExpressionOptions = ci,
) => evaluateExpression(expr, context, options);

const value = (
  expr: string,
  context: Record<string, unknown> = {},
  options: ExpressionOptions = ci,
) => {
  const result = run(expr, context, options);
  expect(result.success).toBe(true);
  return result.success ? result.result : undefined;
};

describe('caseInsensitiveNames: off (default)', () => {
  test('uppercase keywords are identifiers', () => {
    expect(value('TRUE', {}, {})).toBeNull();
    expect(value('NULL', { NULL: 5 }, {})).toBe(5);
    expect(run('a AND b', { a: true, b: true }, {}).success).toBe(false);
  });

  test('uppercase function names do not resolve', () => {
    expect(value("CONCAT('a', 'b')", {}, {})).toBeNull();
    expect(value("concat('a', 'b')", {}, {})).toBe('ab');
  });
});

describe('caseInsensitiveNames: keywords', () => {
  test.each([
    ['TRUE', true],
    ['False', false],
    ['NULL', null],
    ['Null', null],
  ])('%s is a literal', (expr, expected) => {
    expect(value(expr)).toBe(expected);
  });

  test('logical keywords in any case', () => {
    expect(value('a AND b', { a: true, b: false })).toBe(false);
    expect(value('a Or b', { a: false, b: 1 })).toBe(1);
    expect(value('NOT a', { a: false })).toBe(true);
    expect(value('NOT(a)', { a: true })).toBe(false);
    expect(value('a AND (b OR c)', { a: 1, b: 0, c: 2 })).toBe(2);
    expect(value('x != NULL', { x: null })).toBe(false);
  });

  test('IF THEN ELSE in any case', () => {
    expect(value('IF x > 1 THEN "big" ELSE "small"', { x: 5 })).toBe('big');
    expect(value('If x > 1 Then "big" Else "small"', { x: 0 })).toBe('small');
    expect(value('if (x > 1) then "big" else "small"', { x: 5 })).toBe('big');
  });

  test('IF( / AND( / OR( in operand position call a function', () => {
    const options: ExpressionOptions = {
      ...ci,
      customFunctions: {
        IF: (c, a, b) => (c ? a : b),
        AND: (...xs) => xs.every(Boolean),
        OR: (...xs) => xs.some(Boolean),
      },
    };
    expect(value('IF(x > 1, "big", "small")', { x: 5 }, options)).toBe('big');
    expect(value('1 + IF(true, 1, 2)', {}, options)).toBe(2);
    expect(value('AND(a, b)', { a: 1, b: 0 }, options)).toBe(false);
    expect(value('OR(a, b) AND c', { a: 0, b: 1, c: true }, options)).toBe(
      true,
    );
    // After an operand, AND is the operator even before a parenthesis
    expect(value('a AND (b)', { a: 1, b: 2 }, options)).toBe(2);
  });

  test('identifiers stay case-sensitive', () => {
    expect(value('Name', { name: 'x' })).toBeNull();
    expect(value('name', { name: 'x' })).toBe('x');
  });
});

describe('caseInsensitiveNames: functions', () => {
  test('built-ins match in any case', () => {
    expect(value("CONCAT('a', 'b')")).toBe('ab');
    expect(value("TOUPPERCASE('abc')")).toBe('ABC');
    expect(value('Round(2.5)')).toBe(3);
    expect(value('COALESCE(a, 1)', { a: null })).toBe(1);
  });

  test('exact names win over case variants', () => {
    const options: ExpressionOptions = {
      ...ci,
      customFunctions: { Len: () => 'custom', len: () => 'lower' },
    };
    expect(value('Len()', {}, options)).toBe('custom');
    expect(value('len()', {}, options)).toBe('lower');
    expect(value('LEN()', {}, options)).toBe('custom');
  });

  test('custom functions precede built-ins for case variants', () => {
    const options: ExpressionOptions = {
      ...ci,
      customFunctions: { Concat: () => 'custom' },
    };
    expect(value('CONCAT("a")', {}, options)).toBe('custom');
  });

  test('context functions are matched exactly only', () => {
    expect(value('greet()', { greet: () => 'hi' })).toBe('hi');
    expect(value('GREET()', { greet: () => 'hi' })).toBeNull();
    // An exact context function is not shadowed by a built-in case variant
    expect(value('Concat()', { Concat: () => 'ctx' })).toBe('ctx');
  });

  test('context-passing built-ins work through a case variant', () => {
    expect(
      value(
        'MAP([1, 2], x => x * 2)',
        {},
        { ...ci, enableArrowFunctions: true },
      ),
    ).toEqual([2, 4]);
  });
});
