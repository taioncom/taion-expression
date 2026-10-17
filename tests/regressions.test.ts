import { describe, expect, test } from '@jest/globals';
import { compileExpression, evaluateExpression } from '../src/index.js';

const ok = (expression: string, context = {}, options = {}): unknown => {
  const result = evaluateExpression(expression, context, options);
  if (!result.success) throw result.error;
  return result.result;
};

const errorCode = (
  expression: string,
  context = {},
  options = {},
): string | null => {
  const result = evaluateExpression(expression, context, options);
  return result.success ? null : result.errorCode;
};

describe('null literal', () => {
  test('evaluates to null, not the string "null"', () => {
    expect(ok('null')).toBeNull();
    expect(ok('isNull(null)')).toBe(true);
    expect(ok('x == null', { x: null })).toBe(true);
    expect(ok('coalesce(null, 1)')).toBe(1);
    expect(ok('null + 1')).toBe(1);
  });
});

describe('large and deeply nested input', () => {
  test('long operator chains parse without stack overflow', () => {
    const expression = Array(3000).fill('1').join('+');
    const result = compileExpression(expression, { maxComplexity: 1e6 });
    expect(result.success).toBe(true);
  });

  test('long string literals tokenize without stack overflow', () => {
    const literal = `"${'x'.repeat(50000)}"`;
    expect(
      ok(`length(${literal})`, {}, { maxExpressionLength: 0 }),
    ).toBe(50000);
  });

  test('deep nesting returns a failure result instead of throwing', () => {
    const expression = '('.repeat(5000) + '1' + ')'.repeat(5000);
    expect(errorCode(expression, {}, { maxExpressionLength: 0 })).toBe(
      'MAX_NESTING_EXCEEDED',
    );
  });

  test('maxExpressionLength rejects long expressions', () => {
    expect(errorCode('1 + 1', {}, { maxExpressionLength: 3 })).toBe(
      'MAX_EXPRESSION_LENGTH_EXCEEDED',
    );
  });
});

describe('regex safety', () => {
  test('nested quantifiers are rejected without running the regex', () => {
    const start = Date.now();
    expect(ok('regexTest(repeat("a", 30) + "!", "^(a+)+$")')).toBe(false);
    expect(Date.now() - start).toBeLessThan(500);
  });

  test('backreferences are rejected', () => {
    expect(ok('regexTest("aa", "(a)\\\\1")')).toBe(false);
  });

  test('quantifier characters inside character classes are allowed', () => {
    expect(ok('regexTest("+1", "^([+-]\\\\d)+$")')).toBe(true);
  });
});

describe('property access policy', () => {
  const context = { secret: 's', user: { name: 'a', password: 'p' } };

  test('bracket access honours path-specific denials', () => {
    expect(
      errorCode('user["password"]', context, {
        deniedProperties: ['user.password'],
      }),
    ).toBe('PROPERTY_ACCESS_DENIED');
  });

  test('top-level identifiers honour denials', () => {
    expect(errorCode('secret', context, { deniedProperties: ['secret'] })).toBe(
      'PROPERTY_ACCESS_DENIED',
    );
  });

  test('allowlisted child does not expose its parent object', () => {
    const options = { allowedProperties: ['user.name'] };
    expect(ok('user.name', context, options)).toBe('a');
    expect(errorCode('user', context, options)).toBe('PROPERTY_ACCESS_DENIED');
    expect(errorCode('values(user)', context, options)).toBe(
      'PROPERTY_ACCESS_DENIED',
    );
  });

  test('built-in functions work with an allowlist', () => {
    expect(
      ok('toUpperCase(user.name)', context, {
        allowedProperties: ['user.name'],
      }),
    ).toBe('A');
  });

  test('empty allowlist allows everything', () => {
    expect(ok('user.name', context, { allowedProperties: [] })).toBe('a');
  });

  test('arrow parameters are not subject to the policy', () => {
    expect(
      ok('map(names, n => toUpperCase(n))', { names: ['a'] }, {
        allowedProperties: ['names'],
        enableArrowFunctions: true,
      }),
    ).toEqual(['A']);
  });

  test('prototype members are not reachable through identifiers', () => {
    expect(ok('constructor', {})).toBeNull();
    expect(ok('__proto__', {})).toBeNull();
    expect(ok('toString', {})).toBeNull();
  });
});

describe('custom functions', () => {
  test('override built-ins with the same name', () => {
    expect(ok('sum(1)', {}, { customFunctions: { sum: () => 'custom' } })).toBe(
      'custom',
    );
  });
});

describe('compile-time validation', () => {
  test('disabled features fail at compile time', () => {
    expect(compileExpression('map([1], x => x)').success).toBe(false);
    expect(compileExpression('`a`').success).toBe(false);
    expect(compileExpression('[1]', { enableArrays: false }).success).toBe(
      false,
    );
  });

  test('invalid property patterns fail at compile time', () => {
    const result = compileExpression('x', { deniedProperties: ['['] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errorCode).toBe('INVALID_REGEX_PATTERN');
  });
});

describe('operators and built-ins', () => {
  test('^ is right-associative and binds tighter than unary minus', () => {
    expect(ok('2 ^ 3 ^ 2')).toBe(512);
    expect(ok('-2 ^ 2')).toBe(-4);
    expect(ok('2 ^ -1')).toBe(0.5);
    expect(ok('2 * 3 ^ 2')).toBe(18);
    expect(ok('(-2) ^ 2')).toBe(4);
  });

  test('token values and columns exclude leading whitespace', () => {
    const result = evaluateExpression('1 + / 2');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe(
        "Unexpected token '/' at line 1, column 5",
      );
    }
  });

  test('strings compare lexicographically', () => {
    expect(ok('"a" < "b"')).toBe(true);
    expect(ok('"b" >= "a"')).toBe(true);
    expect(ok('"10" < 9')).toBe(false);
  });

  test('groupBy handles keys that exist on Object.prototype', () => {
    const result = ok('groupBy(["a", "b"], x => "constructor")', {}, {
      enableArrowFunctions: true,
    }) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['constructor']);
    expect(result.constructor).toEqual(['a', 'b']);
  });

  test('fromEntries keeps __proto__ as an own key', () => {
    expect(ok('keys(fromEntries([["__proto__", 1]]))')).toEqual(['__proto__']);
  });

  test('string output is capped', () => {
    expect(ok('length(padLeft("x", 500000000))')).toBe(1);
    expect(ok('repeat(repeat("a", 1000), 2000)')).toBe('');
    expect(
      errorCode('s + s', { s: 'x'.repeat(600000) }, { maxExpressionLength: 0 }),
    ).toBe('MAX_STRING_LENGTH_EXCEEDED');
  });
});
