import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
  getCompiledCode,
} from '../src/lib/taion-expression.js';

describe('Arrow Functions with Empty Parameters', () => {
  // Test arrow function with no parameters
  test('arrow function with no parameters', () => {
    const options = {
      enableArrowFunctions: true,
    };

    const context = {
      execute: function (fn: unknown): unknown {
        if (typeof fn !== 'function') return null;

        try {
          const result = (fn as Function)();
          return result;
        } catch (e) {
          return null;
        }
      },
    };

    // Check compilation
    const expression = 'execute(() => 42)';
    const compiled = compileExpression(expression, options);
    expect((compiled as any).success).toBe(true);

    // Evaluate the expression
    const result = evaluateExpression(expression, context, options);
    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe(42);

  });
});
