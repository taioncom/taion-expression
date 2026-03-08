import {
  createCompilationError,
  ExpressionNode,
  ExpressionOptions,
} from './types.js';

/**
 * Security context for monitoring evaluation state
 */
export type SecurityContext = {
  readonly startTime: number;
  readonly callStackDepth: number;
  readonly nodeCount: { value: number };
  readonly loopIterations: { value: number };
};

// Create a new security context
export const createSecurityContext = (): SecurityContext => ({
  startTime: Date.now(),
  callStackDepth: 0,
  nodeCount: { value: 0 },
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
    options.maxComplexity !== undefined &&
    securityContext.nodeCount.value > options.maxComplexity
  ) {
    return createCompilationError(
      `Expression too complex: maximum of ${options.maxComplexity} nodes exceeded`,
      'MAX_COMPLEXITY_EXCEEDED',
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
  readonly allowedPropertyStrings: readonly string[];
};

// Build the full dotted property path from a member expression AST node.
// For `user.address.city`, returns "user.address.city".
// Returns null for non-static paths (e.g. computed access).
export const getPropertyPath = (node: ExpressionNode): string | null => {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression') {
    const objectPath = getPropertyPath(node.object);
    if (objectPath !== null) return `${objectPath}.${node.property.name}`;
  }
  return null;
};

// Check if a pattern matches either the full path or the leaf property name.
const patternMatches = (
  pattern: RegExp,
  fullPath: string,
  leafName: string,
): boolean => pattern.test(fullPath) || pattern.test(leafName);

// Check if a property access is allowed based on security settings
export const isPropertyAccessAllowed = (
  leafName: string,
  fullPath: string,
  context: EvaluatorContext,
): boolean => {
  const { options, compiledAllowedProperties, compiledDeniedProperties } =
    context;

  // Always block prototype pollution vectors globally unless explicitly permitted
  if (['__proto__', 'constructor', 'prototype'].includes(leafName)) {
    if (!options.allowPrototypeAccess) {
      return false;
    }
  }

  // Check denied properties first
  if (compiledDeniedProperties.length > 0) {
    const isDenied = compiledDeniedProperties.some((pattern) =>
      patternMatches(pattern, fullPath, leafName),
    );
    if (isDenied) {
      return false;
    }
  }

  // If allowedProperties was specified, apply whitelist filtering
  if (options.allowedProperties !== undefined) {
    const isAllowed = compiledAllowedProperties.some((pattern) =>
      patternMatches(pattern, fullPath, leafName),
    );
    if (isAllowed) return true;

    // Allow intermediate path segments: if any allowed pattern string starts
    // with this fullPath followed by a dot, this is a parent path and should
    // be allowed so the child can be reached.
    const isParentPath = context.allowedPropertyStrings.some((p) =>
      p.startsWith(fullPath + '.'),
    );
    return isParentPath;
  }

  // No allowed patterns specified, so it's allowed
  return true;
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
