import { builtInFunctions } from './functions/index.js';
import { ExpressionOptions } from './types.js';

/**
 * A function name resolved to the custom or built-in function it calls
 */
export type ResolvedFunction = {
  readonly source: 'custom' | 'builtin';
  /** The registered name (its spelling in customFunctions or the built-ins) */
  readonly name: string;
};

const hasOwn = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Find the key of `table` matching `name` regardless of letter case
 */
const findIgnoringCase = (table: object, name: string): string | null => {
  const lower = name.toLowerCase();
  return Object.keys(table).find((key) => key.toLowerCase() === lower) ?? null;
};

/**
 * Resolve a called name to an exactly matching custom or built-in function.
 * Custom functions take precedence over built-ins with the same name.
 */
export const resolveExactFunction = (
  name: string,
  options: ExpressionOptions,
): ResolvedFunction | null => {
  const custom = options.customFunctions ?? {};
  if (hasOwn(custom, name)) return { source: 'custom', name };
  if (hasOwn(builtInFunctions, name)) return { source: 'builtin', name };
  return null;
};

/**
 * With `caseInsensitiveNames`, resolve a called name to a custom or built-in
 * function whose name differs only in letter case (custom first). Null when
 * the option is off or nothing matches.
 */
export const resolveFunctionIgnoringCase = (
  name: string,
  options: ExpressionOptions,
): ResolvedFunction | null => {
  if (!options.caseInsensitiveNames) return null;
  const custom = findIgnoringCase(options.customFunctions ?? {}, name);
  if (custom !== null) return { source: 'custom', name: custom };
  const builtin = findIgnoringCase(builtInFunctions, name);
  return builtin !== null ? { source: 'builtin', name: builtin } : null;
};

/**
 * Resolve a called name to a custom or built-in function: an exact match
 * first, then (with `caseInsensitiveNames`) one differing only in case.
 */
export const resolveLibraryFunction = (
  name: string,
  options: ExpressionOptions,
): ResolvedFunction | null =>
  resolveExactFunction(name, options) ??
  resolveFunctionIgnoringCase(name, options);
