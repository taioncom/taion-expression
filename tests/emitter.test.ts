import { describe, expect, test } from '@jest/globals';
import {
  createEmitError,
  emitExpression,
  EmitArg,
  Emitter,
} from '../src/lib/emitter.js';
import { ExpressionOptions } from '../src/lib/types.js';

/** Writes the expression back as fully parenthesized text */
const printer: Emitter<string> = {
  literal: (v) => (typeof v === 'string' ? `'${v}'` : String(v)),
  identifier: (path, _node, local) => (local ? `@${path}` : path),
  unary: (op, x) => `(${op}${x})`,
  binary: (op, l, r) => `(${l} ${op} ${r})`,
  conditional: (t, a, b) => `(${t} ? ${a} : ${b})`,
  call: (name, args) =>
    `${name}(${args
      .map((a: EmitArg<string>) =>
        a.kind === 'value'
          ? a.value
          : a.kind === 'field'
            ? `[${a.path}]`
            : `(${a.params.join(', ')}) => ${a.body()}`,
      )
      .join(', ')})`,
  array: (items) => `[${items.join(', ')}]`,
};

/** A toy SQL target with a function mapping (the allowlist) */
const SQL_FUNCTIONS: Record<string, string> = { round: 'round', SUM: 'sum' };
const sql: Emitter<string> = {
  literal: (v) =>
    v === null
      ? 'NULL'
      : typeof v === 'string'
        ? `'${v.replace(/'/g, "''")}'`
        : String(v),
  identifier: (path) => `"${path}"`,
  unary: (op, x) => (op === '!' ? `NOT ${x}` : `${op}${x}`),
  binary: (op, l, r) =>
    `(${l} ${op === '&&' ? 'AND' : op === '||' ? 'OR' : op === '==' ? '=' : op} ${r})`,
  conditional: (t, a, b) => `CASE WHEN ${t} THEN ${a} ELSE ${b} END`,
  call: (name, args, node) => {
    const fn = SQL_FUNCTIONS[name];
    if (!fn) throw createEmitError(`No SQL for ${name}`, node);
    return `${fn}(${args
      .map((a) =>
        a.kind === 'value' ? a.value : a.kind === 'field' ? `"${a.path}"` : '',
      )
      .join(', ')})`;
  },
};

const options: ExpressionOptions = {
  strictFunctions: true,
  caseInsensitiveNames: true,
  customFunctions: {
    SUM: { fn: () => 0, params: [{ name: 'f', kind: ['field', 'lambda'] }] },
  },
};

const emitted = (expr: string, emitter = printer, o = options) => {
  const r = emitExpression(expr, emitter, o);
  if (!r.success) throw r.error;
  return r.result;
};

describe('emitExpression', () => {
  test('walks every node bottom-up in canonical form', () => {
    expect(emitted('a + b * 2 >= c.d and not e')).toBe(
      '(((a + (b * 2)) >= c.d) && (!e))',
    );
    expect(emitted('if x > 1 then "big" else "small"')).toBe(
      "((x > 1) ? 'big' : 'small')",
    );
    expect(emitted('x ? 1 : -y')).toBe('(x ? 1 : (-y))');
    expect(emitted('[1, 2]')).toBe('[1, 2]');
  });

  test('gives field and lambda arguments as declared', () => {
    expect(emitted('SUM(amount) + Sum(r => r.price * r.qty)')).toBe(
      '(SUM([amount]) + SUM((r) => (@r.price * @r.qty)))',
    );
  });

  test('reports what the expression references', () => {
    const r = emitExpression('round(price * qty, 2)', printer, options);
    expect(r).toMatchObject({
      success: true,
      identifiers: ['price', 'qty'],
      functions: ['round'],
    });
  });

  test('emits SQL through a target with its own function list', () => {
    expect(emitted('round(SUM(amount) / 2, 1) = 3 or x', sql)).toBe(
      '((round((sum("amount") / 2), 1) = 3) OR "x")',
    );
    expect(emitted('if a then "it\'s" else null', sql)).toBe(
      "CASE WHEN \"a\" THEN 'it''s' ELSE NULL END",
    );
  });

  test('fails with a position where the target cannot follow', () => {
    const r = emitExpression('1 +\n  upper(name)', sql, {
      ...options,
      customFunctions: { ...options.customFunctions, upper: () => '' },
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errorCode).toBe('UNSUPPORTED');
      expect(r.error.message).toContain('No SQL for upper');
      expect(r.error.line).toBe(2);
    }
    // An optional node kind left out
    const noArrays = { ...printer, array: undefined };
    const a = emitExpression('[1]', noArrays, options);
    expect(a.success ? '' : a.errorCode).toBe('UNSUPPORTED');
  });

  test('fails like compilation on invalid input', () => {
    const r = emitExpression('nope(1)', printer, options);
    expect(r.success ? '' : r.errorCode).toBe('UNKNOWN_FUNCTION');
    const c = emitExpression('SUM(1 + 2)', printer, options);
    expect(c.success ? '' : c.errorCode).toBe('INVALID_ARGUMENT');
  });
});
