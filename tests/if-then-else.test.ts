import { describe, expect, test } from '@jest/globals';
import {
  evaluateExpression,
  safeEvaluateExpression,
} from '../src/lib/taion-expression.js';
import { parse } from '../src/lib/parser.js';
import { tokenize } from '../src/lib/tokenizer.js';
import { ExpressionOptions } from '../src/lib/types.js';

// Helper function to tokenize and parse in one step
const parseExpression = (expr: string) => {
  const tokens = tokenize(expr);
  return parse(tokens);
};

// Helper to evaluate and assert success
const expectResult = (
  expr: string,
  expected: unknown,
  context: Record<string, unknown> = {},
  options: ExpressionOptions = {},
) => {
  const result = evaluateExpression(expr, context, options);
  expect((result as any).success).toBe(true);
  expect((result as any).result).toEqual(expected);
};

// Helper to assert parse failure
const expectParseError = (expr: string) => {
  const result = evaluateExpression(expr);
  expect((result as any).success).toBe(false);
};

describe('If-Then-Else Expressions', () => {
  describe('parsing', () => {
    test('parses standalone if-then-else with parenthesized condition', () => {
      const [error, ast] = parseExpression(
        'if (x > 10) then "big" else "small"',
      );
      expect(error).toBeNull();
      expect(ast).not.toBeNull();
      expect(ast!.type).toBe('ConditionalExpression');

      const cond = ast as any;
      expect(cond.test.type).toBe('BinaryExpression');
      expect(cond.test.operator).toBe('>');
      expect(cond.consequent.value).toBe('big');
      expect(cond.alternate.value).toBe('small');
    });

    test('parses standalone if-then-else without parentheses', () => {
      const [error, ast] = parseExpression(
        'if true then "yes" else "no"',
      );
      expect(error).toBeNull();
      expect(ast).not.toBeNull();
      expect(ast!.type).toBe('ConditionalExpression');

      const cond = ast as any;
      expect(cond.test.type).toBe('Literal');
      expect(cond.test.value).toBe(true);
    });

    test('parses nested if-then-else in consequent', () => {
      const [error, ast] = parseExpression(
        'if (a) then if (b) then 1 else 2 else 3',
      );
      expect(error).toBeNull();
      expect(ast).not.toBeNull();

      const outer = ast as any;
      expect(outer.type).toBe('ConditionalExpression');
      expect(outer.consequent.type).toBe('ConditionalExpression');
      expect(outer.consequent.consequent.value).toBe(1);
      expect(outer.consequent.alternate.value).toBe(2);
      expect(outer.alternate.value).toBe(3);
    });

    test('parses nested if-then-else in alternate', () => {
      const [error, ast] = parseExpression(
        'if (a) then 1 else if (b) then 2 else 3',
      );
      expect(error).toBeNull();
      expect(ast).not.toBeNull();

      const outer = ast as any;
      expect(outer.type).toBe('ConditionalExpression');
      expect(outer.consequent.value).toBe(1);
      expect(outer.alternate.type).toBe('ConditionalExpression');
      expect(outer.alternate.consequent.value).toBe(2);
      expect(outer.alternate.alternate.value).toBe(3);
    });

    test('parses if-then-else with complex condition', () => {
      const [error, ast] = parseExpression(
        'if (a > 10 && b < 20) then "match" else "no match"',
      );
      expect(error).toBeNull();
      expect(ast).not.toBeNull();

      const cond = ast as any;
      expect(cond.test.type).toBe('BinaryExpression');
      expect(cond.test.operator).toBe('&&');
    });

    test('parses if-then-else with expression branches', () => {
      const [error, ast] = parseExpression(
        'if (x > 0) then x * 2 + 1 else -x * 3',
      );
      expect(error).toBeNull();
      expect(ast).not.toBeNull();

      const cond = ast as any;
      expect(cond.consequent.type).toBe('BinaryExpression');
      expect(cond.alternate.type).toBe('BinaryExpression');
    });

    test('fails to parse if without else', () => {
      const [error] = parseExpression('if (true) then 1');
      expect(error).not.toBeNull();
    });

    test('fails to parse if without then', () => {
      const [error] = parseExpression('if (true) 1 else 2');
      expect(error).not.toBeNull();
    });
  });

  describe('simple evaluation', () => {
    test('evaluates true condition', () => {
      expectResult('if (true) then 1 else 2', 1);
    });

    test('evaluates false condition', () => {
      expectResult('if (false) then 1 else 2', 2);
    });

    test('evaluates with comparison', () => {
      expectResult('if (5 > 3) then "yes" else "no"', 'yes');
    });

    test('evaluates with false comparison', () => {
      expectResult('if (3 > 5) then "yes" else "no"', 'no');
    });

    test('evaluates without parentheses around condition', () => {
      expectResult('if true then "a" else "b"', 'a');
    });

    test('evaluates with equality check', () => {
      expectResult('if (1 == 1) then "equal" else "not equal"', 'equal');
    });

    test('evaluates with inequality check', () => {
      expectResult('if (1 != 2) then "diff" else "same"', 'diff');
    });

    test('evaluates with string result', () => {
      expectResult(
        'if (age >= 18) then "Adult" else "Minor"',
        'Adult',
        { age: 25 },
      );
    });

    test('evaluates with numeric result', () => {
      expectResult(
        'if (total > 100) then total * 0.9 else total',
        135,
        { total: 150 },
      );
    });

    test('evaluates with null using isNull', () => {
      expectResult(
        'if (isNull(x)) then "missing" else "present"',
        'missing',
        { x: null },
      );
    });
  });

  describe('context variables', () => {
    test('accesses nested properties in condition', () => {
      expectResult(
        'if (user.age >= 18) then "Adult" else "Minor"',
        'Minor',
        { user: { name: 'Bob', age: 16 } },
      );
    });

    test('accesses nested properties in branches', () => {
      expectResult(
        'if (active) then user.name else "anonymous"',
        'Alice',
        { active: true, user: { name: 'Alice' } },
      );
    });

    test('uses context in both branches', () => {
      expectResult(
        'if (discount) then price * 0.9 else price',
        90,
        { discount: true, price: 100 },
      );
      expectResult(
        'if (discount) then price * 0.9 else price',
        100,
        { discount: false, price: 100 },
      );
    });
  });

  describe('nested if-then-else', () => {
    test('nested in consequent', () => {
      expectResult(
        'if (a > 0) then if (a > 10) then "big" else "small" else "negative"',
        'small',
        { a: 5 },
      );
    });

    test('nested in alternate (else-if chain)', () => {
      expectResult(
        'if (x > 100) then "A" else if (x > 50) then "B" else "C"',
        'A',
        { x: 150 },
      );
      expectResult(
        'if (x > 100) then "A" else if (x > 50) then "B" else "C"',
        'B',
        { x: 75 },
      );
      expectResult(
        'if (x > 100) then "A" else if (x > 50) then "B" else "C"',
        'C',
        { x: 25 },
      );
    });

    test('triple nesting in alternate (else-if-else-if chain)', () => {
      const expr =
        'if (score >= 90) then "A" else if (score >= 80) then "B" else if (score >= 70) then "C" else "F"';
      expectResult(expr, 'A', { score: 95 });
      expectResult(expr, 'B', { score: 85 });
      expectResult(expr, 'C', { score: 75 });
      expectResult(expr, 'F', { score: 60 });
    });

    test('deeply nested in consequent', () => {
      expectResult(
        'if (a) then if (b) then if (c) then 1 else 2 else 3 else 4',
        1,
        { a: true, b: true, c: true },
      );
      expectResult(
        'if (a) then if (b) then if (c) then 1 else 2 else 3 else 4',
        2,
        { a: true, b: true, c: false },
      );
      expectResult(
        'if (a) then if (b) then if (c) then 1 else 2 else 3 else 4',
        3,
        { a: true, b: false, c: true },
      );
      expectResult(
        'if (a) then if (b) then if (c) then 1 else 2 else 3 else 4',
        4,
        { a: false, b: true, c: true },
      );
    });

    test('nested in both branches', () => {
      expectResult(
        'if (x > 0) then if (x > 10) then "big pos" else "small pos" else if (x < -10) then "big neg" else "small neg"',
        'big pos',
        { x: 50 },
      );
      expectResult(
        'if (x > 0) then if (x > 10) then "big pos" else "small pos" else if (x < -10) then "big neg" else "small neg"',
        'small pos',
        { x: 5 },
      );
      expectResult(
        'if (x > 0) then if (x > 10) then "big pos" else "small pos" else if (x < -10) then "big neg" else "small neg"',
        'big neg',
        { x: -50 },
      );
      expectResult(
        'if (x > 0) then if (x > 10) then "big pos" else "small pos" else if (x < -10) then "big neg" else "small neg"',
        'small neg',
        { x: -5 },
      );
    });
  });

  describe('with operators and functions', () => {
    test('arithmetic in condition', () => {
      expectResult(
        'if (a + b > 10) then "big" else "small"',
        'big',
        { a: 6, b: 7 },
      );
    });

    test('logical operators in condition', () => {
      expectResult(
        'if (a > 0 && b > 0) then "both positive" else "not both"',
        'both positive',
        { a: 1, b: 2 },
      );
      expectResult(
        'if (a > 0 || b > 0) then "at least one" else "neither"',
        'at least one',
        { a: -1, b: 2 },
      );
    });

    test('negation in condition', () => {
      expectResult(
        'if (!done) then "working" else "finished"',
        'working',
        { done: false },
      );
    });

    test('arithmetic in branches', () => {
      expectResult(
        'if (premium) then price * 0.8 else price * 0.95',
        80,
        { premium: true, price: 100 },
      );
      expectResult(
        'if (premium) then price * 0.8 else price * 0.95',
        95,
        { premium: false, price: 100 },
      );
    });

    test('function calls in condition', () => {
      expectResult(
        'if (length(name) > 3) then "long" else "short"',
        'long',
        { name: 'Alice' },
      );
      expectResult(
        'if (length(name) > 3) then "long" else "short"',
        'short',
        { name: 'Bob' },
      );
    });

    test('function calls in branches', () => {
      expectResult(
        'if (upper) then toUpperCase(name) else toLowerCase(name)',
        'ALICE',
        { upper: true, name: 'Alice' },
      );
      expectResult(
        'if (upper) then toUpperCase(name) else toLowerCase(name)',
        'alice',
        { upper: false, name: 'Alice' },
      );
    });

    test('complex arithmetic expressions in branches', () => {
      expectResult(
        'if (qty > 10) then price * qty * 0.9 else price * qty',
        900,
        { qty: 20, price: 50 },
      );
    });
  });

  describe('mixed with ternary', () => {
    test('ternary inside if-then-else consequent', () => {
      expectResult(
        'if (a) then (b ? 1 : 2) else 3',
        1,
        { a: true, b: true },
      );
      expectResult(
        'if (a) then (b ? 1 : 2) else 3',
        2,
        { a: true, b: false },
      );
      expectResult(
        'if (a) then (b ? 1 : 2) else 3',
        3,
        { a: false, b: true },
      );
    });

    test('ternary inside if-then-else alternate', () => {
      expectResult(
        'if (a) then 1 else (b ? 2 : 3)',
        2,
        { a: false, b: true },
      );
    });

    test('both ternary and if-then-else produce ConditionalExpression', () => {
      const [err1, ast1] = parseExpression('if (x) then 1 else 2');
      const [err2, ast2] = parseExpression('x ? 1 : 2');
      expect(err1).toBeNull();
      expect(err2).toBeNull();
      expect(ast1!.type).toBe('ConditionalExpression');
      expect(ast2!.type).toBe('ConditionalExpression');
    });

    test('ternary still works as before', () => {
      expectResult('x > 5 ? "big" : "small"', 'big', { x: 10 });
      expectResult('x > 5 ? "big" : "small"', 'small', { x: 3 });
    });
  });

  describe('with arrays', () => {
    const opts: ExpressionOptions = { enableArrays: true };

    test('array functions in condition', () => {
      expectResult(
        'if (length(items) > 0) then sum(items) else 0',
        15,
        { items: [1, 2, 3, 4, 5] },
        opts,
      );
      expectResult(
        'if (length(items) > 0) then sum(items) else 0',
        0,
        { items: [] },
        opts,
      );
    });

    test('array result in branches', () => {
      expectResult(
        'if (reverse_order) then reverse(items) else sort(items)',
        [3, 2, 1],
        { reverse_order: true, items: [1, 2, 3] },
        opts,
      );
      expectResult(
        'if (reverse_order) then reverse(items) else sort(items)',
        [1, 2, 3],
        { reverse_order: false, items: [3, 1, 2] },
        opts,
      );
    });

    test('array indexing in condition', () => {
      expectResult(
        'if (items[0] > 10) then "high" else "low"',
        'high',
        { items: [42, 1, 2] },
        opts,
      );
    });
  });

  describe('with template strings', () => {
    const opts: ExpressionOptions = { enableTemplateStrings: true };

    test('template string in condition value', () => {
      expectResult(
        'if (greeting == "hello") then toUpperCase(name) else toLowerCase(name)',
        'ALICE',
        { greeting: 'hello', name: 'Alice' },
        opts,
      );
    });

    test('string concatenation in branches as alternative to templates', () => {
      expectResult(
        'if (formal) then "Dear " + name + "," else "Hey " + name + "!"',
        'Dear Alice,',
        { formal: true, name: 'Alice' },
        opts,
      );
      expectResult(
        'if (formal) then "Dear " + name + "," else "Hey " + name + "!"',
        'Hey Alice!',
        { formal: false, name: 'Alice' },
        opts,
      );
    });
  });

  describe('with arrow functions', () => {
    const opts: ExpressionOptions = {
      enableArrays: true,
      enableArrowFunctions: true,
    };

    test('arrow function result in branches', () => {
      expectResult(
        'if (ascending) then sort(items) else reverse(sort(items))',
        [1, 2, 3],
        { ascending: true, items: [3, 1, 2] },
        opts,
      );
    });

    test('filter with arrow in branch', () => {
      expectResult(
        'if (only_positive) then filter(nums, x => x > 0) else nums',
        [1, 3, 5],
        { only_positive: true, nums: [-2, 1, -4, 3, 5] },
        opts,
      );
    });

    test('map with arrow in branch', () => {
      expectResult(
        'if (double_it) then map(nums, x => x * 2) else nums',
        [2, 4, 6],
        { double_it: true, nums: [1, 2, 3] },
        opts,
      );
    });
  });

  describe('with custom functions', () => {
    test('custom function in condition', () => {
      const opts: ExpressionOptions = {
        customFunctions: {
          isVIP: (level: unknown) => Number(level) >= 5,
        },
      };
      expectResult(
        'if (isVIP(level)) then price * 0.7 else price',
        70,
        { level: 5, price: 100 },
        opts,
      );
      expectResult(
        'if (isVIP(level)) then price * 0.7 else price',
        100,
        { level: 2, price: 100 },
        opts,
      );
    });

    test('custom function in branches', () => {
      const opts: ExpressionOptions = {
        customFunctions: {
          formatUSD: (amount: unknown) => `$${Number(amount).toFixed(2)}`,
          formatEUR: (amount: unknown) =>
            `${Number(amount).toFixed(2)} EUR`,
        },
      };
      expectResult(
        'if (currency == "USD") then formatUSD(amount) else formatEUR(amount)',
        '$99.00',
        { currency: 'USD', amount: 99 },
        opts,
      );
      expectResult(
        'if (currency == "USD") then formatUSD(amount) else formatEUR(amount)',
        '99.00 EUR',
        { currency: 'EUR', amount: 99 },
        opts,
      );
    });
  });

  describe('safe evaluation', () => {
    test('safeEvaluateExpression returns result on success', () => {
      const result = safeEvaluateExpression(
        'if (true) then 42 else 0',
      );
      expect(result).toBe(42);
    });

    test('safeEvaluateExpression returns null on error', () => {
      const result = safeEvaluateExpression(
        'if (true) then 1',
      );
      expect(result).toBeNull();
    });
  });

  describe('error cases', () => {
    test('missing else clause', () => {
      expectParseError('if (true) then 1');
    });

    test('missing then keyword', () => {
      expectParseError('if (true) 1 else 2');
    });

    test('empty condition', () => {
      expectParseError('if () then 1 else 2');
    });

    test('missing consequent expression', () => {
      expectParseError('if (true) then else 2');
    });

    test('missing alternate expression', () => {
      expectParseError('if (true) then 1 else');
    });
  });

  describe('complex real-world scenarios', () => {
    test('tiered pricing', () => {
      const expr =
        'if (qty >= 100) then price * qty * 0.8 else if (qty >= 50) then price * qty * 0.9 else price * qty';
      expectResult(expr, 800, { qty: 100, price: 10 });
      expectResult(expr, 450, { qty: 50, price: 10 });
      expectResult(expr, 100, { qty: 10, price: 10 });
    });

    test('user role permissions', () => {
      const expr =
        'if (role == "admin") then "full" else if (role == "editor") then "write" else if (role == "viewer") then "read" else "none"';
      expectResult(expr, 'full', { role: 'admin' });
      expectResult(expr, 'write', { role: 'editor' });
      expectResult(expr, 'read', { role: 'viewer' });
      expectResult(expr, 'none', { role: 'guest' });
    });

    test('shipping cost calculator', () => {
      const expr =
        'if (weight > 50) then 25 + (weight - 50) * 0.5 else if (weight > 10) then 10 + (weight - 10) * 0.3 else 5';
      expectResult(expr, 5, { weight: 5 });
      expectResult(expr, 13, { weight: 20 });
      expectResult(expr, 30, { weight: 60 });
    });

    test('discount with logical conditions', () => {
      const expr =
        'if (isPremium && orderTotal > 100) then orderTotal * 0.8 else if (isPremium || orderTotal > 200) then orderTotal * 0.9 else orderTotal';
      expectResult(expr, 120, { isPremium: true, orderTotal: 150 });
      expectResult(expr, 150, { isPremium: false, orderTotal: 150 });
      expectResult(expr, 225, { isPremium: false, orderTotal: 250 });
      expectResult(expr, 50, { isPremium: false, orderTotal: 50 });
    });

    test('BMI category classifier', () => {
      const expr =
        'if (bmi < 18.5) then "Underweight" else if (bmi < 25) then "Normal" else if (bmi < 30) then "Overweight" else "Obese"';
      expectResult(expr, 'Underweight', { bmi: 17 });
      expectResult(expr, 'Normal', { bmi: 22 });
      expectResult(expr, 'Overweight', { bmi: 27 });
      expectResult(expr, 'Obese', { bmi: 35 });
    });

    test('complex nested with functions and arithmetic', () => {
      const opts: ExpressionOptions = {
        enableArrays: true,
        enableArrowFunctions: true,
      };
      expectResult(
        'if (length(scores) > 0) then if (avg(scores) >= 90) then "Excellent" else if (avg(scores) >= 70) then "Good" else "Needs improvement" else "No data"',
        'Good',
        { scores: [80, 75, 85] },
        opts,
      );
      expectResult(
        'if (length(scores) > 0) then if (avg(scores) >= 90) then "Excellent" else if (avg(scores) >= 70) then "Good" else "Needs improvement" else "No data"',
        'No data',
        { scores: [] },
        opts,
      );
      expectResult(
        'if (length(scores) > 0) then if (avg(scores) >= 90) then "Excellent" else if (avg(scores) >= 70) then "Good" else "Needs improvement" else "No data"',
        'Excellent',
        { scores: [95, 92, 98] },
        opts,
      );
    });

    test('string manipulation based on conditions', () => {
      expectResult(
        'if (length(name) > 10) then substring(name, 0, 10) + "..." else name',
        'Christophe...',
        { name: 'Christopher Columbus' },
      );
      expectResult(
        'if (length(name) > 10) then substring(name, 0, 10) + "..." else name',
        'Alice',
        { name: 'Alice' },
      );
    });

    test('multi-field validation', () => {
      const expr =
        'if (age < 0) then "Invalid age" else if (age < 13) then "Child" else if (age < 18) then "Teen" else if (age < 65) then "Adult" else "Senior"';
      expectResult(expr, 'Invalid age', { age: -1 });
      expectResult(expr, 'Child', { age: 5 });
      expectResult(expr, 'Teen', { age: 15 });
      expectResult(expr, 'Adult', { age: 30 });
      expectResult(expr, 'Senior', { age: 70 });
    });
  });
});
