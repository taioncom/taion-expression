import { describe, expect, test } from '@jest/globals';
import { analyzeExpression } from '../src/lib/taion-expression.js';
import { ExpressionOptions } from '../src/lib/types.js';

const analyze = (expr: string, options: ExpressionOptions = {}) => {
  const result = analyzeExpression(expr, options);
  expect(result.success).toBe(true);
  return result.success ? result : (undefined as never);
};

describe('analyzeExpression', () => {
  test('returns the AST', () => {
    expect(analyze('a + 1').ast.type).toBe('BinaryExpression');
  });

  test('lists identifiers and member paths once, in source order', () => {
    const result = analyze(
      'user.address.city == city && user.address.city != b',
    );
    expect(result.identifiers).toEqual(['user.address.city', 'city', 'b']);
    expect(result.functions).toEqual([]);
  });

  test('lists called functions as written, not as identifiers', () => {
    const result = analyze('round(total) + Round(x) + round(y)');
    expect(result.functions).toEqual(['round', 'Round']);
    expect(result.identifiers).toEqual(['total', 'x', 'y']);
  });

  test('array indexes', () => {
    expect(analyze('items[0].price').identifiers).toEqual(['items.0.price']);
    expect(analyze('items[i].price').identifiers).toEqual(['items', 'i']);
    expect(analyze('[a, b[1]]').identifiers).toEqual(['a', 'b.1']);
  });

  test('excludes arrow parameters', () => {
    const result = analyze('map(items, x => x.price * rate)', {
      enableArrowFunctions: true,
    });
    expect(result.identifiers).toEqual(['items', 'rate']);
    expect(result.functions).toEqual(['map']);
  });

  test('nested arrows keep the outer parameter in scope', () => {
    const result = analyze('map(a, x => filter(x.items, y => y > x.min))', {
      enableArrowFunctions: true,
    });
    expect(result.identifiers).toEqual(['a']);
    expect(result.functions).toEqual(['map', 'filter']);
  });

  test('conditionals, templates, unary and member calls', () => {
    expect(
      analyze('if !flag then `Hi ${name}` else obj.fn(z)', {
        enableTemplateStrings: true,
      }).identifiers,
    ).toEqual(['flag', 'name', 'obj.fn', 'z']);
  });

  test('$ identifiers', () => {
    expect(
      analyze('ownerId = $CURRENT_USER and $record.status').identifiers,
    ).toEqual(['ownerId', '$CURRENT_USER', '$record.status']);
  });

  test('fails the same way as compilation', () => {
    const syntax = analyzeExpression('a +');
    expect(syntax.success).toBe(false);
    expect(!syntax.success && syntax.errorType).toBe('ParseError');

    const unknown = analyzeExpression('nope()', { strictFunctions: true });
    expect(!unknown.success && unknown.errorCode).toBe('UNKNOWN_FUNCTION');

    const arrays = analyzeExpression('[1]', { enableArrays: false });
    expect(!arrays.success && arrays.errorCode).toBe('ARRAY_FEATURE_DISABLED');

    const long = analyzeExpression('a'.repeat(20), { maxExpressionLength: 10 });
    expect(!long.success && long.errorCode).toBe(
      'MAX_EXPRESSION_LENGTH_EXCEEDED',
    );
  });
});
