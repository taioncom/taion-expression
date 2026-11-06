import { describe, expect, test } from '@jest/globals';
import { describeFunctions } from '../src/lib/catalog.js';
import {
  analyzeExpression,
  compileExpression,
  evaluateExpression,
} from '../src/lib/taion-expression.js';
import { ExpressionOptions, FunctionCall } from '../src/lib/types.js';

type Row = Record<string, number>;
type Window = { readonly rows: readonly Row[]; readonly index: number };

/** A field's value in a row, by path or by a lambda over the row */
const valueOf = (f: unknown, row: Row): unknown =>
  typeof f === 'function' ? (f as (r: Row) => unknown)(row) : row[f as string];

const options: ExpressionOptions = {
  strictFunctions: true,
  customFunctions: {
    RUNNINGSUM: {
      fn: (call: unknown, f: unknown) => {
        const { runtime } = call as FunctionCall;
        const { rows, index } = runtime as Window;
        return rows
          .slice(0, index + 1)
          .reduce((sum, row) => sum + Number(valueOf(f, row)), 0);
      },
      usesRuntime: true,
      params: [{ name: 'field', kind: ['field', 'lambda'] }],
      description: 'Sum of the field up to this row',
      category: 'Window',
      returns: 'number',
    },
    ROUNDTO: {
      fn: (n: unknown, places: unknown = 0) =>
        Number((n as number).toFixed(places as number)),
      params: [{ name: 'n' }, { name: 'places', optional: true }],
    },
    JOINALL: {
      fn: (...parts: readonly unknown[]) => parts.join('-'),
      params: [{ name: 'part', variadic: true }],
    },
    CONTEXTKEYS: {
      fn: (call: unknown) =>
        Object.keys((call as FunctionCall).context).join(','),
      usesRuntime: true,
      params: [],
    },
    plain: (a: unknown) => `plain:${a}`,
  },
};

const window: Window = {
  rows: [
    { amount: 100, price: 2, qty: 3 },
    { amount: 200, price: 5, qty: 1 },
    { amount: 300, price: 1, qty: 1 },
  ],
  index: 1,
};

const evaluate = (expr: string, context = {}, runtime: unknown = window) => {
  const compiled = compileExpression(expr, options);
  if (!compiled.success) throw compiled.error;
  return compiled.result.evaluate(context, runtime);
};

describe('custom function definitions', () => {
  test('a field argument is given as its path, with the runtime value', () => {
    expect(evaluate('RUNNINGSUM(amount)')).toBe(300);
  });

  test('a lambda argument is a callable, without enableArrowFunctions', () => {
    expect(evaluate('RUNNINGSUM(r => r.price * r.qty)')).toBe(11);
    // An arrow anywhere else still needs the option
    const result = compileExpression('map([1], x => x)', options);
    expect(result.success).toBe(false);
    expect(result.success ? '' : result.errorCode).toBe(
      'ARROW_FUNCTIONS_DISABLED',
    );
  });

  test('a function with usesRuntime sees the context', () => {
    expect(evaluate('CONTEXTKEYS()', { a: 1, b: 2 })).toBe('a,b');
  });

  test('the runtime is passed by evaluateExpression too', () => {
    expect(
      evaluateExpression('RUNNINGSUM(amount)', {}, options, {
        ...window,
        index: 2,
      }),
    ).toEqual({ success: true, result: 600 });
  });

  test('optional and variadic parameters', () => {
    expect(evaluate('ROUNDTO(1.256)')).toBe(1);
    expect(evaluate('ROUNDTO(1.256, 2)')).toBe(1.26);
    expect(evaluate('JOINALL(1, 2, 3)')).toBe('1-2-3');
    expect(evaluate('JOINALL()')).toBe('');
  });

  test('a plain function still works', () => {
    expect(evaluate("plain('x')")).toBe('plain:x');
  });
});

describe('compile-time checks of calls', () => {
  const failure = (expr: string) => {
    const result = compileExpression(expr, options);
    expect(result.success).toBe(false);
    return result.success ? null : result;
  };

  test('the number of arguments', () => {
    const tooMany = failure('ROUNDTO(1, 2, 3)');
    expect(tooMany?.errorCode).toBe('ARGUMENT_COUNT');
    expect(tooMany?.error.message).toContain("'ROUNDTO' takes 1 to 2");
    expect(failure('RUNNINGSUM()')?.errorCode).toBe('ARGUMENT_COUNT');
    expect(failure('CONTEXTKEYS(1)')?.errorCode).toBe('ARGUMENT_COUNT');
    expect(failure('RUNNINGSUM()')?.error.message).toContain(
      "'RUNNINGSUM' takes 1 argument, got 0",
    );
    const variadic = compileExpression('W()', {
      customFunctions: {
        W: {
          fn: () => 1,
          params: [{ name: 'a' }, { name: 'b', variadic: true }],
        },
      },
    });
    expect(variadic.success ? '' : variadic.error.message).toContain(
      "'W' takes at least 1 argument, got 0",
    );
  });

  test('a field must be a context path, with its position', () => {
    const result = failure('1 + RUNNINGSUM(amount * 2)');
    expect(result?.errorCode).toBe('INVALID_ARGUMENT');
    expect(result?.error.message).toContain(
      "'field' of 'RUNNINGSUM' must be a field name or an arrow function",
    );
    expect(result?.error.column).toBeGreaterThan(1);
    expect(failure("RUNNINGSUM('amount')")?.errorCode).toBe('INVALID_ARGUMENT');
  });

  test('a value parameter takes an arrow only where arrows are enabled', () => {
    expect(failure('ROUNDTO(x => x)')?.errorCode).toBe(
      'ARROW_FUNCTIONS_DISABLED',
    );
    expect(
      compileExpression('ROUNDTO(x => x)', {
        ...options,
        enableArrowFunctions: true,
      }).success,
    ).toBe(true);
    // A lambda-only parameter refuses a value
    expect(
      compileExpression('APPLY(1)', {
        strictFunctions: true,
        customFunctions: {
          APPLY: { fn: () => 1, params: [{ name: 'f', kind: 'lambda' }] },
        },
      }),
    ).toMatchObject({ success: false, errorCode: 'INVALID_ARGUMENT' });
  });

  test('checked in branches never evaluated', () => {
    expect(failure('false ? ROUNDTO() : 1')?.errorCode).toBe('ARGUMENT_COUNT');
  });

  test('analyze lists a field argument as an identifier, not lambda params', () => {
    const result = analyzeExpression(
      'RUNNINGSUM(order.amount) + RUNNINGSUM(r => r.qty)',
      options,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.identifiers).toEqual(['order.amount']);
      expect(result.functions).toEqual(['RUNNINGSUM']);
    }
  });

  test('case-insensitive names resolve definitions', () => {
    const result = compileExpression('runningsum(amount)', {
      ...options,
      caseInsensitiveNames: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.result.evaluate({}, window)).toBe(300);
  });
});

describe('field and lambda arguments under the security policy', () => {
  const FIELD = {
    fn: (f: unknown) => f,
    params: [{ name: 'f', kind: 'field' as const }],
  };
  const run = (expr: string, extra: ExpressionOptions = {}) => {
    const compiled = compileExpression(expr, {
      customFunctions: { FIELD },
      ...extra,
    });
    if (!compiled.success) throw compiled.error;
    return compiled.result.evaluate({});
  };

  test('a field path is checked like reading it', () => {
    expect(() => run('FIELD(__proto__)')).toThrow('not allowed');
    expect(() => run('FIELD(a.constructor)')).toThrow('not allowed');
    expect(() =>
      run('FIELD(user.password)', { deniedProperties: ['password'] }),
    ).toThrow("Access to property 'password'");
    expect(() =>
      run('FIELD(secret)', { allowedProperties: ['user.name'] }),
    ).toThrow("Access to property 'secret'");
    expect(run('FIELD(user.name)', { allowedProperties: ['user.name'] })).toBe(
      'user.name',
    );
  });

  test('a field path from an arrow parameter skips the parameter', () => {
    const compiled = compileExpression('map([1], r => FIELD(r))', {
      customFunctions: { FIELD },
      enableArrowFunctions: true,
      allowedProperties: ['x'],
    });
    expect(compiled.success && compiled.result.evaluate({})).toEqual(['r']);
  });

  test('a context function shadowing a custom one gets no lambda', () => {
    const compiled = compileExpression('f(x => 42)', {
      caseInsensitiveNames: true,
      customFunctions: {
        F: { fn: () => 1, params: [{ name: 'g', kind: 'lambda' }] },
      },
    });
    expect(compiled.success).toBe(true);
    if (compiled.success) {
      expect(() =>
        compiled.result.evaluate({ f: (g: () => unknown) => g() }),
      ).toThrow('Arrow functions are not allowed');
    }
  });
});

describe('describeFunctions', () => {
  test('lists built-ins by category and custom definitions', () => {
    const all = describeFunctions(options);
    expect(all.find((f) => f.name === 'round')).toEqual({
      name: 'round',
      source: 'builtin',
      category: 'math',
    });
    expect(all.find((f) => f.name === 'RUNNINGSUM')).toMatchObject({
      source: 'custom',
      category: 'Window',
      description: 'Sum of the field up to this row',
      returns: 'number',
    });
    expect(all.find((f) => f.name === 'plain')).toMatchObject({
      source: 'custom',
    });
    // Higher-order functions only with arrow functions enabled
    expect(all.some((f) => f.name === 'map')).toBe(false);
    expect(
      describeFunctions({ enableArrowFunctions: true }).some(
        (f) => f.name === 'map',
      ),
    ).toBe(true);
  });

  test('a custom function replaces a built-in of the same name', () => {
    const all = describeFunctions({ customFunctions: { round: () => 1 } });
    expect(all.filter((f) => f.name === 'round')).toEqual([
      expect.objectContaining({ source: 'custom' }),
    ]);
  });
});
