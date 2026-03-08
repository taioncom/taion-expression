import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
  getCompiledCode,
} from '../src/lib/taion-expression.js';

describe('Arrow Functions with Map', () => {
  // Test arrow function used with map
  test('arrow function with custom map implementation', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
    };

    const context = {
      numbers: [1, 2, 3, 4, 5],
      // Real map function that should call the arrow function
      map: function (arr: unknown[], fn: unknown): unknown[] {
        if (!Array.isArray(arr) || typeof fn !== 'function') {
          return [];
        }

        try {
          const result = arr.map((item) => {
            try {
              const result = (fn as Function)(item);
              return result;
            } catch (e) {
              return null;
            }
          });

          return result;
        } catch (e) {
          return [];
        }
      },
    };

    // 1. Check the compiled code
    const expression = 'map(numbers, x => x * 2)';
    const compiled = compileExpression(expression, options);

    expect((compiled as any).success).toBe(true);

    // 2. Try to evaluate the expression
    const result = evaluateExpression(expression, context, options);
    expect((result as any).success).toBe(true);
    expect((result as any).result).toEqual([2, 4, 6, 8, 10]);

  });
});
