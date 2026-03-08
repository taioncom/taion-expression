import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/index.js';
import { EvaluateFailure } from '../src/lib/taion-expression.js';

describe('Security Limits and Invariants', () => {
  test('maxComplexity limit is strictly enforced across large mapped arrays', () => {
    // Array of 500 items mapped over an AST node tree should trip a maxComplexity of 100 easily
    const array = Array(500).fill(1);

    const result = evaluateExpression(
      'map(arr, x => x + 1)',
      { arr: array },
      {
        enableArrays: true,
        enableArrowFunctions: true,
        maxComplexity: 100,
      },
    );

    expect(result.success).toBe(false);
    expect((result as EvaluateFailure).errorCode).toBe(
      'MAX_COMPLEXITY_EXCEEDED',
    );
  });

  test('maxLoopIterations limit is strictly enforced', () => {
    // Map array size 1500 but max loop iterations 1000
    const array = Array(1500).fill(1);

    const result = evaluateExpression(
      'map(arr, x => x + 1)',
      { arr: array },
      {
        enableArrays: true,
        enableArrowFunctions: true,
        maxLoopIterations: 1000,
        maxComplexity: 50000, // Make sure complexity doesn't trigger first
      },
    );

    expect(result.success).toBe(false);
    expect((result as EvaluateFailure).errorCode).toBe(
      'MAX_LOOP_ITERATIONS_EXCEEDED',
    );
  });

  test('prototype pollution is blocked natively via bracket array notation', () => {
    const result = evaluateExpression(
      'obj["__proto__"]',
      { obj: {} },
      {
        enableArrays: true,
        allowPrototypeAccess: false,
      },
    );

    expect(result.success).toBe(false);
    expect((result as EvaluateFailure).errorCode).toBe(
      'PROPERTY_ACCESS_DENIED',
    );
  });

  test('toString() on empty objects is properly blocked under default settings', () => {
    const result = evaluateExpression(
      'obj.toString',
      { obj: {} },
      {
        allowPrototypeAccess: false,
      },
    );

    // Fails not gracefully but via strict return of NULL on property lookup due to 'in' vs 'hasOwnProperty'
    expect(result.success).toBe(true);
    expect((result as any).result).toBeNull();
  });

  test('recursive mapped arrays appropriately bubble CompilationErrors out rather than returning empty arrays', () => {
    const array = [1, 2, 3];
    const result = evaluateExpression(
      'map(arr, x => obj["__proto__"])',
      { arr: array, obj: {} },
      {
        enableArrays: true,
        enableArrowFunctions: true,
        allowPrototypeAccess: false,
      },
    );

    expect(result.success).toBe(false);
    expect((result as EvaluateFailure).errorCode).toBe(
      'PROPERTY_ACCESS_DENIED',
    );
  });
});
