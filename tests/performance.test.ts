import { describe, expect, test } from '@jest/globals';
import {
  compileExpression,
  evaluateExpression,
} from '../src/lib/taion-expression.js';

/**
 * Measures average execution time over N iterations.
 * Returns time in microseconds per operation.
 */
const benchmark = (fn: () => void, iterations: number): number => {
  // Warm up
  for (let i = 0; i < 100; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  return (elapsed / iterations) * 1000; // microseconds
};

const ITERATIONS = 10_000;

describe('Performance: taion-expression vs native JS', () => {
  test('simple arithmetic', () => {
    const context = { x: 10, y: 20 };

    const exprUs = benchmark(
      () => evaluateExpression('x + y * 2', context),
      ITERATIONS,
    );

    const jsUs = benchmark(() => {
      const { x, y } = context;
      return x + y * 2;
    }, ITERATIONS);

    console.log(`  Arithmetic:  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(5000);
  });

  test('simple arithmetic (pre-compiled)', () => {
    const context = { x: 10, y: 20 };
    const compiled = compileExpression('x + y * 2');
    if (!compiled.success) throw new Error('compile failed');
    const evaluate = compiled.result.evaluate;

    const exprUs = benchmark(() => evaluate(context), ITERATIONS);

    const jsUs = benchmark(() => {
      const { x, y } = context;
      return x + y * 2;
    }, ITERATIONS);

    console.log(`  Arithmetic (compiled):  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(500);
  });

  test('string operations', () => {
    const context = { name: 'hello world' };

    const exprUs = benchmark(
      () => evaluateExpression('toUpperCase(name) + " " + length(name)', context),
      ITERATIONS,
    );

    const jsUs = benchmark(() => {
      const { name } = context;
      return name.toUpperCase() + ' ' + name.length;
    }, ITERATIONS);

    console.log(`  String ops:  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(5000);
  });

  test('conditional / ternary', () => {
    const context = { score: 85 };

    const exprUs = benchmark(
      () => evaluateExpression('score >= 90 ? "A" : score >= 80 ? "B" : "C"', context),
      ITERATIONS,
    );

    const jsUs = benchmark(() => {
      const { score } = context;
      return score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
    }, ITERATIONS);

    console.log(`  Ternary:  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(5000);
  });

  test('object property access', () => {
    const context = {
      user: { name: 'Alice', address: { city: 'London' } },
    };

    const exprUs = benchmark(
      () => evaluateExpression('user.name + " from " + user.address.city', context),
      ITERATIONS,
    );

    const jsUs = benchmark(() => {
      const { user } = context;
      return user.name + ' from ' + user.address.city;
    }, ITERATIONS);

    console.log(`  Property access:  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(5000);
  });

  test('array functions', () => {
    const context = { nums: [1, 2, 3, 4, 5] };

    const exprUs = benchmark(
      () => evaluateExpression('sum(nums) + avg(nums)', context),
      ITERATIONS,
    );

    const jsUs = benchmark(() => {
      const { nums } = context;
      const s = nums.reduce((a, b) => a + b, 0);
      return s + s / nums.length;
    }, ITERATIONS);

    console.log(`  Array funcs:  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(5000);
  });

  test('compile-once, evaluate-many', () => {
    const compiled = compileExpression('x * x + y * y');
    if (!compiled.success) throw new Error('compile failed');
    const evaluate = compiled.result.evaluate;

    const exprUs = benchmark(
      () => evaluate({ x: 3, y: 4 }),
      ITERATIONS,
    );

    const jsUs = benchmark(() => {
      const x = 3, y = 4;
      return x * x + y * y;
    }, ITERATIONS);

    console.log(`  Pre-compiled:  expr=${exprUs.toFixed(1)}us  js=${jsUs.toFixed(3)}us  ratio=${(exprUs / jsUs).toFixed(0)}x`);
    expect(exprUs).toBeLessThan(500);
  });
});
