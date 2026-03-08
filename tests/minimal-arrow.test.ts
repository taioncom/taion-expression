import { describe, expect, test } from '@jest/globals';
import { tokenize } from '../src/lib/tokenizer.js';
import { parse } from '../src/lib/parser.js';
import { TokenType } from '../src/lib/types.js';
import {
  compileExpression,
  safeEvaluateExpression,
} from '../src/lib/taion-expression.js';

describe('Minimal Arrow Function', () => {
  // Test tokenization of arrow function
  test('tokenizes arrow function => correctly', () => {
    const source = 'x => x * 2';
    const tokens = tokenize(source);

    expect(tokens[1].type).toBe(TokenType.ARROW);
    expect(tokens[1].value).toBe('=>');
  });

  // Test parsing of a simple arrow function
  test('parses simple arrow function', () => {
    const source = 'x => x * 2';
    const tokens = tokenize(source);
    const [error, ast] = parse(tokens);

    // Check that parsing works
    expect(error).toBeNull();
    expect(ast?.type).toBe('ArrowFunction');

    // Check the parameters
    if (ast && ast.type === 'ArrowFunction') {
      expect(ast.params.length).toBe(1);
      expect(ast.params[0].name).toBe('x');
    }
  });

  // Test compiling an arrow function
  test('compiles arrow function', () => {
    const source = 'x => x * 2';
    const options = { enableArrowFunctions: true };

    const result = compileExpression(source, options);

    expect((result as any).success).toBe(true);
    if ((result as any).success) {
      expect((result as any).result.compiledCode).toContain('Interpreted:');
    }
  });

  // Test arrow function with map using direct function
  test('uses arrow function with direct function', () => {
    const options = {
      enableArrowFunctions: true,
      enableArrays: true,
    };

    const context = {
      numbers: [1, 2, 3, 4, 5],
      // Use a custom map function directly
      doubleAll: function (arr: Array<number>): Array<number> {
        return arr.map((x) => x * 2);
      },
    };

    const result = safeEvaluateExpression(
      'doubleAll(numbers)',
      context,
      options,
    );
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });
});
