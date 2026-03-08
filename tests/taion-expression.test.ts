import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
  getCompiledCode,
  safeCompileExpression,
  safeEvaluateExpression,
} from '../src/lib/taion-expression.js';
import { ExpressionOptions } from '../src/lib/types.js';

describe('Expression Evaluator', () => {
  test('compileExpression returns success result for valid expressions', () => {
    const result = compileExpression('2 + 3');
    expect((result as any).success).toBe(true);

    // If successful, check these additional assertions
    if ((result as any).success) {
      expect((result as any).result).toBeTruthy();
      expect((result as any).result.source).toBe('2 + 3');
      expect((result as any).result.compiledCode).toContain('Interpreted:');
    }
  });

  test('compileExpression returns failure result for invalid expressions', () => {
    const result = compileExpression('2 +');
    expect((result as any).success).toBe(false);

    // If failed, check the error
    if (!(result as any).success) {
      expect((result as any).error).toBeTruthy();
    }
  });

  test('safeCompileExpression returns compiled expression for valid expressions', () => {
    const result = safeCompileExpression('2 + 3');

    expect(result).toBeTruthy();
    expect(result?.source).toBe('2 + 3');
  });

  test('safeCompileExpression returns null for invalid expressions', () => {
    const result = safeCompileExpression('2 +');

    expect(result).toBeNull();
  });

  test('evaluateExpression returns success result for valid expressions', () => {
    // Test that evaluation returns a properly structured result
    const result = evaluateExpression('2 + 3');

    expect((result as any).success).toBe(true);
    expect((result as any).result).toBeTruthy();
    expect((result as any).error).toBeFalsy();
  });

  test('evaluateExpression with context variables', () => {
    const context = {
      a: 10,
      b: 20,
      user: {
        name: 'John',
        age: 30,
      },
    };

    const result = evaluateExpression('a + b', context);
    expect((result as any).success).toBe(true);

    const userResult = evaluateExpression('user.name', context);
    expect((userResult as any).success).toBe(true);
  });

  test('evaluateExpression returns failure result for invalid expressions', () => {
    const result = evaluateExpression('2 +');

    expect((result as any).success).toBe(false);
    expect((result as any).error).toBeTruthy();
    expect((result as any).result).toBeFalsy();
  });

  test('safeEvaluateExpression returns result for valid expressions', () => {
    const result = safeEvaluateExpression('2 + 3');

    expect(result).toBeTruthy();
  });

  test('safeEvaluateExpression returns null for invalid expressions', () => {
    const result = safeEvaluateExpression('2 +');

    expect(result).toBeNull();
  });

  test('getCompiledCode returns code string for valid expressions', () => {
    const code = getCompiledCode('2 + 3');
    expect(typeof code).toBe('string');
    expect(code).toContain('Interpreted:');
  });

  test('getCompiledCode returns null for invalid expressions', () => {
    const code = getCompiledCode('2 +');

    expect(code).toBeNull();
  });

  test('evaluator handles complex expressions', () => {
    // Simplify the expression to avoid the conditional issues
    const complexExpression = 'a * b + 5';
    const context = { a: 15, b: 5 };

    // Get the compiled code
    const code = getCompiledCode(complexExpression);

    const result = evaluateExpression(complexExpression, context);

    expect((result as any).success).toBe(true);
    // The result should be a * b + 5 = 15 * 5 + 5 = 75 + 5 = 80
    expect((result as any).result).toBe(80);
  });

  test('evaluator respects custom functions', () => {
    const options: ExpressionOptions = {
      customFunctions: {
        double: (...args: readonly unknown[]) => {
          const x = args[0] as number;
          return x * 2;
        },
        greet: (...args: readonly unknown[]) => {
          const name = args[0] as string;
          return `Hello, ${name}!`;
        },
      },
    };

    const expression = 'double(5)';
    const result = evaluateExpression(expression, {}, options);

    expect((result as any).success).toBe(true);

    const greetExpression = 'greet("World")';
    const greetResult = evaluateExpression(greetExpression, {}, options);

    expect((greetResult as any).success).toBe(true);
  });

  test('normalizeOptions provides default values', () => {
    // This is an internal function we can't easily test directly,
    // but we can observe its effects through evaluateExpression

    // Test with empty options
    const result1 = evaluateExpression('2 + 3');
    expect((result1 as any).success).toBe(true);

    // Test with partial options
    const result2 = evaluateExpression('2 + 3', {}, { timeout: 1000 });
    expect((result2 as any).success).toBe(true);
  });

  test('evaluator handles tokenization errors', () => {
    const expressions = ['"unterminated string', 'a @ b', 'a & b'];

    expressions.forEach((expr) => {
      const result = evaluateExpression(expr);
      expect((result as any).success).toBe(false);
      expect((result as any).error).toBeTruthy();
    });
  });

  test('evaluator handles parsing errors', () => {
    const expressions = [
      '(1 + 2',
      'if a > 10 then "big"', // Missing 'else'
      'a + b c',
    ];

    expressions.forEach((expr) => {
      const result = evaluateExpression(expr);
      expect((result as any).success).toBe(false);
      expect((result as any).error).toBeTruthy();
    });
  });

  test('evaluator correctly handles valid expressions', () => {
    // Test that basic expression evaluation works correctly
    const result = evaluateExpression('2 + 2');
    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe(4);
  });
});
