import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
  safeEvaluateExpression,
} from '../src/lib/taion-expression.js';

/**
 * Tests targeting uncovered branches to improve code coverage.
 */

describe('Tokenizer coverage', () => {
  test('escape sequence \\r in strings', () => {
    const result = evaluateExpression('"hello\\rworld"');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('hello\rworld');
    }
  });

  test('escape sequence \\t in strings', () => {
    const result = evaluateExpression('"hello\\tworld"');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('hello\tworld');
    }
  });

  test('escape sequence \\" in double-quoted strings', () => {
    const result = evaluateExpression('"say \\"hi\\""');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('say "hi"');
    }
  });

  test("escape sequence \\' in single-quoted strings", () => {
    const result = evaluateExpression("'can\\'t'");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("can't");
    }
  });

  test('unknown escape sequence returns backslash + char', () => {
    const result = evaluateExpression('"hello\\xworld"');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('hello\\xworld');
    }
  });

  test('standalone = is treated as equality (alias for ==)', () => {
    const result = evaluateExpression('x = 5', { x: 5 });
    expect(result.success).toBe(true);
    expect((result as any).result).toBe(true);
  });

  test('standalone | is an error', () => {
    const result = evaluateExpression('true | false');
    expect(result.success).toBe(false);
  });

  test('$ without valid identifier is an error', () => {
    const result = evaluateExpression('$');
    expect(result.success).toBe(false);
  });

  test('whitespace characters are skipped (\\r, \\t)', () => {
    const result = evaluateExpression('1\t+\r2');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(3);
    }
  });

  test('escape in template string', () => {
    const result = evaluateExpression('`hello\\nworld`', {}, {
      enableTemplateStrings: true,
    });
    expect(result.success).toBe(true);
  });

  test('template string closing after interpolation', () => {
    const result = evaluateExpression('`value: ${5}`', {}, {
      enableTemplateStrings: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('value: 5');
    }
  });
});

describe('Parser coverage', () => {
  test('empty expression returns error', () => {
    const result = evaluateExpression('');
    expect(result.success).toBe(false);
  });

  test('ternary with missing consequent expression', () => {
    const result = compileExpression('true ? :');
    expect(result.success).toBe(false);
  });

  test('ternary with missing alternate after colon', () => {
    const result = compileExpression('true ? 5 :');
    expect(result.success).toBe(false);
  });

  test('incomplete function call argument', () => {
    const result = compileExpression('func(1,)');
    expect(result.success).toBe(false);
  });

  test('missing closing bracket in array index', () => {
    const result = compileExpression('arr[0');
    expect(result.success).toBe(false);
  });

  test('invalid expression in array index', () => {
    const result = compileExpression('arr[+]');
    expect(result.success).toBe(false);
  });

  test('incomplete function call in chain', () => {
    const result = compileExpression('obj.func(');
    expect(result.success).toBe(false);
  });

  test('missing property name after dot', () => {
    const result = compileExpression('obj.');
    expect(result.success).toBe(false);
  });

  test('invalid array literal element', () => {
    const result = compileExpression('[1, +]');
    expect(result.success).toBe(false);
  });

  test('missing closing backtick in template string', () => {
    const result = compileExpression('`unclosed', {
      enableTemplateStrings: true,
    });
    expect(result.success).toBe(false);
  });

  test('missing closing brace in template interpolation', () => {
    const result = compileExpression('`${1 + 2`', {
      enableTemplateStrings: true,
    });
    expect(result.success).toBe(false);
  });

  test('invalid expression in template interpolation', () => {
    const result = compileExpression('`${+}`', {
      enableTemplateStrings: true,
    });
    expect(result.success).toBe(false);
  });

  test('arrow function with block body is rejected', () => {
    const result = compileExpression('x => { x }', {
      enableArrowFunctions: true,
    });
    expect(result.success).toBe(false);
  });

  test('invalid parameter in arrow function (number)', () => {
    const result = compileExpression('(123) => 5', {
      enableArrowFunctions: true,
    });
    expect(result.success).toBe(false);
  });

  test('missing comma between arrow params', () => {
    const result = compileExpression('(x y) => 5', {
      enableArrowFunctions: true,
    });
    expect(result.success).toBe(false);
  });

  test('incomplete arrow function body', () => {
    const result = compileExpression('() => +', {
      enableArrowFunctions: true,
    });
    expect(result.success).toBe(false);
  });

  test('tokenizer error propagated to parser', () => {
    const result = compileExpression('1 & 2');
    expect(result.success).toBe(false);
  });

});

describe('Evaluator coverage - function calls', () => {
  test('function call denied by security allowedProperties', () => {
    const result = evaluateExpression('abs(5)', {}, {
      allowedProperties: ['x'],
    });
    expect(result.success).toBe(false);
  });

  test('custom function that throws generic error returns null', () => {
    const result = evaluateExpression('boom()', {}, {
      customFunctions: {
        boom: () => { throw new TypeError('oops'); },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('isNumber returns false for NaN', () => {
    const result = evaluateExpression('isNumber(val)', { val: NaN });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(false);
    }
  });

  test('isString returns true for string', () => {
    const result = evaluateExpression('isString(val)', { val: 'hello' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(true);
    }
  });

  test('isString returns false for non-string', () => {
    const result = evaluateExpression('isString(val)', { val: 42 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(false);
    }
  });
});

describe('Evaluator coverage', () => {
  test('string character access via array index', () => {
    const result = evaluateExpression('"hello"[1]', {}, {
      enableArrays: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('e');
    }
  });

  test('string index out of bounds returns null', () => {
    const result = evaluateExpression('"hi"[5]', {}, {
      enableArrays: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('object property access via bracket notation', () => {
    const result = evaluateExpression('obj["key"]', { obj: { key: 42 } }, {
      enableArrays: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(42);
    }
  });

  test('object bracket access for non-own property returns null', () => {
    const result = evaluateExpression(
      'obj["toString"]',
      { obj: {} },
      { enableArrays: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('object bracket access denied by security policy', () => {
    const result = evaluateExpression(
      'obj["secret"]',
      { obj: { secret: 123 } },
      { enableArrays: true, deniedProperties: ['secret'] },
    );
    expect(result.success).toBe(false);
  });

  test('array literal with enableArrays: false throws error', () => {
    const result = evaluateExpression('[1, 2, 3]', {}, {
      enableArrays: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('ARRAY_FEATURE_DISABLED');
    }
  });

  test('array indexing with enableArrays: false throws error', () => {
    const result = evaluateExpression('items[0]', { items: [1, 2, 3] }, {
      enableArrays: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('ARRAY_FEATURE_DISABLED');
    }
  });

  test('invalid regex in allowedProperties throws error', () => {
    const result = evaluateExpression('x', { x: 1 }, {
      allowedProperties: ['[invalid(regex'],
    });
    expect(result.success).toBe(false);
  });

  test('invalid regex in deniedProperties throws error', () => {
    const result = evaluateExpression('x', { x: 1 }, {
      deniedProperties: ['[invalid(regex'],
    });
    expect(result.success).toBe(false);
  });

  test('non-array non-string non-object array index returns null', () => {
    const result = evaluateExpression('val[0]', { val: 42 }, {
      enableArrays: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });
});

describe('Higher-order function error catch blocks', () => {
  test('map with throwing callback returns empty array', () => {
    const result = evaluateExpression(
      'map(items, fn)',
      {
        items: [1, 2, 3],
        fn: () => { throw new RangeError('test'); },
      },
      { enableArrowFunctions: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toEqual([]);
    }
  });

  test('filter with throwing callback returns empty array', () => {
    const result = evaluateExpression(
      'filter(items, fn)',
      {
        items: [1, 2, 3],
        fn: () => { throw new RangeError('test'); },
      },
      { enableArrowFunctions: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toEqual([]);
    }
  });

  test('find with throwing callback returns null', () => {
    const result = evaluateExpression(
      'find(items, fn)',
      {
        items: [1, 2, 3],
        fn: () => { throw new RangeError('test'); },
      },
      { enableArrowFunctions: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('reduce with throwing callback returns null', () => {
    const result = evaluateExpression(
      'reduce(items, fn, 0)',
      {
        items: [1, 2, 3],
        fn: () => { throw new RangeError('test'); },
      },
      { enableArrowFunctions: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('every with throwing callback returns false', () => {
    const result = evaluateExpression(
      'every(items, fn)',
      {
        items: [1, 2, 3],
        fn: () => { throw new RangeError('test'); },
      },
      { enableArrowFunctions: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(false);
    }
  });

  test('some with throwing callback returns false', () => {
    const result = evaluateExpression(
      'some(items, fn)',
      {
        items: [1, 2, 3],
        fn: () => { throw new RangeError('test'); },
      },
      { enableArrowFunctions: true },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(false);
    }
  });
});

describe('HOF re-throw CompilationError branches', () => {
  test('filter re-throws CompilationError from security limits', () => {
    const result = evaluateExpression(
      'filter(items, x => x > 0)',
      { items: [1, 2, 3, 4, 5] },
      { enableArrowFunctions: true, maxLoopIterations: 2 },
    );
    expect(result.success).toBe(false);
  });

  test('find re-throws CompilationError from security limits', () => {
    const result = evaluateExpression(
      'find(items, x => x > 10)',
      { items: [1, 2, 3, 4, 5] },
      { enableArrowFunctions: true, maxLoopIterations: 2 },
    );
    expect(result.success).toBe(false);
  });

  test('reduce re-throws CompilationError from security limits', () => {
    const result = evaluateExpression(
      'reduce(items, (acc, x) => acc + x, 0)',
      { items: [1, 2, 3, 4, 5] },
      { enableArrowFunctions: true, maxLoopIterations: 2 },
    );
    expect(result.success).toBe(false);
  });

  test('every re-throws CompilationError from security limits', () => {
    const result = evaluateExpression(
      'every(items, x => x > 0)',
      { items: [1, 2, 3, 4, 5] },
      { enableArrowFunctions: true, maxLoopIterations: 2 },
    );
    expect(result.success).toBe(false);
  });

  test('some re-throws CompilationError from security limits', () => {
    const result = evaluateExpression(
      'some(items, x => x > 10)',
      { items: [1, 2, 3, 4, 5] },
      { enableArrowFunctions: true, maxLoopIterations: 2 },
    );
    expect(result.success).toBe(false);
  });
});

describe('Built-in functions coverage', () => {
  test('toDateValue returns null for boolean', () => {
    const result = evaluateExpression('year(true)');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('sort with string values uses localeCompare', () => {
    const result = evaluateExpression(
      'sort(items)',
      { items: ['banana', 'apple', 'cherry'] },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toEqual(['apple', 'banana', 'cherry']);
    }
  });

  test('type() returns typeof for primitives', () => {
    const r1 = evaluateExpression('type(42)');
    expect(r1.success && r1.result).toBe('number');

    const r2 = evaluateExpression('type("hello")');
    expect(r2.success && r2.result).toBe('string');

    const r3 = evaluateExpression('type(true)');
    expect(r3.success && r3.result).toBe('boolean');
  });

  test('isUndefined, isDefined, isBoolean', () => {
    // unresolved identifiers return null, so use context with explicit undefined
    const r1 = evaluateExpression('isUndefined(x)', { x: undefined });
    expect(r1.success).toBe(true);
    if (r1.success) expect(r1.result).toBe(true);

    const r2 = evaluateExpression('isDefined(x)', { x: 5 });
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.result).toBe(true);

    const r3 = evaluateExpression('isBoolean(x)', { x: false });
    expect(r3.success).toBe(true);
    if (r3.success) expect(r3.result).toBe(true);
  });

  test('regexMatch returns null for invalid regex', () => {
    const result = evaluateExpression('regexMatch("test", "[invalid")');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('regexReplace with oversized pattern returns str unchanged', () => {
    const longPattern = 'a'.repeat(201);
    const result = evaluateExpression(
      'regexReplace(str, pattern, "x")',
      { str: 'hello', pattern: longPattern },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('hello');
    }
  });

  test('regexReplace with invalid regex returns str unchanged', () => {
    const result = evaluateExpression('regexReplace("test", "[invalid", "x")');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('test');
    }
  });

  test('dateAdd with minutes unit', () => {
    const result = evaluateExpression(
      'minute(dateAdd(date(2024, 1, 1, 12, 0), 30, "minutes"))',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(30);
    }
  });

  test('dateAdd with seconds unit', () => {
    const result = evaluateExpression(
      'second(dateAdd(date(2024, 1, 1, 12, 0, 0), 45, "seconds"))',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(45);
    }
  });

  test('dateAdd with milliseconds unit', () => {
    const result = evaluateExpression(
      'timestamp(dateAdd(date(2024, 1, 1), 500, "milliseconds")) - timestamp(date(2024, 1, 1))',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(500);
    }
  });

  test('dateAdd with invalid unit returns null', () => {
    const result = evaluateExpression(
      'dateAdd(date(2024, 1, 1), 5, "invalid")',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('dateDiff with months unit', () => {
    const result = evaluateExpression(
      'dateDiff(date(2024, 7, 1), date(2024, 1, 1), "months")',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(6);
    }
  });

  test('dateDiff with seconds unit', () => {
    const result = evaluateExpression(
      'dateDiff(date(2024, 1, 1, 12, 0, 30), date(2024, 1, 1, 12, 0, 0), "seconds")',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(30);
    }
  });

  test('dateDiff with milliseconds unit', () => {
    const result = evaluateExpression(
      'dateDiff(date(2024, 1, 1, 12, 0, 0), date(2024, 1, 1, 11, 59, 59), "milliseconds")',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(1000);
    }
  });

  test('dateDiff with invalid unit returns null', () => {
    const result = evaluateExpression(
      'dateDiff(date(2024, 1, 1), date(2024, 7, 1), "invalid")',
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });
});

describe('Security coverage', () => {
  test('allowedProperties with parent path segments', () => {
    const result = evaluateExpression(
      'user.profile.name',
      { user: { profile: { name: 'Alice' } } },
      { allowedProperties: ['user.profile.name'] },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe('Alice');
    }
  });

  test('allowedProperties blocks non-allowed leaf', () => {
    const result = evaluateExpression(
      'user.secret',
      { user: { secret: 'hidden', profile: { name: 'Alice' } } },
      { allowedProperties: ['user.profile.name'] },
    );
    expect(result.success).toBe(false);
  });

  test('max complexity exceeded', () => {
    const result = evaluateExpression(
      '1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1',
      {},
      { maxComplexity: 5 },
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('MAX_COMPLEXITY_EXCEEDED');
    }
  });

  test('max call stack depth exceeded', () => {
    const result = evaluateExpression(
      'abs(abs(abs(abs(abs(1)))))',
      {},
      { maxCallStackDepth: 2 },
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('MAX_CALL_STACK_EXCEEDED');
    }
  });
});

describe('Expression evaluator edge cases', () => {
  test('safeEvaluateExpression returns null for empty expression', () => {
    const result = safeEvaluateExpression('');
    expect(result).toBeNull();
  });

  test('safeEvaluateExpression returns null for invalid expression', () => {
    const result = safeEvaluateExpression('1 +');
    expect(result).toBeNull();
  });

  test('evaluateExpression with tokenization error', () => {
    const result = evaluateExpression('@invalid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('TOKENIZE_ERROR');
    }
  });

  test('non-indexable value with array index returns null', () => {
    const result = evaluateExpression('val[0]', { val: true }, {
      enableArrays: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('null value with array index returns null', () => {
    const result = evaluateExpression('val[0]', { val: null }, {
      enableArrays: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });

  test('unresolved identifier returns null', () => {
    const result = evaluateExpression('nonExistent');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeNull();
    }
  });
});
