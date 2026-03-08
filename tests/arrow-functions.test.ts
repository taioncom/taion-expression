import { describe, expect, test } from '@jest/globals';
import {
  evaluateExpression,
  safeCompileExpression,
  safeEvaluateExpression,
  compileExpression,
  getCompiledCode,
} from '../src/lib/taion-expression.js';
import { tokenize } from '../src/lib/tokenizer.js';
import { parse } from '../src/lib/parser.js';
import { TokenType } from '../src/lib/types.js';

describe('Arrow Functions', () => {
  // Test tokenization of arrow functions
  test('tokenizes arrow function correctly', () => {
    const source = 'x => x * 2';
    const tokens = tokenize(source);

    // Verify the tokens
    expect(tokens.length).toBe(6); // IDENTIFIER, ARROW, IDENTIFIER, MULTIPLY, NUMBER, EOF
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('x');
    expect(tokens[1].type).toBe(TokenType.ARROW);
    expect(tokens[1].value).toBe('=>');
    expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[2].value).toBe('x');
    expect(tokens[3].type).toBe(TokenType.MULTIPLY);
    expect(tokens[4].type).toBe(TokenType.NUMBER);
    expect(tokens[4].value).toBe(2);
  });

  // Test tokenization of arrow functions with parentheses
  test('tokenizes arrow function with parentheses correctly', () => {
    const source = '(x, y) => x + y';
    const tokens = tokenize(source);

    // Verify the tokens
    expect(tokens.length).toBe(10); // LEFT_PAREN, IDENTIFIER, COMMA, IDENTIFIER, RIGHT_PAREN, ARROW, IDENTIFIER, PLUS, IDENTIFIER, EOF
    expect(tokens[0].type).toBe(TokenType.LEFT_PAREN);
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[1].value).toBe('x');
    expect(tokens[2].type).toBe(TokenType.COMMA);
    expect(tokens[3].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[3].value).toBe('y');
    expect(tokens[4].type).toBe(TokenType.RIGHT_PAREN);
    expect(tokens[5].type).toBe(TokenType.ARROW);
    expect(tokens[5].value).toBe('=>');
  });

  // Test arrow function with a single parameter (no parentheses)
  test('evaluates arrow function with a single parameter', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
    };

    const context = {
      numbers: [1, 2, 3, 4, 5],
      map: function (arr: unknown[], fn: unknown): unknown[] {
        if (!Array.isArray(arr) || typeof fn !== 'function') return [];
        return arr.map((item) => {
          try {
            return (fn as Function)(item);
          } catch {
            return null;
          }
        });
      },
    };

    const expression = 'map(numbers, x => x * 2)';
    const result = evaluateExpression(expression, context, options);

    expect((result as any).success).toBe(true);
    expect((result as any).result).toEqual([2, 4, 6, 8, 10]);
  });

  // Test arrow function with multiple parameters (requires parentheses)
  test('evaluates arrow function with multiple parameters', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
    };

    const context = {
      reduce: function (arr: unknown[], fn: unknown, initial: unknown): unknown {
        if (!Array.isArray(arr) || typeof fn !== 'function') return initial;
        return arr.reduce((acc, item) => {
          try {
            return (fn as Function)(acc, item);
          } catch {
            return acc;
          }
        }, initial);
      },
      numbers: [1, 2, 3, 4, 5],
    };

    const expression = 'reduce(numbers, (acc, x) => acc + x, 0)';
    const result = evaluateExpression(expression, context, options);

    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe(15);
  });

  // Test arrow function with empty parameter list
  test('evaluates arrow function with no parameters', () => {
    const options = {
      enableArrowFunctions: true,
    };

    const context = {
      execute: function (fn: unknown): unknown {
        if (typeof fn !== 'function') return null;
        try {
          return (fn as Function)();
        } catch {
          return null;
        }
      },
    };

    const expression = 'execute(() => 42)';
    const result = evaluateExpression(expression, context, options);

    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe(42);
  });

  // Test arrow function used with filter
  test('uses arrow function with filter', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
    };

    const context = {
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      filter: function (arr: unknown[], fn: unknown): unknown[] {
        if (!Array.isArray(arr) || typeof fn !== 'function') return [];
        return arr.filter((item) => {
          try {
            return Boolean((fn as Function)(item));
          } catch {
            return false;
          }
        });
      },
    };

    const expression = 'filter(numbers, x => x % 2 == 0)';
    const result = evaluateExpression(expression, context, options);

    expect((result as any).success).toBe(true);
    expect((result as any).result).toEqual([2, 4, 6, 8, 10]);
  });

  // Test arrow function with the enableArrowFunctions option disabled
  test('disables arrow functions when the option is false', () => {
    const options = {
      enableArrowFunctions: false,
    };

    const context = {
      execute: function (fn: unknown): unknown {
        if (typeof fn !== 'function') return null;
        try {
          return (fn as Function)();
        } catch {
          return null;
        }
      },
    };

    const expression = 'execute(() => 42)';
    const result = evaluateExpression(expression, context, options);

    expect((result as any).success).toBe(false);
    expect((result as any).error?.code).toBe('ARROW_FUNCTIONS_DISABLED');
  });

  // Integration test with more complex use cases
  test('integration test with complex arrow functions', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
      enableTemplateStrings: true,
    };

    const context = {
      people: [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
        { name: 'Diana', age: 40 },
      ],
      filter: function (arr: unknown[], fn: unknown): unknown[] {
        if (!Array.isArray(arr) || typeof fn !== 'function') return [];
        return arr.filter((item) => {
          try {
            return Boolean((fn as Function)(item));
          } catch {
            return false;
          }
        });
      },
      map: function (arr: unknown[], fn: unknown): unknown[] {
        if (!Array.isArray(arr) || typeof fn !== 'function') return [];
        return arr.map((item) => {
          try {
            return (fn as Function)(item);
          } catch {
            return null;
          }
        });
      },
      join: function (arr: unknown[], separator: unknown): string {
        if (!Array.isArray(arr)) return '';
        return arr.join((separator as string) || ',');
      },
    };

    // Complex pipeline: filter people over 30, map to their names, join with commas
    const expression =
      'join(map(filter(people, p => p.age > 30), p => p.name), ", ")';
    const result = evaluateExpression(expression, context, options);

    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe('Charlie, Diana');
  });
});
