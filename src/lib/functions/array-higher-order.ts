import { checkSecurityLimits, EvaluatorContext } from '../security.js';

/**
 * Higher-order array functions that need EvaluatorContext for security limits.
 * These functions receive the context as their first argument, which is
 * injected by the evaluator before calling.
 */
export const arrayHigherOrderFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Maps each element through a function */
  map: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];
    if (typeof fn !== 'function') return array;

    try {
      const mapFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.map((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return mapFn(val, i, arr);
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return [];
    }
  },

  /** Filters elements by a predicate function */
  filter: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];
    if (typeof fn !== 'function') return array;

    try {
      const filterFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.filter((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(filterFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return [];
    }
  },

  /** Finds the first element matching a predicate */
  find: (contextObj: unknown, array: unknown, fn: unknown): unknown => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return null;
    if (typeof fn !== 'function') return null;

    try {
      const findFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      const result = array.find((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(findFn(val, i, arr));
      });
      return result === undefined ? null : result;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  },

  /** Finds the index of the first element matching a predicate */
  findIndex: (contextObj: unknown, array: unknown, fn: unknown): number => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return -1;
    if (typeof fn !== 'function') return -1;

    try {
      const findFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.findIndex((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(findFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return -1;
    }
  },

  /** Reduces an array to a single value */
  reduce: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
    initialValue?: unknown,
  ): unknown => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return null;
    if (typeof fn !== 'function') return array;

    try {
      const reduceFn = fn as (
        acc: unknown,
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      const reducer = (
        acc: unknown,
        val: unknown,
        i: number,
        arr: unknown[],
      ) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return reduceFn(acc, val, i, arr);
      };

      return initialValue !== undefined
        ? array.reduce(reducer, initialValue)
        : array.reduce(reducer);
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  },

  /** Returns true if every element satisfies the predicate */
  every: (contextObj: unknown, array: unknown, fn: unknown): boolean => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return false;
    if (typeof fn !== 'function') return false;

    try {
      const everyFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.every((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(everyFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return false;
    }
  },

  /** Returns true if at least one element satisfies the predicate */
  some: (contextObj: unknown, array: unknown, fn: unknown): boolean => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return false;
    if (typeof fn !== 'function') return false;

    try {
      const someFn = fn as (
        val: unknown,
        index: number,
        arr: unknown[],
      ) => unknown;
      return array.some((val, i, arr) => {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        return Boolean(someFn(val, i, arr));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return false;
    }
  },

  /** Sorts an array (default: numeric for numbers, locale for strings) */
  sort: (contextObj: unknown, array: unknown): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];

    context.securityContext.loopIterations.value += array.length;
    const limitError = checkSecurityLimits(
      context.securityContext,
      context.options,
    );
    if (limitError) throw limitError;

    const copy = [...array];
    return copy.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      const strA = String(a);
      const strB = String(b);
      return strA.localeCompare(strB);
    });
  },

  /** Reverses the elements of an array */
  reverse: (contextObj: unknown, array: unknown): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];

    context.securityContext.loopIterations.value += array.length;
    const limitError = checkSecurityLimits(
      context.securityContext,
      context.options,
    );
    if (limitError) throw limitError;

    const copy = [...array];
    return copy.reverse();
  },

  /** Sorts an array by a computed key */
  sortBy: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];
    if (typeof fn !== 'function') return [...array];

    context.securityContext.loopIterations.value += array.length * 2;
    const limitError = checkSecurityLimits(
      context.securityContext,
      context.options,
    );
    if (limitError) throw limitError;

    try {
      const keyFn = fn as (val: unknown) => unknown;
      const copy = [...array];
      return copy.sort((a, b) => {
        const ka = keyFn(a);
        const kb = keyFn(b);
        if (typeof ka === 'number' && typeof kb === 'number') return ka - kb;
        return String(ka).localeCompare(String(kb));
      });
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return [...array];
    }
  },

  /** Returns the element for which fn returns the minimum value */
  minBy: (contextObj: unknown, array: unknown, fn: unknown): unknown => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array) || array.length === 0) return null;
    if (typeof fn !== 'function') return null;

    try {
      const keyFn = fn as (val: unknown) => unknown;
      let minItem = array[0];
      let minVal = Number(keyFn(array[0]));
      for (let i = 1; i < array.length; i++) {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        const val = Number(keyFn(array[i]));
        if (val < minVal) {
          minVal = val;
          minItem = array[i];
        }
      }
      return minItem;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  },

  /** Returns the element for which fn returns the maximum value */
  maxBy: (contextObj: unknown, array: unknown, fn: unknown): unknown => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array) || array.length === 0) return null;
    if (typeof fn !== 'function') return null;

    try {
      const keyFn = fn as (val: unknown) => unknown;
      let maxItem = array[0];
      let maxVal = Number(keyFn(array[0]));
      for (let i = 1; i < array.length; i++) {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        const val = Number(keyFn(array[i]));
        if (val > maxVal) {
          maxVal = val;
          maxItem = array[i];
        }
      }
      return maxItem;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  },

  /** Sums values computed by fn for each element */
  sumBy: (contextObj: unknown, array: unknown, fn: unknown): number => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return 0;
    if (typeof fn !== 'function') return 0;

    try {
      const keyFn = fn as (val: unknown) => unknown;
      let total = 0;
      for (let i = 0; i < array.length; i++) {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        total += Number(keyFn(array[i]));
      }
      return total;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return 0;
    }
  },

  /** Groups elements by a computed key, returning an object of arrays */
  groupBy: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): Record<string, unknown[]> => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return {};
    if (typeof fn !== 'function') return {};

    try {
      const keyFn = fn as (val: unknown) => unknown;
      const result: Record<string, unknown[]> = {};
      for (let i = 0; i < array.length; i++) {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        const key = String(keyFn(array[i]));
        if (!result[key]) result[key] = [];
        result[key].push(array[i]);
      }
      return result;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return {};
    }
  },

  /** Returns unique elements by a computed key */
  distinctBy: (
    contextObj: unknown,
    array: unknown,
    fn: unknown,
  ): readonly unknown[] => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return [];
    if (typeof fn !== 'function') return [...array];

    try {
      const keyFn = fn as (val: unknown) => unknown;
      const seen = new Set<unknown>();
      const result: unknown[] = [];
      for (let i = 0; i < array.length; i++) {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        const key = keyFn(array[i]);
        if (!seen.has(key)) {
          seen.add(key);
          result.push(array[i]);
        }
      }
      return result;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return [];
    }
  },

  /** Counts elements matching a predicate */
  countBy: (contextObj: unknown, array: unknown, fn: unknown): number => {
    const context = contextObj as EvaluatorContext;
    if (!Array.isArray(array)) return 0;
    if (typeof fn !== 'function') return array.length;

    try {
      const predFn = fn as (val: unknown) => unknown;
      let count = 0;
      for (let i = 0; i < array.length; i++) {
        context.securityContext.loopIterations.value++;
        const limitError = checkSecurityLimits(
          context.securityContext,
          context.options,
        );
        if (limitError) throw limitError;
        if (Boolean(predFn(array[i]))) count++;
      }
      return count;
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return 0;
    }
  },
};

/** Names of higher-order functions that receive the EvaluatorContext as first arg */
export const contextPassingFunctions: readonly string[] = [
  'map',
  'filter',
  'find',
  'findIndex',
  'reduce',
  'every',
  'some',
  'sort',
  'reverse',
  'sortBy',
  'minBy',
  'maxBy',
  'sumBy',
  'groupBy',
  'distinctBy',
  'countBy',
];
