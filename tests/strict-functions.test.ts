import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
} from '../src/lib/taion-expression.js';
import { ExpressionOptions } from '../src/lib/types.js';

const strict: ExpressionOptions = { strictFunctions: true };

const failure = (expr: string, options: ExpressionOptions = strict) => {
  const result = compileExpression(expr, options);
  expect(result.success).toBe(false);
  return result.success ? null : result;
};

describe('strictFunctions: off (default)', () => {
  test('an unknown function evaluates to null', () => {
    const result = evaluateExpression('nope(1)');
    expect(result).toEqual({ success: true, result: null });
  });
});

describe('strictFunctions', () => {
  test('refuses an unknown function at compile time', () => {
    const result = failure('nope(1)');
    expect(result?.errorType).toBe('CompilationError');
    expect(result?.errorCode).toBe('UNKNOWN_FUNCTION');
    expect(result?.error.message).toContain("'nope'");
  });

  test('refuses one in a branch never evaluated', () => {
    expect(failure('if true then 1 else nope()')?.errorCode).toBe(
      'UNKNOWN_FUNCTION',
    );
    expect(failure('false && nope()')?.errorCode).toBe('UNKNOWN_FUNCTION');
    expect(failure('true ? 1 : round(nope(2))')?.errorCode).toBe(
      'UNKNOWN_FUNCTION',
    );
  });

  test('allows built-in and custom functions', () => {
    expect(compileExpression('round(1.5) + length("ab")', strict).success).toBe(
      true,
    );
    expect(
      compileExpression('greet("x")', {
        ...strict,
        customFunctions: { greet: (n) => n },
      }).success,
    ).toBe(true);
  });

  test('refuses context functions', () => {
    expect(failure('greet()')?.errorCode).toBe('UNKNOWN_FUNCTION');
  });

  test('honours caseInsensitiveNames', () => {
    expect(failure('CONCAT("a")')?.errorCode).toBe('UNKNOWN_FUNCTION');
    expect(
      compileExpression('CONCAT("a")', {
        ...strict,
        caseInsensitiveNames: true,
      }).success,
    ).toBe(true);
  });

  test('allows calling an arrow parameter', () => {
    expect(
      compileExpression('map([1], f => f(1))', {
        ...strict,
        enableArrowFunctions: true,
      }).success,
    ).toBe(true);
  });

  test('member calls are not names', () => {
    expect(compileExpression('obj.method()', strict).success).toBe(true);
  });
});
