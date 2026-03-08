import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
  getCompiledCode,
} from '../src/lib/taion-expression.js';
import { tokenize } from '../src/lib/tokenizer.js';
import { parse } from '../src/lib/parser.js';
import { TokenType } from '../src/lib/types.js';

describe('Single Arrow Function', () => {
  // Test tokenization and parsing of arrow function
  test('tokenize and parse arrow function', () => {
    const expression = 'x => x * 2';
    const options = { enableArrowFunctions: true };

    // Tokenize and parse
    const tokens = tokenize(expression);
    expect(tokens.length).toBeGreaterThan(0);

    // Verify tokens are correct
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('x');
    expect(tokens[1].type).toBe(TokenType.ARROW);
    expect(tokens[1].value).toBe('=>');

    const [parseError, ast] = parse(tokens);

    // Check AST
    expect(parseError).toBeNull();
    expect(ast).toBeTruthy();
    expect(ast?.type).toBe('ArrowFunction');

    // Verify the function parameters
    if (ast && ast.type === 'ArrowFunction') {
      expect(ast.params.length).toBe(1);
      expect(ast.params[0].name).toBe('x');
      expect(ast.body.type).toBe('BinaryExpression');
    }

    // Compile
    const compiled = compileExpression(expression, options);
    expect((compiled as any).success).toBe(true);

    if ((compiled as any).success) {
      expect((compiled as any).result.compiledCode).toContain('Interpreted:');
    }
  });

  // Test evaluation of arrow function with map
  test('evaluate arrow function in context', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
    };

    const context = {
      numbers: [1, 2, 3, 4, 5],
      doubleMap: function (arr: number[]) {
        return arr.map((x) => x * 2);
      },
    };

    // Test with a simple function call (no arrow function)
    const result = evaluateExpression('doubleMap(numbers)', context, options);

    expect((result as any).success).toBe(true);
    expect((result as any).result).toEqual([2, 4, 6, 8, 10]);

    // Now test with a custom map function using arrow function directly
    const context2 = {
      numbers: [1, 2, 3, 4, 5],
      map: function (arr: unknown[], fn: unknown): unknown[] {
        if (!Array.isArray(arr) || typeof fn !== 'function') return [];
        return arr.map((item) => {
          try {
            return (fn as Function)(item);
          } catch (e) {
            return null;
          }
        });
      },
    };

    const expr = 'map(numbers, x => x * 2)';
    const result2 = evaluateExpression(expr, context2, options);

    // Check it compiles
    const code = getCompiledCode(expr, options);
    expect(code).toBeTruthy();

    expect((result2 as any).success).toBe(true);
    expect((result2 as any).result).toEqual([2, 4, 6, 8, 10]);
  });
});
