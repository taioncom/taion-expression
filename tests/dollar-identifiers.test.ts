import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';

const value = (
  expr: string,
  context: Record<string, unknown> = {},
  options = {},
) => {
  const result = evaluateExpression(expr, context, options);
  expect(result.success).toBe(true);
  return result.success ? result.result : undefined;
};

describe('identifiers starting with $', () => {
  test('top-level and member paths', () => {
    expect(value('$CURRENT_USER', { $CURRENT_USER: 'u1' })).toBe('u1');
    expect(value('$record.status', { $record: { status: 'open' } })).toBe(
      'open',
    );
    expect(value('$_x + 1', { $_x: 1 })).toBe(2);
  });

  test('in comparisons', () => {
    expect(
      value('ownerId = $CURRENT_USER', { ownerId: 'u1', $CURRENT_USER: 'u1' }),
    ).toBe(true);
  });

  test('unresolved is null', () => {
    expect(value('$missing')).toBeNull();
  });

  test('a lone $ is a tokenization error', () => {
    const result = evaluateExpression('$ + 1');
    expect(result.success).toBe(false);
    expect(!result.success && result.errorType).toBe('TokenizationError');
  });

  test('template strings still interpolate', () => {
    expect(
      value(
        '`Hi ${$user.name} ${n}`',
        { $user: { name: 'Ada' }, n: 1 },
        {
          enableTemplateStrings: true,
        },
      ),
    ).toBe('Hi Ada 1');
  });
});
