import {
  createCompilationError,
  ExpressionNode,
  ExpressionOptions,
} from './types.js';

/** Maximum length of strings produced by expressions */
export const MAX_STRING_LENGTH = 1000000;

/**
 * Security context for monitoring evaluation state
 */
export type SecurityContext = {
  readonly startTime: number;
  readonly callStackDepth: number;
  readonly loopIterations: { value: number };
};

// Create a new security context
export const createSecurityContext = (): SecurityContext => ({
  startTime: Date.now(),
  callStackDepth: 0,
  loopIterations: { value: 0 },
});

// Check if security limits have been exceeded
export const checkSecurityLimits = (
  securityContext: SecurityContext,
  options: ExpressionOptions,
): Error | null => {
  // Check runtime execution timeout
  if (options.timeout !== undefined && options.timeout > 0) {
    const elapsed = Date.now() - securityContext.startTime;
    if (elapsed > options.timeout) {
      return createCompilationError(
        `Execution timeout: Expression took longer than the allowed ${options.timeout}ms`,
        'TIMEOUT_EXCEEDED',
      );
    }
  }

  if (
    options.maxCallStackDepth !== undefined &&
    securityContext.callStackDepth > options.maxCallStackDepth
  ) {
    return createCompilationError(
      `Maximum call stack depth of ${options.maxCallStackDepth} exceeded`,
      'MAX_CALL_STACK_EXCEEDED',
    );
  }

  if (
    options.maxLoopIterations !== undefined &&
    securityContext.loopIterations.value > options.maxLoopIterations
  ) {
    return createCompilationError(
      `Maximum loop iterations of ${options.maxLoopIterations} exceeded`,
      'MAX_LOOP_ITERATIONS_EXCEEDED',
    );
  }

  return null;
};

/**
 * Evaluator context for traversal
 */
export type EvaluatorContext = {
  readonly options: ExpressionOptions;
  readonly securityContext: SecurityContext;
  readonly localVariables: Record<string, unknown>;
  readonly rootContext: Record<string, unknown>;
  readonly compiledAllowedProperties: readonly RegExp[];
  readonly compiledDeniedProperties: readonly RegExp[];
};

// Build the full dotted property path from a member expression AST node.
// For `user.address.city` or `user["address"].city`, returns "user.address.city".
// Returns null for non-static paths (e.g. computed access).
export const getPropertyPath = (node: ExpressionNode): string | null => {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression') {
    const objectPath = getPropertyPath(node.object);
    if (objectPath !== null) return `${objectPath}.${node.property.name}`;
  }
  if (
    node.type === 'ArrayIndex' &&
    node.index.type === 'Literal' &&
    node.index.value !== null
  ) {
    const objectPath = getPropertyPath(node.array);
    if (objectPath !== null) return `${objectPath}.${String(node.index.value)}`;
  }
  return null;
};

// Check if a pattern matches either the full path or the leaf property name.
const patternMatches = (
  pattern: RegExp,
  fullPath: string,
  leafName: string,
): boolean => pattern.test(fullPath) || pattern.test(leafName);

/**
 * Check if a property access is allowed based on security settings.
 * Prototype vectors and denied patterns are always blocked. The allowlist
 * restricts values read out of the context, so `intermediate` accesses that only
 * traverse to a child (e.g. `user` in `user.name`) are exempt from it.
 */
export const isPropertyAccessAllowed = (
  leafName: string,
  fullPath: string,
  context: EvaluatorContext,
  intermediate = false,
): boolean => {
  const { options, compiledAllowedProperties, compiledDeniedProperties } =
    context;

  // Always block prototype pollution vectors globally unless explicitly permitted
  if (
    ['__proto__', 'constructor', 'prototype'].includes(leafName) &&
    !options.allowPrototypeAccess
  ) {
    return false;
  }

  const isDenied = compiledDeniedProperties.some((pattern) =>
    patternMatches(pattern, fullPath, leafName),
  );
  if (isDenied) return false;

  // An empty or missing allowlist allows everything
  if (intermediate || compiledAllowedProperties.length === 0) return true;

  return compiledAllowedProperties.some((pattern) =>
    patternMatches(pattern, fullPath, leafName),
  );
};

// Auto-anchor a regex pattern for exact matching.
// If the pattern already starts with ^ or ends with $, leave it as-is.
export const anchorPattern = (pattern: string): string => {
  const anchored =
    (pattern.startsWith('^') ? '' : '^') +
    pattern +
    (pattern.endsWith('$') ? '' : '$');
  return anchored;
};

/**
 * Compile property patterns into anchored regular expressions.
 * Throws a CompilationError with code INVALID_REGEX_PATTERN for invalid patterns.
 */
export const compilePatterns = (
  patterns: readonly string[] | undefined,
): readonly RegExp[] => {
  try {
    return (patterns ?? []).map((p) => new RegExp(anchorPattern(p)));
  } catch (e: unknown) {
    throw createCompilationError(
      `Invalid RegExp pattern in security options: ${e instanceof Error ? e.message : String(e)}`,
      'INVALID_REGEX_PATTERN',
    );
  }
};
