import { describe, expect, test } from '@jest/globals';
import { evaluateExpression } from '../src/lib/taion-expression.js';

/**
 * Alternative approach to testing arrow functions
 * These tests use predefined functions in the context that use arrow functions internally,
 * providing an additional verification layer beyond direct arrow function parsing.
 */

describe('Arrow Functions Simplified', () => {
  // Test a map function with an internal arrow function
  test('map with internal arrow function', () => {
    const options = { enableArrays: true };
    const context = {
      numbers: [1, 2, 3, 4, 5],
      double: function (arr: number[]): number[] {
        return arr.map((x) => x * 2);
      },
    };

    const result = evaluateExpression('double(numbers)', context, options);
    expect((result as any).success).toBe(true);
    expect((result as any).result).toEqual([2, 4, 6, 8, 10]);
  });

  // Test filter with an internal arrow function
  test('filter with internal arrow function', () => {
    const options = { enableArrays: true };
    const context = {
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      getEvens: function (arr: number[]): number[] {
        return arr.filter((x) => x % 2 === 0);
      },
    };

    const result = evaluateExpression('getEvens(numbers)', context, options);
    expect((result as any).success).toBe(true);
    expect((result as any).result).toEqual([2, 4, 6, 8, 10]);
  });

  // Test reduce with an internal arrow function
  test('reduce with internal arrow function', () => {
    const options = { enableArrays: true };
    const context = {
      numbers: [1, 2, 3, 4, 5],
      sum: function (arr: number[]): number {
        return arr.reduce((acc: number, x: number) => acc + x, 0);
      },
    };

    const result = evaluateExpression('sum(numbers)', context, options);
    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe(15);
  });

  // Test a complex pipeline with internal arrow functions
  test('complex pipeline with internal arrow functions', () => {
    const options = { enableArrays: true };
    const context = {
      people: [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
        { name: 'Diana', age: 40 },
      ],
      getAdultNames: function (
        people: Array<{ name: string; age: number }>,
      ): string {
        return people
          .filter((p: { name: string; age: number }) => p.age > 30)
          .map((p: { name: string; age: number }) => p.name)
          .join(', ');
      },
    };

    const result = evaluateExpression('getAdultNames(people)', context, options);
    expect((result as any).success).toBe(true);
    expect((result as any).result).toBe('Charlie, Diana');
  });
});
