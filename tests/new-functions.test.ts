import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';

const opts = { enableArrowFunctions: true, enableArrays: true };

/**
 * Tests for newly added built-in functions.
 */

describe('Math functions', () => {
  test('pow', () => {
    const r = evaluateExpression('pow(2, 10)');
    expect(r.success && r.result).toBe(1024);
  });

  test('sqrt', () => {
    const r = evaluateExpression('sqrt(144)');
    expect(r.success && r.result).toBe(12);
  });

  test('log (natural)', () => {
    const r = evaluateExpression('log(1)');
    expect(r.success && r.result).toBe(0);
  });

  test('log10', () => {
    const r = evaluateExpression('log10(1000)');
    expect(r.success && r.result).toBeCloseTo(3);
  });

  test('log2', () => {
    const r = evaluateExpression('log2(8)');
    expect(r.success && r.result).toBe(3);
  });

  test('sign positive', () => {
    const r = evaluateExpression('sign(42)');
    expect(r.success && r.result).toBe(1);
  });

  test('sign negative', () => {
    const r = evaluateExpression('sign(-7)');
    expect(r.success && r.result).toBe(-1);
  });

  test('sign zero', () => {
    const r = evaluateExpression('sign(0)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('trunc', () => {
    const r = evaluateExpression('trunc(4.9)');
    expect(r.success && r.result).toBe(4);
  });

  test('trunc negative', () => {
    const r = evaluateExpression('trunc(-4.9)');
    expect(r.success && r.result).toBe(-4);
  });

  test('mod', () => {
    const r = evaluateExpression('mod(10, 3)');
    expect(r.success && r.result).toBe(1);
  });

  test('clamp within range', () => {
    const r = evaluateExpression('clamp(5, 1, 10)');
    expect(r.success && r.result).toBe(5);
  });

  test('clamp below min', () => {
    const r = evaluateExpression('clamp(-5, 0, 100)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('clamp above max', () => {
    const r = evaluateExpression('clamp(200, 0, 100)');
    expect(r.success && r.result).toBe(100);
  });

  test('lerp', () => {
    const r = evaluateExpression('lerp(0, 10, 0.5)');
    expect(r.success && r.result).toBe(5);
  });

  test('lerp at boundaries', () => {
    const r0 = evaluateExpression('lerp(10, 20, 0)');
    expect(r0.success && r0.result).toBe(10);
    const r1 = evaluateExpression('lerp(10, 20, 1)');
    expect(r1.success && r1.result).toBe(20);
  });

  test('pi()', () => {
    const r = evaluateExpression('pi()');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(Math.PI);
  });

  test('e()', () => {
    const r = evaluateExpression('e()');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(Math.E);
  });
});

describe('Trigonometric functions', () => {
  test('sin(0) = 0', () => {
    const r = evaluateExpression('sin(0)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('cos(0) = 1', () => {
    const r = evaluateExpression('cos(0)');
    expect(r.success && r.result).toBe(1);
  });

  test('tan(0) = 0', () => {
    const r = evaluateExpression('tan(0)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('asin(1) = pi/2', () => {
    const r = evaluateExpression('asin(1)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(Math.PI / 2);
  });

  test('acos(1) = 0', () => {
    const r = evaluateExpression('acos(1)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('atan(0) = 0', () => {
    const r = evaluateExpression('atan(0)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('atan2(1, 1) = pi/4', () => {
    const r = evaluateExpression('atan2(1, 1)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(Math.PI / 4);
  });
});

describe('String functions - new', () => {
  test('trimStart', () => {
    const r = evaluateExpression('trimStart(s)', { s: '  hello  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('hello  ');
  });

  test('trimEnd', () => {
    const r = evaluateExpression('trimEnd(s)', { s: '  hello  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('  hello');
  });

  test('lastIndexOf', () => {
    const r = evaluateExpression('lastIndexOf("abcabc", "c")');
    expect(r.success && r.result).toBe(5);
  });

  test('lastIndexOf not found', () => {
    const r = evaluateExpression('lastIndexOf("abc", "z")');
    expect(r.success && r.result).toBe(-1);
  });

  test('repeat', () => {
    const r = evaluateExpression('repeat("ab", 3)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('ababab');
  });

  test('repeat with 0', () => {
    const r = evaluateExpression('repeat("ab", 0)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('');
  });

  test('repeat with negative returns empty', () => {
    const r = evaluateExpression('repeat("ab", -1)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('');
  });

  test('charAt', () => {
    const r = evaluateExpression('charAt("hello", 1)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('e');
  });

  test('charAt out of bounds', () => {
    const r = evaluateExpression('charAt("hi", 5)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('');
  });

  test('includes (string)', () => {
    const r = evaluateExpression('includes("hello world", "world")');
    expect(r.success && r.result).toBe(true);
  });

  test('includes (array)', () => {
    const r = evaluateExpression('includes(arr, 3)', { arr: [1, 2, 3] }, opts);
    expect(r.success && r.result).toBe(true);
  });

  test('includes (array, not found)', () => {
    const r = evaluateExpression('includes(arr, 9)', { arr: [1, 2, 3] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(false);
  });

  test('concat', () => {
    // Note: null literal in expressions is the string "null" (pre-existing behavior),
    // so test with context variable for true JS null
    const r = evaluateExpression('concat("a", n, "b", 42)', { n: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('ab42');
  });
});

describe('Array functions - new', () => {
  test('median odd', () => {
    const r = evaluateExpression('median(arr)', { arr: [3, 1, 2] }, opts);
    expect(r.success && r.result).toBe(2);
  });

  test('median even', () => {
    const r = evaluateExpression('median(arr)', { arr: [1, 2, 3, 4] }, opts);
    expect(r.success && r.result).toBe(2.5);
  });

  test('median empty', () => {
    const r = evaluateExpression('median(arr)', { arr: [] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });

  test('stddev', () => {
    const r = evaluateExpression('stddev(arr)', { arr: [2, 4, 4, 4, 5, 5, 7, 9] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(2);
  });

  test('variance', () => {
    const r = evaluateExpression('variance(arr)', { arr: [2, 4, 4, 4, 5, 5, 7, 9] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(4);
  });

  test('percentile p50', () => {
    const r = evaluateExpression('percentile(arr, 50)', { arr: [1, 2, 3, 4, 5] }, opts);
    expect(r.success && r.result).toBe(3);
  });

  test('percentile p0 and p100', () => {
    const r0 = evaluateExpression('percentile(arr, 0)', { arr: [10, 20, 30] }, opts);
    expect(r0.success && r0.result).toBe(10);
    const r100 = evaluateExpression('percentile(arr, 100)', { arr: [10, 20, 30] }, opts);
    expect(r100.success && r100.result).toBe(30);
  });

  test('percentile invalid', () => {
    const r = evaluateExpression('percentile(arr, 101)', { arr: [1, 2, 3] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });

  test('unique', () => {
    const r = evaluateExpression('unique(arr)', { arr: [1, 2, 2, 3, 3, 3] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([1, 2, 3]);
  });

  test('compact', () => {
    const r = evaluateExpression('compact(arr)', { arr: [1, null, 2, '', 3, undefined] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([1, 2, 3]);
  });

  test('first and last', () => {
    const rf = evaluateExpression('first(arr)', { arr: [10, 20, 30] }, opts);
    expect(rf.success && rf.result).toBe(10);
    const rl = evaluateExpression('last(arr)', { arr: [10, 20, 30] }, opts);
    expect(rl.success && rl.result).toBe(30);
  });

  test('first and last empty', () => {
    const rf = evaluateExpression('first(arr)', { arr: [] }, opts);
    expect(rf.success).toBe(true);
    if (rf.success) expect(rf.result).toBeNull();
    const rl = evaluateExpression('last(arr)', { arr: [] }, opts);
    expect(rl.success).toBe(true);
    if (rl.success) expect(rl.result).toBeNull();
  });

  test('flat', () => {
    const r = evaluateExpression('flat(arr)', { arr: [[1, 2], [3, 4], [5]] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([1, 2, 3, 4, 5]);
  });

  test('flat with depth', () => {
    const r = evaluateExpression('flat(arr, 2)', { arr: [1, [2, [3, [4]]]] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([1, 2, 3, [4]]);
  });

  test('range basic', () => {
    const r = evaluateExpression('range(0, 5)', {}, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([0, 1, 2, 3, 4]);
  });

  test('range with step', () => {
    const r = evaluateExpression('range(0, 10, 2)', {}, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([0, 2, 4, 6, 8]);
  });

  test('range descending', () => {
    const r = evaluateExpression('range(5, 0)', {}, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([5, 4, 3, 2, 1]);
  });

  test('range empty when start >= end (positive step)', () => {
    const r = evaluateExpression('range(5, 5)', {}, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([]);
  });

  test('chunk', () => {
    const r = evaluateExpression('chunk(arr, 2)', { arr: [1, 2, 3, 4, 5] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('zip', () => {
    const r = evaluateExpression('zip(a, b)', { a: [1, 2, 3], b: ['a', 'b', 'c'] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
  });

  test('zip different lengths', () => {
    const r = evaluateExpression('zip(a, b)', { a: [1, 2], b: ['a', 'b', 'c'] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([[1, 'a'], [2, 'b']]);
  });

  test('count', () => {
    const r = evaluateExpression('count(arr)', { arr: [1, 2, 3, 4] }, opts);
    expect(r.success && r.result).toBe(4);
  });

  test('count non-array', () => {
    const r = evaluateExpression('count(val)', { val: 42 }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });
});

describe('Higher-order array functions - new', () => {
  test('findIndex', () => {
    const r = evaluateExpression('findIndex(arr, x => x > 3)', { arr: [1, 2, 4, 5] }, opts);
    expect(r.success && r.result).toBe(2);
  });

  test('findIndex not found', () => {
    const r = evaluateExpression('findIndex(arr, x => x > 100)', { arr: [1, 2, 3] }, opts);
    expect(r.success && r.result).toBe(-1);
  });

  test('sortBy', () => {
    const items = [{ name: 'c', age: 3 }, { name: 'a', age: 1 }, { name: 'b', age: 2 }];
    const r = evaluateExpression('sortBy(items, x => x.age)', { items }, opts);
    expect(r.success).toBe(true);
    if (r.success) {
      const result = r.result as Array<{ name: string; age: number }>;
      expect(result.map(x => x.name)).toEqual(['a', 'b', 'c']);
    }
  });

  test('minBy', () => {
    const items = [{ name: 'a', val: 5 }, { name: 'b', val: 2 }, { name: 'c', val: 8 }];
    const r = evaluateExpression('minBy(items, x => x.val)', { items }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect((r.result as { name: string }).name).toBe('b');
  });

  test('maxBy', () => {
    const items = [{ name: 'a', val: 5 }, { name: 'b', val: 2 }, { name: 'c', val: 8 }];
    const r = evaluateExpression('maxBy(items, x => x.val)', { items }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect((r.result as { name: string }).name).toBe('c');
  });

  test('sumBy', () => {
    const items = [{ val: 10 }, { val: 20 }, { val: 30 }];
    const r = evaluateExpression('sumBy(items, x => x.val)', { items }, opts);
    expect(r.success && r.result).toBe(60);
  });

  test('groupBy', () => {
    const items = [
      { type: 'a', val: 1 },
      { type: 'b', val: 2 },
      { type: 'a', val: 3 },
    ];
    const r = evaluateExpression('groupBy(items, x => x.type)', { items }, opts);
    expect(r.success).toBe(true);
    if (r.success) {
      const result = r.result as Record<string, unknown[]>;
      expect(result['a']).toHaveLength(2);
      expect(result['b']).toHaveLength(1);
    }
  });

  test('distinctBy', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ];
    const r = evaluateExpression('distinctBy(items, x => x.id)', { items }, opts);
    expect(r.success).toBe(true);
    if (r.success) {
      const result = r.result as Array<{ id: number; name: string }>;
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('a');
      expect(result[1].name).toBe('b');
    }
  });

  test('countBy', () => {
    const r = evaluateExpression('countBy(arr, x => x > 2)', { arr: [1, 2, 3, 4, 5] }, opts);
    expect(r.success && r.result).toBe(3);
  });

  test('countBy without predicate counts all', () => {
    const r = evaluateExpression('countBy(arr, null)', { arr: [1, 2, 3] }, opts);
    expect(r.success && r.result).toBe(3);
  });
});

describe('Object functions - new', () => {
  test('entries', () => {
    const r = evaluateExpression('entries(obj)', { obj: { a: 1, b: 2 } }, opts);
    expect(r.success).toBe(true);
    if (r.success) {
      const result = r.result as Array<[string, number]>;
      expect(result).toContainEqual(['a', 1]);
      expect(result).toContainEqual(['b', 2]);
    }
  });

  test('hasKey true', () => {
    const r = evaluateExpression('hasKey(obj, "a")', { obj: { a: 1 } });
    expect(r.success && r.result).toBe(true);
  });

  test('hasKey false', () => {
    const r = evaluateExpression('hasKey(obj, "z")', { obj: { a: 1 } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(false);
  });

  test('merge', () => {
    const r = evaluateExpression('merge(a, b)', { a: { x: 1 }, b: { y: 2 } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({ x: 1, y: 2 });
  });

  test('merge with override', () => {
    const r = evaluateExpression('merge(a, b)', { a: { x: 1 }, b: { x: 2 } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({ x: 2 });
  });

  test('pick', () => {
    const r = evaluateExpression('pick(obj, "a", "c")', { obj: { a: 1, b: 2, c: 3 } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({ a: 1, c: 3 });
  });

  test('omit', () => {
    const r = evaluateExpression('omit(obj, "b")', { obj: { a: 1, b: 2, c: 3 } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({ a: 1, c: 3 });
  });

  test('fromEntries', () => {
    const r = evaluateExpression('fromEntries(arr)', { arr: [['a', 1], ['b', 2]] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({ a: 1, b: 2 });
  });
});

describe('Type / conversion functions - new', () => {
  test('toBoolean truthy', () => {
    const r = evaluateExpression('toBoolean(1)');
    expect(r.success && r.result).toBe(true);
  });

  test('toBoolean falsy', () => {
    const r = evaluateExpression('toBoolean(0)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(false);
  });

  test('toBoolean null', () => {
    const r = evaluateExpression('toBoolean(n)', { n: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(false);
  });

  test('toInteger', () => {
    const r = evaluateExpression('toInteger(3.9)');
    expect(r.success && r.result).toBe(3);
  });

  test('toInteger invalid', () => {
    const r = evaluateExpression('toInteger("abc")');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });

  test('toFixed', () => {
    const r = evaluateExpression('toFixed(3.14159, 2)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('3.14');
  });

  test('parseInt', () => {
    const r = evaluateExpression('parseInt("ff", 16)');
    expect(r.success && r.result).toBe(255);
  });

  test('parseInt default radix', () => {
    const r = evaluateExpression('parseInt("42")');
    expect(r.success && r.result).toBe(42);
  });

  test('parseFloat', () => {
    const r = evaluateExpression('parseFloat("3.14")');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeCloseTo(3.14);
  });

  test('parseFloat invalid', () => {
    const r = evaluateExpression('parseFloat("abc")');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });

  test('toDate from string', () => {
    const r = evaluateExpression('isDate(toDate("2024-01-15"))');
    expect(r.success && r.result).toBe(true);
  });

  test('toDate from number', () => {
    const r = evaluateExpression('isDate(toDate(0))');
    expect(r.success && r.result).toBe(true);
  });

  test('toDate invalid', () => {
    const r = evaluateExpression('toDate(true)');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });
});

describe('Utility functions - new', () => {
  test('ifElse true', () => {
    const r = evaluateExpression('ifElse(true, "yes", "no")');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('yes');
  });

  test('ifElse false', () => {
    const r = evaluateExpression('ifElse(false, "yes", "no")');
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('no');
  });

  test('defaultTo with value', () => {
    const r = evaluateExpression('defaultTo(5, 10)');
    expect(r.success && r.result).toBe(5);
  });

  test('defaultTo with null', () => {
    const r = evaluateExpression('defaultTo(n, 10)', { n: null });
    expect(r.success && r.result).toBe(10);
  });

  test('jsonStringify', () => {
    const r = evaluateExpression('jsonStringify(obj)', { obj: { a: 1 } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe('{"a":1}');
  });

  test('jsonParse', () => {
    const r = evaluateExpression('jsonParse(s)', { s: '{"a":1}' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({ a: 1 });
  });

  test('jsonParse invalid', () => {
    const r = evaluateExpression('jsonParse(s)', { s: 'not json' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });
});

describe('HOF error handling for new functions', () => {
  test('findIndex with security limit', () => {
    const r = evaluateExpression(
      'findIndex(items, x => x > 10)',
      { items: [1, 2, 3, 4, 5] },
      { enableArrowFunctions: true, maxLoopIterations: 2 },
    );
    expect(r.success).toBe(false);
  });

  test('sortBy with throwing callback returns copy', () => {
    const r = evaluateExpression(
      'sortBy(items, fn)',
      {
        items: [3, 1, 2],
        fn: () => { throw new RangeError('test'); },
      },
      opts,
    );
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([3, 1, 2]);
  });

  test('minBy with empty array', () => {
    const r = evaluateExpression('minBy(arr, x => x)', { arr: [] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });

  test('maxBy with empty array', () => {
    const r = evaluateExpression('maxBy(arr, x => x)', { arr: [] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBeNull();
  });

  test('sumBy with non-array', () => {
    const r = evaluateExpression('sumBy(val, x => x)', { val: 42 }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toBe(0);
  });

  test('groupBy with non-array', () => {
    const r = evaluateExpression('groupBy(val, x => x)', { val: 42 }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual({});
  });

  test('distinctBy with non-function returns copy', () => {
    const r = evaluateExpression('distinctBy(arr, null)', { arr: [1, 2, 3] }, opts);
    expect(r.success).toBe(true);
    if (r.success) expect(r.result).toEqual([1, 2, 3]);
  });
});
